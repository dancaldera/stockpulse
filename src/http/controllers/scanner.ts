import type { Context } from 'hono'
import { validateTicker } from '../../utils'
import { AnalysisError, ValidationError } from '../../errors'
import type { StockAnalyzer } from '../../analyzer'
import type { Bindings, ValidationResult } from '../../types'
import type { TickerFetcher, TickerFetcherConfig } from '../../tickerFetcher'
import type { Logger } from '../middleware'

export interface ScannerGetControllerDeps {
  analyzer: StockAnalyzer
  createTickerFetcher: (config: TickerFetcherConfig) => TickerFetcher
  logger?: Logger
}

export function createScannerGetHandler(deps: ScannerGetControllerDeps) {
  return async (c: Context<{ Bindings: Bindings }>) => {
    try {
      const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50)
      const rawStrategy = c.req.query('strategy') || c.env.TICKER_STRATEGY || 'most_active'
      const allowedStrategies: TickerFetcherConfig['strategy'][] = [
        'most_active',
        'gainers',
        'losers',
        'mixed',
        'static',
      ]
      const strategy = allowedStrategies.includes(rawStrategy as TickerFetcherConfig['strategy'])
        ? (rawStrategy as TickerFetcherConfig['strategy'])
        : 'most_active'
      if (rawStrategy !== strategy) {
        deps.logger?.warn?.('Unsupported scanner strategy provided, falling back to most_active', {
          requested: rawStrategy,
        })
      }

      const fetcher = deps.createTickerFetcher({
        strategy,
        limit,
      })

      const tickers = await fetcher.fetchTickers()
      const results = await Promise.allSettled(tickers.map((ticker) => deps.analyzer.analyze(ticker)))

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
          }
          deps.logger?.error?.('Scanner analysis failed', { ticker: tickers[index], error: result.reason })
          return null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

      data.sort((a, b) => (b?.potential_gain || 0) - (a?.potential_gain || 0))

      return c.json({
        success: true,
        data,
        total: data.length,
        strategy,
      })
    } catch (error) {
      deps.logger?.error?.('Scanner GET failed', { error })
      throw new AnalysisError('Scanner fetch failed', { cause: error })
    }
  }
}

export interface ScannerPostControllerDeps {
  analyzer: StockAnalyzer
  logger?: Logger
}

export function createScannerPostHandler(deps: ScannerPostControllerDeps) {
  return async (c: Context<{ Bindings: Bindings }>) => {
    let body: unknown

    try {
      body = await c.req.json()
    } catch {
      throw new ValidationError('Invalid JSON payload')
    }

    const tickers = Array.isArray((body as { tickers?: unknown }).tickers)
      ? (body as { tickers: unknown[] }).tickers
      : []

    if (!Array.isArray(tickers) || tickers.length === 0) {
      throw new ValidationError('Please provide an array of tickers')
    }

    if (tickers.length > 50) {
      throw new ValidationError('Maximum 50 tickers per request')
    }

    const sanitizedTickers: string[] = []
    const validationErrors: { ticker: string; errors: string[] }[] = []

    tickers.forEach((ticker) => {
      const validation: ValidationResult = validateTicker(String(ticker))
      if (validation.isValid) {
        sanitizedTickers.push(validation.sanitizedTicker)
      } else {
        validationErrors.push({
          ticker: String(ticker),
          errors: validation.errors,
        })
      }
    })

    if (validationErrors.length > 0) {
      deps.logger?.warn?.('Scanner POST validation errors', { validationErrors })
      throw new ValidationError('Invalid ticker symbols found', { details: validationErrors, cause: validationErrors })
    }

    try {
      const results = await Promise.allSettled(sanitizedTickers.map((ticker) => deps.analyzer.analyze(ticker)))

      const data = results
        .map((result, index) => {
          const ticker = sanitizedTickers[index]
          if (result.status === 'fulfilled') {
            return {
              ticker,
              recommendation: result.value.recommendation,
              confidence: result.value.confidence,
              price: result.value.price,
              potential_gain: result.value.potential_gain,
              risk_reward_ratio: result.value.risk_reward_ratio,
            }
          }

          deps.logger?.error?.('Scanner POST analysis failed', { ticker, error: result.reason })
          return null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

      data.sort((a, b) => (b?.potential_gain || 0) - (a?.potential_gain || 0))

      return c.json({
        success: true,
        data,
        total: data.length,
      })
    } catch (error) {
      deps.logger?.error?.('Scanner POST failed', { error })
      throw new AnalysisError('Scanner analysis failed', { cause: error })
    }
  }
}
