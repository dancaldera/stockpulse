import type { Context } from 'hono'
import { dashboardHTML } from '../../dashboard'
import type { Bindings } from '../../types'

export function createDashboardHandler() {
  return (c: Context<{ Bindings: Bindings }>) => c.html(dashboardHTML)
}
