import type { Context } from 'hono'
import type { Bindings } from '../../types'

export function createHealthHandler() {
  return (c: Context<{ Bindings: Bindings }>) =>
    c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT || 'production',
    })
}
