import { DataSourceError } from '../errors'
import * as YahooFinance from '../yahooFinance'
import type { HistoricalData, QuoteData } from '../yahooFinance'

export interface FetchHistoricalOptions {
  period1: Date
  period2: Date
}

export interface YahooDataSource {
  getTrendingTickers(limit?: number): Promise<string[]>
  getGainers(limit?: number): Promise<string[]>
  getLosers(limit?: number): Promise<string[]>
  getHistorical(ticker: string, options: FetchHistoricalOptions): Promise<HistoricalData[]>
  getQuote(ticker: string): Promise<QuoteData>
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

function normalizeLimit(limit?: number): number {
  if (typeof limit !== 'number' || Number.isNaN(limit) || limit <= 0) {
    return DEFAULT_LIMIT
  }

  return Math.min(Math.floor(limit), MAX_LIMIT)
}

function sanitizeTickerSymbol(symbol: string): string | null {
  if (typeof symbol !== 'string') {
    return null
  }

  const trimmed = symbol.trim().toUpperCase()

  if (!trimmed) return null
  if (trimmed.includes('^') || trimmed.includes('=') || trimmed.includes(':')) return null
  if (!/^[A-Z0-9.-]+$/.test(trimmed)) return null

  return trimmed
}

function sanitizeTickers(rawTickers: string[], context: string, limit: number): string[] {
  const cleaned = rawTickers
    .map((symbol) => sanitizeTickerSymbol(symbol))
    .filter((symbol): symbol is string => Boolean(symbol))

  const unique = [...new Set(cleaned)]

  if (unique.length === 0) {
    throw new DataSourceError(`No valid tickers returned for ${context}`)
  }

  return unique.slice(0, limit)
}

function validateHistoricalData(ticker: string, data: HistoricalData[]): HistoricalData[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new DataSourceError(`No historical data available for ${ticker}`)
  }

  const filtered = data.filter((item) => {
    const hasValidPrice = Number.isFinite(item.close)
    const hasValidVolume = Number.isFinite(item.volume)
    const hasDate = item.date instanceof Date && !Number.isNaN(item.date.getTime())

    return hasValidPrice && hasValidVolume && hasDate
  })

  if (filtered.length === 0) {
    throw new DataSourceError(`Historical data for ${ticker} is missing price or volume information`)
  }

  filtered.sort((a, b) => a.date.getTime() - b.date.getTime())

  return filtered
}

function validateQuoteData(ticker: string, data: QuoteData): QuoteData {
  if (!data || typeof data !== 'object') {
    throw new DataSourceError(`Quote data for ${ticker} is unavailable`)
  }

  if (!Number.isFinite(data.regularMarketPrice)) {
    throw new DataSourceError(`Quote missing price data for ${ticker}`)
  }

  if (!Number.isFinite(data.regularMarketVolume)) {
    throw new DataSourceError(`Quote missing volume data for ${ticker}`)
  }

  return data
}

export class YahooFinanceAdapter implements YahooDataSource {
  async getTrendingTickers(limit: number = DEFAULT_LIMIT): Promise<string[]> {
    const targetLimit = normalizeLimit(limit)

    try {
      const tickers = await YahooFinance.trending(targetLimit)
      return sanitizeTickers(tickers, 'trending', targetLimit)
    } catch (error) {
      throw new DataSourceError('Failed to fetch trending tickers', { cause: error })
    }
  }

  async getGainers(limit: number = DEFAULT_LIMIT): Promise<string[]> {
    const targetLimit = normalizeLimit(limit)

    try {
      const tickers = await YahooFinance.screener('gainers', targetLimit)
      return sanitizeTickers(tickers, 'gainers', targetLimit)
    } catch (error) {
      throw new DataSourceError('Failed to fetch top gainers', { cause: error })
    }
  }

  async getLosers(limit: number = DEFAULT_LIMIT): Promise<string[]> {
    const targetLimit = normalizeLimit(limit)

    try {
      const tickers = await YahooFinance.screener('losers', targetLimit)
      return sanitizeTickers(tickers, 'losers', targetLimit)
    } catch (error) {
      throw new DataSourceError('Failed to fetch top losers', { cause: error })
    }
  }

  async getHistorical(ticker: string, options: FetchHistoricalOptions): Promise<HistoricalData[]> {
    try {
      const data = await YahooFinance.historical(ticker, options)
      return validateHistoricalData(ticker, data)
    } catch (error) {
      if (error instanceof DataSourceError) {
        throw error
      }
      throw new DataSourceError(`Failed to fetch historical data for ${ticker}`, { cause: error })
    }
  }

  async getQuote(ticker: string): Promise<QuoteData> {
    try {
      const data = await YahooFinance.quote(ticker)
      return validateQuoteData(ticker, data)
    } catch (error) {
      if (error instanceof DataSourceError) {
        throw error
      }
      throw new DataSourceError(`Failed to fetch quote for ${ticker}`, { cause: error })
    }
  }
}

export const yahooFinanceAdapter = new YahooFinanceAdapter()
