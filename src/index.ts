import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { StockAnalyzer } from './analyzer';
import { CacheManager } from './utils';
import { Bindings } from './types';
import { dashboardHTML } from './dashboard';
import { POPULAR_TICKERS } from './tickers';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('/*', cors());

// Initialize analyzer
const analyzer = new StockAnalyzer(50, 200);

// Routes
app.get('/', (c) => {
  return c.html(dashboardHTML);
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'production'
  });
});

app.get('/api/analyze/:ticker', async (c) => {
  const ticker = c.req.param('ticker').toUpperCase();

  try {
    // Initialize cache manager
    const cacheManager = new CacheManager(c.env.STOCK_CACHE, 300);

    // Check cache first
    const cacheKey = `stock:${ticker}`;
    const cached = await cacheManager.get(cacheKey);

    if (cached) {
      return c.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Analyze stock
    const signal = await analyzer.analyze(ticker);

    // Cache result
    await cacheManager.set(cacheKey, signal);

    return c.json({
      success: true,
      data: signal,
      cached: false
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400);
  }
});

app.post('/api/batch', async (c) => {
  try {
    const body = await c.req.json();
    const tickers = body.tickers || [];

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return c.json({
        success: false,
        error: 'Please provide an array of tickers'
      }, 400);
    }

    if (tickers.length > 10) {
      return c.json({
        success: false,
        error: 'Maximum 10 tickers per request'
      }, 400);
    }

    const results = await Promise.allSettled(
      tickers.map(ticker => analyzer.analyze(ticker.toUpperCase()))
    );

    const data = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          ticker: tickers[index].toUpperCase(),
          recommendation: result.value.recommendation,
          confidence: result.value.confidence,
          price: result.value.price,
          potential_gain: result.value.potential_gain
        };
      } else {
        return {
          ticker: tickers[index].toUpperCase(),
          error: 'Analysis failed'
        };
      }
    });

    return c.json({
      success: true,
      data
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400);
  }
});

app.get('/api/scanner', async (c) => {
  try {
    // Get limit from query params (default 20, max 50)
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const tickers = POPULAR_TICKERS.slice(0, limit);

    const results = await Promise.allSettled(
      tickers.map(ticker => analyzer.analyze(ticker))
    );

    const data = results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return {
            ticker: tickers[index],
            recommendation: result.value.recommendation,
            confidence: result.value.confidence,
            price: result.value.price,
            potential_gain: result.value.potential_gain,
            risk_reward_ratio: result.value.risk_reward_ratio
          };
        } else {
          return null;
        }
      })
      .filter(item => item !== null);

    // Sort by potential gain (descending)
    data.sort((a, b) => (b?.potential_gain || 0) - (a?.potential_gain || 0));

    return c.json({
      success: true,
      data,
      total: data.length
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 400);
  }
});

export default app;
