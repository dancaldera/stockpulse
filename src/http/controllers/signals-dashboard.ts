import type { Context } from 'hono'
import { signalsDashboardTemplate } from '../../signals-dashboard.template'
import type { Bindings } from '../../types'

export function createSignalsDashboardHandler() {
  return (c: Context<{ Bindings: Bindings }>) => c.html(signalsDashboardTemplate())
}
