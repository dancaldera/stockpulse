import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from '../types'
import type { StockAnalyzer } from '../analyzer'
import { createRateLimitMiddleware, type Logger, type RateLimiterFactory } from './middleware'
import { createDashboardHandler } from './controllers/dashboard'
import { createHealthHandler } from './controllers/health'
import { createAnalyzeHandler, type CacheManagerFactory } from './controllers/analyze'
import { createBatchHandler } from './controllers/batch'
import { createScannerGetHandler, createScannerPostHandler } from './controllers/scanner'
import type { TickerFetcher, TickerFetcherConfig } from '../tickerFetcher'
import { mapErrorToResponse } from '../errors'

export interface AppDependencies {
  analyzer: StockAnalyzer
  createCacheManager: CacheManagerFactory
  getRateLimiter: RateLimiterFactory
  createTickerFetcher: (config: TickerFetcherConfig) => TickerFetcher
  logger?: Logger
}

export function createApp(deps: AppDependencies) {
  const app = new Hono<{ Bindings: Bindings }>()

  app.use('/*', cors())
  app.use('/*', createRateLimitMiddleware(deps.getRateLimiter, deps.logger))

  app.onError((err, c) => {
    const { status, body } = mapErrorToResponse(err)
    return c.json(body, status)
  })

  const dashboardHandler = createDashboardHandler()
  const healthHandler = createHealthHandler()
  const analyzeHandler = createAnalyzeHandler({
    analyzer: deps.analyzer,
    createCacheManager: deps.createCacheManager,
    logger: deps.logger,
  })
  const batchHandler = createBatchHandler({
    analyzer: deps.analyzer,
    logger: deps.logger,
  })
  const scannerHandlers = {
    get: createScannerGetHandler({
      analyzer: deps.analyzer,
      createTickerFetcher: deps.createTickerFetcher,
      logger: deps.logger,
    }),
    post: createScannerPostHandler({
      analyzer: deps.analyzer,
      logger: deps.logger,
    }),
  }

  app.get('/', dashboardHandler)
  app.get('/api/health', healthHandler)
  app.get('/api/analyze/:ticker', analyzeHandler)
  app.post('/api/batch', batchHandler)
  app.get('/api/scanner', scannerHandlers.get)
  app.post('/api/scanner', scannerHandlers.post)

  return app
}
