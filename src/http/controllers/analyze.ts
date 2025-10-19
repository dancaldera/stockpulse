import type { Context } from 'hono'
import { validateTicker } from '../../utils'
import { AnalysisError, ValidationError } from '../../errors'
import type { StockAnalyzer } from '../../analyzer'
import type { CacheManager } from '../../utils'
import type { Bindings, ValidationResult } from '../../types'
import type { Logger } from '../middleware'

export type CacheManagerFactory = (env: Bindings) => CacheManager

export interface AnalyzeControllerDeps {
  analyzer: StockAnalyzer
  createCacheManager: CacheManagerFactory
  logger?: Logger
}

export function createAnalyzeHandler(deps: AnalyzeControllerDeps) {
  return async (c: Context<{ Bindings: Bindings }>) => {
    const tickerInput = c.req.param('ticker')
    const validation: ValidationResult = validateTicker(tickerInput)

    if (!validation.isValid) {
      deps.logger?.warn?.('Ticker validation failed', { ticker: tickerInput, errors: validation.errors })
      throw new ValidationError('Invalid ticker symbol', { cause: validation.errors, details: validation.errors })
    }

    const ticker = validation.sanitizedTicker
    const cacheManager = deps.createCacheManager(c.env)
    const cacheKey = `stock:${ticker}`

    const cached = await cacheManager.get(cacheKey)

    if (cached) {
      return c.json({
        success: true,
        data: cached,
        cached: true,
      })
    }

    try {
      const signal = await deps.analyzer.analyze(ticker)
      await cacheManager.set(cacheKey, signal)

      return c.json({
        success: true,
        data: signal,
        cached: false,
      })
    } catch (error) {
      deps.logger?.error?.('Analysis failed', { ticker, error })
      throw new AnalysisError(`Analysis failed for ${ticker}`, { cause: error })
    }
  }
}
