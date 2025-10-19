import type { Context, Next } from 'hono'
import type { Bindings } from '../types'
import { RateLimitError } from '../errors'
import type { RateLimitManager } from '../rateLimiter'

export interface Logger {
  debug?(message: string, meta?: Record<string, unknown>): void
  info?(message: string, meta?: Record<string, unknown>): void
  warn?(message: string, meta?: Record<string, unknown>): void
  error?(message: string, meta?: Record<string, unknown>): void
}

export type RateLimiterFactory = (env: Bindings) => RateLimitManager | null

export const createRateLimitMiddleware =
  (getRateLimiter: RateLimiterFactory, logger?: Logger) => async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const rateLimiter = getRateLimiter(c.env)

    if (!rateLimiter) {
      await next()
      return
    }

    const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'anonymous'

    const response = await rateLimiter.checkRateLimit(clientIp)

    if (!response.allowed) {
      logger?.warn?.('Rate limit exceeded', { clientIp, retryAfter: response.retryAfter })
      throw new RateLimitError('Rate limit exceeded', response.retryAfter)
    }

    await next()
  }
