import type { Context } from 'hono'
import { validateTicker } from '../../utils'
import { AnalysisError, ValidationError } from '../../errors'
import type { StockAnalyzer } from '../../analyzer'
import type { Bindings, ValidationResult } from '../../types'
import type { Logger } from '../middleware'

export interface BatchControllerDeps {
  analyzer: StockAnalyzer
  logger?: Logger
}

export function createBatchHandler(deps: BatchControllerDeps) {
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

    if (tickers.length > 10) {
      throw new ValidationError('Maximum 10 tickers per request')
    }

    const sanitizedTickers: string[] = []
    const validationErrors: { ticker: string; errors: string[] }[] = []

    tickers.forEach((ticker) => {
      const validation: ValidationResult = validateTicker(String(ticker))
      if (validation.isValid) {
        sanitizedTickers.push(validation.sanitizedTicker)
      } else {
        validationErrors.push({ ticker: String(ticker), errors: validation.errors })
      }
    })

    if (validationErrors.length > 0) {
      deps.logger?.warn?.('Batch validation errors', { validationErrors })
      throw new ValidationError('Invalid ticker symbols found', { details: validationErrors, cause: validationErrors })
    }

    try {
      const results = await Promise.allSettled(sanitizedTickers.map((ticker) => deps.analyzer.analyze(ticker)))

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
        }

        deps.logger?.error?.('Batch analysis failed', { ticker: originalTicker, error: result.reason })
        return {
          ticker: typeof originalTicker === 'string' ? originalTicker.toUpperCase() : originalTicker,
          error: 'Analysis failed',
        }
      })

      return c.json({
        success: true,
        data,
      })
    } catch (error) {
      deps.logger?.error?.('Batch analysis error', { error })
      throw new AnalysisError('Batch analysis failed', { cause: error })
    }
  }
}
