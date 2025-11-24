import type { Bindings, StockSignal } from '../types'
import { SignalRepository } from '../db/signal-repository'
import { StockAnalyzer } from '../analyzer'
import { TickerFetcher } from '../tickerFetcher'

const CURATED_TICKERS = [
  'AAPL',
  'AMD',
  'ORCL',
  'TSLA',
  'INTC',
  'NVDA',
  'GOOGL',
  'GS',
  'NFLX',
  'AMZN',
  'MS',
  'META',
  'CSCO',
  'WFC',
  'JPM',
  'BAC',
  'CRM',
  'V',
  'ADBE',
]

const MAX_TICKERS = 50

export async function handleSignalArchive(env: Bindings): Promise<void> {
  if (!env.DB) {
    console.error('D1 database not configured')
    return
  }

  const startTime = Date.now()
  const repository = new SignalRepository(env.DB)
  const analyzer = new StockAnalyzer()
  const fetcher = new TickerFetcher({
    strategy: 'most_active',
    limit: MAX_TICKERS - CURATED_TICKERS.length,
  })

  let tickersAnalyzed = 0
  let signalsSaved = 0
  let errorMessage: string | undefined

  try {
    // Fetch trending tickers
    const trendingTickers = await fetcher.fetchTickers()

    // Merge with curated list and dedupe
    const allTickers = [...new Set([...CURATED_TICKERS, ...trendingTickers])]
    const tickers = allTickers.slice(0, MAX_TICKERS)

    tickersAnalyzed = tickers.length

    // Analyze all tickers
    const signals: StockSignal[] = []
    const errors: string[] = []

    for (const ticker of tickers) {
      try {
        const signal = await analyzer.analyze(ticker, env.STOCK_CACHE)
        signals.push(signal)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${ticker}: ${msg}`)
      }
    }

    // Save signals to D1
    if (signals.length > 0) {
      signalsSaved = await repository.saveSignals(signals)
    }

    if (errors.length > 0) {
      errorMessage = errors.slice(0, 5).join('; ')
      if (errors.length > 5) {
        errorMessage += `... and ${errors.length - 5} more`
      }
    }

    const status = errors.length === 0 ? 'success' : signals.length > 0 ? 'partial' : 'failed'
    const duration = Date.now() - startTime

    await repository.saveRun(tickersAnalyzed, signalsSaved, duration, status, errorMessage)
  } catch (error) {
    const duration = Date.now() - startTime
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await repository.saveRun(tickersAnalyzed, signalsSaved, duration, 'failed', errorMessage)
  }
}
