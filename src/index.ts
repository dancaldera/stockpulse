import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { StockAnalyzer } from './analyzer'
import { CacheManager, StockValidator, RetryHandler } from './utils'
import { RateLimitManager, RateLimiter } from './rateLimiter'
import { Bindings } from './types'
import { dashboardHTML } from './dashboard'
import { TickerFetcher } from './tickerFetcher'

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('/*', cors())

// Initialize analyzer with default configuration
const analyzer = new StockAnalyzer()

/**
 * Rate limiting middleware
 */
const rateLimit = async (c: any, next: any) => {
  if (!c.env.RATE_LIMITER) {
    return await next()
  }

  const rateLimitManager = new RateLimitManager(c.env.RATE_LIMITER)
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'anonymous'
  const rateLimitResponse = await rateLimitManager.checkRateLimit(clientIp)

  if (!rateLimitResponse.allowed) {
    return c.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResponse.retryAfter,
      },
      429,
    )
  }

  await next()
}

// Routes
app.get('/', rateLimit, (c) => {
  return c.html(dashboardHTML)
})

app.get('/api/health', rateLimit, (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'production',
  })
})

app.get('/api/analyze/:ticker', rateLimit, async (c) => {
  const tickerInput = c.req.param('ticker')

  try {
    // Validate and sanitize ticker
    const validation = StockValidator.validateTicker(tickerInput)

    if (!validation.isValid) {
      return c.json(
        {
          success: false,
          error: 'Invalid ticker symbol',
          details: validation.errors,
        },
        400,
      )
    }

    const ticker = validation.sanitizedTicker

    // Initialize cache manager
    const cacheManager = new CacheManager(c.env.STOCK_CACHE, analyzer.getConfig().cacheTtl)

    // Check cache first
    const cacheKey = `stock:${ticker}`
    const cached = await cacheManager.get(cacheKey)

    if (cached) {
      return c.json({
        success: true,
        data: cached,
        cached: true,
      })
    }

    // Analyze stock
    const signal = await analyzer.analyze(ticker)

    // Cache result
    await cacheManager.set(cacheKey, signal)

    return c.json({
      success: true,
      data: signal,
      cached: false,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400,
    )
  }
})

app.post('/api/batch', rateLimit, async (c) => {
  try {
    const body = await c.req.json()
    const tickers = Array.isArray(body.tickers) ? body.tickers : []

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Please provide an array of tickers',
        },
        400,
      )
    }

    if (tickers.length > 10) {
      return c.json(
        {
          success: false,
          error: 'Maximum 10 tickers per request',
        },
        400,
      )
    }

    // Validate all tickers first
    const validatedTickers: { ticker: string; validation: any }[] = []
    const validationErrors: { ticker: string; errors: string[] }[] = []

    for (const ticker of tickers) {
      const validation = StockValidator.validateTicker(ticker)
      if (validation.isValid) {
        validatedTickers.push({
          ticker: validation.sanitizedTicker,
          validation,
        })
      } else {
        validationErrors.push({
          ticker: ticker.toString(),
          errors: validation.errors,
        })
      }
    }

    if (validationErrors.length > 0) {
      return c.json(
        {
          success: false,
          error: 'Invalid ticker symbols found',
          details: validationErrors,
        },
        400,
      )
    }

    const results = await Promise.allSettled(validatedTickers.map((item) => analyzer.analyze(item.ticker)))

    const data = results.map((result, index) => {
      const originalTicker = tickers[index]
      if (result.status === 'fulfilled') {
        return {
          ticker: typeof originalTicker === 'string' ? originalTicker.toUpperCase() : originalTicker,
          recommendation: result.value.recommendation,
          confidence: result.value.confidence,
          price: result.value.price,
          potential_gain: result.value.potential_gain,
        }
      } else {
        return {
          ticker: typeof originalTicker === 'string' ? originalTicker.toUpperCase() : originalTicker,
          error: 'Analysis failed',
        }
      }
    })

    return c.json({
      success: true,
      data,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400,
    )
  }
})

