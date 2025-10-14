import { DurableObject } from 'cloudflare:workers'
import type { Bindings } from './types'

export class RateLimiter extends DurableObject {
  private counters: number[] = []

  constructor(
    state: DurableObjectState,
    public env: Bindings,
  ) {
    super(state, env)
    // Initialize state if needed
  }

  async fetch(_request: Request): Promise<Response> {
    const current_time = Date.now()
    const window_size = 60 * 1000 // 1 minute window
    const max_requests = 100 // 100 requests per minute

    // Clean old entries (requests older than the window)
    const cutoff_time = current_time - window_size
    this.counters = this.counters.filter((timestamp) => timestamp > cutoff_time)

    // Check if rate limited
    if (this.counters.length >= max_requests) {
      const oldestRequest = Math.min(...this.counters)
      const retryAfter = Math.floor((oldestRequest + window_size - current_time) / 1000)

      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      })
    }

    // Add current request timestamp
    this.counters.push(current_time)

    return new Response('OK', { status: 200 })
  }
}

export class RateLimitManager {
  private namespace: DurableObjectNamespace

  constructor(namespace: DurableObjectNamespace) {
    this.namespace = namespace
  }

  async checkRateLimit(clientId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      const stub = this.namespace.get(this.namespace.idFromName(clientId))

      const response = await stub.fetch('https://example.com/check')
      const success = response.status === 200

      if (!success) {
        const retryAfter = response.headers.get('Retry-After')
        return {
          allowed: false,
          retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
        }
      }

      return { allowed: true }
    } catch (error) {
      // In case of error, allow the request (fail open)
      console.error('Rate limit check failed:', error)
      return { allowed: true }
    }
  }
}
