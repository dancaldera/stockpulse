import type { StockSignal } from '../types'

export interface SavedSignal {
  id: number
  ticker: string
  recommendation: string
  confidence: number
  price: number
  target_price: number
  stop_loss: number
  potential_gain: number
  risk: number
  risk_reward_ratio: number
  bullish_count: number | null
  bearish_count: number | null
  reasons: string[]
  timestamp: string
  created_at: string
}

export interface SignalRun {
  id: number
  tickers_analyzed: number
  signals_saved: number
  duration_ms: number | null
  status: string
  error_message: string | null
  run_timestamp: string
}

export class SignalRepository {
  constructor(private db: D1Database) {}

  async saveSignals(signals: StockSignal[]): Promise<number> {
    if (signals.length === 0) return 0

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ticker_signals (
        ticker, recommendation, confidence, price, target_price, stop_loss,
        potential_gain, risk, risk_reward_ratio, bullish_count, bearish_count,
        reasons, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const batch = signals.map((signal) =>
      stmt.bind(
        signal.ticker,
        signal.recommendation,
        signal.confidence,
        signal.price,
        signal.target_price,
        signal.stop_loss,
        signal.potential_gain,
        signal.risk,
        signal.risk_reward_ratio,
        signal.signal_summary?.bullish ?? null,
        signal.signal_summary?.bearish ?? null,
        JSON.stringify(signal.reasons),
        signal.timestamp,
      ),
    )

    const results = await this.db.batch(batch)
    return results.filter((r) => r.success).length
  }

  async saveRun(
    tickersAnalyzed: number,
    signalsSaved: number,
    durationMs: number,
    status: 'success' | 'partial' | 'failed',
    errorMessage?: string,
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO signal_runs (tickers_analyzed, signals_saved, duration_ms, status, error_message)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(tickersAnalyzed, signalsSaved, durationMs, status, errorMessage ?? null)
      .run()
  }

  async getSignalHistory(ticker: string, limit = 30): Promise<SavedSignal[]> {
    const results = await this.db
      .prepare(`SELECT * FROM ticker_signals WHERE ticker = ? ORDER BY timestamp DESC LIMIT ?`)
      .bind(ticker.toUpperCase(), limit)
      .all<SavedSignal>()

    return results.results.map((r) => ({
      ...r,
      reasons: JSON.parse(r.reasons as unknown as string),
    }))
  }

  async getLatestSignals(recommendation?: string, limit = 50): Promise<SavedSignal[]> {
    let query = `
      SELECT * FROM ticker_signals
      WHERE timestamp = (SELECT MAX(timestamp) FROM ticker_signals)
    `
    const params: (string | number)[] = []

    if (recommendation) {
      query += ` AND recommendation = ?`
      params.push(recommendation)
    }

    query += ` ORDER BY potential_gain DESC LIMIT ?`
    params.push(limit)

    const results = await this.db
      .prepare(query)
      .bind(...params)
      .all<SavedSignal>()

    return results.results.map((r) => ({
      ...r,
      reasons: JSON.parse(r.reasons as unknown as string),
    }))
  }

  async getAllLatestSignals(limit = 100): Promise<SavedSignal[]> {
    const results = await this.db
      .prepare(
        `SELECT * FROM ticker_signals
         WHERE timestamp = (SELECT MAX(timestamp) FROM ticker_signals)
         ORDER BY potential_gain DESC LIMIT ?`,
      )
      .bind(limit)
      .all<SavedSignal>()

    return results.results.map((r) => ({
      ...r,
      reasons: JSON.parse(r.reasons as unknown as string),
    }))
  }

  async getSignalRuns(limit = 20): Promise<SignalRun[]> {
    const results = await this.db
      .prepare(`SELECT * FROM signal_runs ORDER BY run_timestamp DESC LIMIT ?`)
      .bind(limit)
      .all<SignalRun>()

    return results.results
  }

  async getUniqueTimestamps(limit = 30): Promise<string[]> {
    const results = await this.db
      .prepare(`SELECT DISTINCT timestamp FROM ticker_signals ORDER BY timestamp DESC LIMIT ?`)
      .bind(limit)
      .all<{ timestamp: string }>()

    return results.results.map((r) => r.timestamp)
  }

  async getSignalsByDate(date: string, limit = 100): Promise<SavedSignal[]> {
    const results = await this.db
      .prepare(
        `SELECT * FROM ticker_signals
         WHERE date(timestamp) = date(?)
         ORDER BY potential_gain DESC LIMIT ?`,
      )
      .bind(date, limit)
      .all<SavedSignal>()

    return results.results.map((r) => ({
      ...r,
      reasons: JSON.parse(r.reasons as unknown as string),
    }))
  }
}