// GET endpoint for top opportunities (uses dynamic ticker fetching)
app.get('/api/scanner', rateLimit, async (c) => {
  try {
    // Get limit from query params (default 20, max 50)
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50)

    // Get strategy from query params or environment
    const strategy = (c.req.query('strategy') || c.env.TICKER_STRATEGY || 'most_active') as any

    // Initialize ticker cache manager
    const tickerCacheManager = c.env.TICKER_CACHE
      ? new CacheManager(c.env.TICKER_CACHE, 1800) // Cache for 30 minutes
      : null

    // Check ticker cache
    const cacheKey = `tickers:${strategy}:${limit}`
    let tickers: string[] = []

    if (tickerCacheManager) {
      const cachedTickers = await tickerCacheManager.get(cacheKey)
      if (cachedTickers && Array.isArray(cachedTickers)) {
        tickers = cachedTickers
      }
    }

    // Fetch tickers if not cached
    if (tickers.length === 0) {
      const tickerFetcher = new TickerFetcher({
        fmpApiKey: c.env.FMP_API_KEY,
        strategy,
        limit,
      })

      tickers = await tickerFetcher.fetchTickers()

      // Cache the result
      if (tickerCacheManager) {
        await tickerCacheManager.set(cacheKey, tickers)
      }
    }

    const results = await Promise.allSettled(tickers.map((ticker) => analyzer.analyze(ticker)))

    const data = results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return {
            ticker: tickers[index],
            recommendation: result.value.recommendation,
            confidence: result.value.confidence,
            price: result.value.price,
            potential_gain: result.value.potential_gain,
            risk_reward_ratio: result.value.risk_reward_ratio,
          }
        } else {
          return null
        }
      })
      .filter((item) => item !== null)

    // Sort by potential gain (descending)
    data.sort((a, b) => (b?.potential_gain || 0) - (a?.potential_gain || 0))

    return c.json({
      success: true,
      data,
      total: data.length,
      strategy,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400,
    )
  }
})

// POST endpoint for custom tickers
app.post('/api/scanner', rateLimit, async (c) => {
  try {
    const body = await c.req.json()
    const tickers = Array.isArray(body.tickers) ? body.tickers : []

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Please provide an array of tickers',
        },
        400,
      )
    }

    if (tickers.length > 50) {
      return c.json(
        {
          success: false,
          error: 'Maximum 50 tickers per request',
        },
        400,
      )
    }

    // Validate all tickers first
    const validatedTickers: { ticker: string; validation: any }[] = []
    const validationErrors: { ticker: string; errors: string[] }[] = []

    for (const ticker of tickers) {
      const validation = StockValidator.validateTicker(ticker)
      if (validation.isValid) {
        validatedTickers.push({
          ticker: validation.sanitizedTicker,
          validation,
        })
      } else {
        validationErrors.push({
          ticker: ticker.toString(),
          errors: validation.errors,
        })
      }
    }

    if (validationErrors.length > 0) {
      return c.json(
        {
          success: false,
          error: 'Invalid ticker symbols found',
          details: validationErrors,
        },
        400,
      )
    }

    const results = await Promise.allSettled(validatedTickers.map((item) => analyzer.analyze(item.ticker)))

    const data = results
      .map((result, index) => {
        const ticker = validatedTickers[index].ticker
        if (result.status === 'fulfilled') {
          return {
            ticker,
            recommendation: result.value.recommendation,
            confidence: result.value.confidence,
            price: result.value.price,
            potential_gain: result.value.potential_gain,
            risk_reward_ratio: result.value.risk_reward_ratio,
          }
        } else {
          return null
        }
      })
      .filter((item) => item !== null)

    // Sort by potential gain (descending)
    data.sort((a, b) => (b?.potential_gain || 0) - (a?.potential_gain || 0))

    return c.json({
      success: true,
      data,
      total: data.length,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400,
    )
  }
})

export default app

// Export Durable Objects
export { RateLimiter }
