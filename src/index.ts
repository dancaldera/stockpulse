import { StockAnalyzer } from './analyzer'
import { CacheManager } from './utils'
import { RateLimitManager, RateLimiter } from './rateLimiter'
import { createApp } from './http/app'
import type { Bindings } from './types'
import { TickerFetcher } from './tickerFetcher'

const analyzer = new StockAnalyzer()

const app = createApp({
  analyzer,
  createCacheManager: (env: Bindings) => new CacheManager(env.STOCK_CACHE, analyzer.getConfig().cacheTtl),
  getRateLimiter: (env: Bindings) => (env.RATE_LIMITER ? new RateLimitManager(env.RATE_LIMITER) : null),
  createTickerFetcher: (config) => new TickerFetcher(config),
})

export default app

export { RateLimiter }
