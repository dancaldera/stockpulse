import type { Context } from 'hono'
import { dashboardTemplate } from '../../dashboard.template'
import type { Bindings } from '../../types'

export function createDashboardHandler() {
  return (c: Context<{ Bindings: Bindings }>) => c.html(dashboardTemplate())
}
