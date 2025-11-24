import { Hono } from 'hono'
import type { Bindings } from '../types'
import { SignalRepository } from '../db/signal-repository'

export function createSignalsRouter() {
  const router = new Hono<{ Bindings: Bindings }>()

  router.get('/history/:ticker', async (c) => {
    if (!c.env.DB) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    const ticker = c.req.param('ticker')
    const limit = Math.min(parseInt(c.req.query('limit') || '30', 10), 100)
    const repository = new SignalRepository(c.env.DB)

    try {
      const signals = await repository.getSignalHistory(ticker, limit)
      return c.json({
        ticker: ticker.toUpperCase(),
        count: signals.length,
        signals,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ error: message }, 500)
    }
  })

  router.get('/latest', async (c) => {
    if (!c.env.DB) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    const recommendation = c.req.query('recommendation')
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100)
    const repository = new SignalRepository(c.env.DB)

    try {
      const signals = recommendation
        ? await repository.getLatestSignals(recommendation, limit)
        : await repository.getAllLatestSignals(limit)

      return c.json({
        count: signals.length,
        filter: recommendation || 'all',
        signals,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ error: message }, 500)
    }
  })

  router.get('/runs', async (c) => {
    if (!c.env.DB) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50)
    const repository = new SignalRepository(c.env.DB)

    try {
      const runs = await repository.getSignalRuns(limit)
      return c.json({
        count: runs.length,
        runs,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ error: message }, 500)
    }
  })

  router.get('/dates', async (c) => {
    if (!c.env.DB) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    const limit = Math.min(parseInt(c.req.query('limit') || '30', 10), 100)
    const repository = new SignalRepository(c.env.DB)

    try {
      const timestamps = await repository.getUniqueTimestamps(limit)
      return c.json({
        count: timestamps.length,
        timestamps,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ error: message }, 500)
    }
  })

  router.get('/by-date/:date', async (c) => {
    if (!c.env.DB) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    const date = c.req.param('date')
    const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 200)
    const repository = new SignalRepository(c.env.DB)

    try {
      const signals = await repository.getSignalsByDate(date, limit)
      return c.json({
        date,
        count: signals.length,
        signals,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ error: message }, 500)
    }
  })

  return router
}
