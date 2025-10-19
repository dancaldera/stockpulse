/**
 * Custom Yahoo Finance API client for Cloudflare Workers
 * This replaces yahoo-finance2 to avoid Node.js dependencies
 */

export interface HistoricalData {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjClose: number
}

export interface QuoteData {
  symbol: string
  regularMarketPrice: number
  regularMarketVolume: number
  trailingPE?: number
  forwardPE?: number
  trailingPegRatio?: number
  profitMargins?: number
  debtToEquity?: number
}

export interface TrendingTicker {
  symbol: string
  name?: string
}

// --- Private Interfaces for API responses ---

interface YahooTrendingResponse {
  finance: {
    result: {
      quotes: { symbol: string }[]
    }[]
  }
}

interface YahooScreenerResponse {
  finance: {
    result: {
      quotes: { symbol: string }[]
    }[]
  }
}

interface YahooChartResponse {
  chart: {
    result: {
      meta: {
        regularMarketPrice: number
        regularMarketVolume: number
      }
      timestamp: number[]
      indicators: {
        quote: {
          close: number[]
          open: number[]
          high: number[]
          low: number[]
          volume: number[]
        }[]
        adjclose?: {
          adjclose: number[]
        }[]
      }
    }[]
  }
}

interface YahooSummaryResponse {
  quoteSummary: {
    result: {
      defaultKeyStatistics?: {
        trailingPE?: { raw: number }
        forwardPE?: { raw: number }
        pegRatio?: { raw: number }
      }
      financialData?: {
        profitMargins?: { raw: number }
        debtToEquity?: { raw: number }
      }
    }[]
  }
}

const BASE_URL = 'https://query2.finance.yahoo.com'
const BASE_URL_ALT = 'https://query1.finance.yahoo.com'

const DEFAULT_COUNT = 50
const MAX_COUNT = 100

const fetchOptions = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  },
}

function normalizeCount(count?: number): number {
  if (typeof count !== 'number' || Number.isNaN(count) || count <= 0) {
    return DEFAULT_COUNT
  }

  return Math.min(Math.floor(count), MAX_COUNT)
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)

  if (!response.ok) {
    const message = `Request to ${url} failed with status ${response.status}`
    throw new Error(message)
  }

  return (await response.json()) as T
}

/**
 * Fetch trending tickers from Yahoo Finance
 * Returns list of currently trending stock symbols
 */
export async function trending(count: number = DEFAULT_COUNT): Promise<string[]> {
  const targetCount = normalizeCount(count)
  const url = `${BASE_URL_ALT}/v1/finance/trending/US?count=${targetCount}`

  try {
    const data = await fetchJson<YahooTrendingResponse>(url, fetchOptions)

    const quotes = data?.finance?.result?.[0]?.quotes
    if (!quotes) {
      throw new Error('Trending response missing quotes array')
    }

    return quotes
      .map((quote) => quote.symbol)
      .filter((symbol): symbol is string => Boolean(symbol))
      .slice(0, targetCount)
  } catch (error) {
    console.error('Yahoo Finance trending fetch failed:', error)
    return []
  }
}

/**
 * Fetch market movers from Yahoo Finance screener
 * @param type - 'gainers' or 'losers'
 * @param count - Number of results to return
 */
export async function screener(type: 'gainers' | 'losers', count: number = DEFAULT_COUNT): Promise<string[]> {
  const targetCount = normalizeCount(count)

  try {
    const endpoint = type === 'gainers' ? 'day_gainers' : 'day_losers'
    const url = `${BASE_URL_ALT}/v1/finance/screener/predefined/saved?scrIds=${endpoint}&count=${targetCount}`

    const data = await fetchJson<YahooScreenerResponse>(url, fetchOptions)

    const quotes = data?.finance?.result?.[0]?.quotes
    if (!quotes) {
      throw new Error('Screener response missing quotes array')
    }

    return quotes
      .map((quote) => quote.symbol)
      .filter((symbol): symbol is string => Boolean(symbol))
      .slice(0, targetCount)
  } catch (error) {
    console.error(`Yahoo Finance ${type} fetch failed:`, error)
    return []
  }
}

/**
 * Fetch historical data for a ticker
 */
export async function historical(ticker: string, options: { period1: Date; period2: Date }): Promise<HistoricalData[]> {
  const period1 = Math.floor(options.period1.getTime() / 1000)
  const period2 = Math.floor(options.period2.getTime() / 1000)

  const url = `${BASE_URL}/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`
  const data = await fetchJson<YahooChartResponse>(url, {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      Origin: 'https://finance.yahoo.com',
      Referer: 'https://finance.yahoo.com/',
    },
  })

  const result = data.chart?.result?.[0]

  if (!result || !Array.isArray(result.timestamp) || result.timestamp.length === 0) {
    throw new Error(`No historical data available for ${ticker}`)
  }

  const quote = result.indicators?.quote?.[0]

  if (!quote || !Array.isArray(quote.close)) {
    throw new Error(`Historical response missing quote data for ${ticker}`)
  }

  const adjclose = result.indicators?.adjclose?.[0]?.adjclose ?? quote.close

  const historicalData: HistoricalData[] = []

  for (let i = 0; i < result.timestamp.length; i++) {
    const close = quote.close[i]
    if (!Number.isFinite(close)) {
      continue
    }

    const timestamp = result.timestamp[i]
    if (!Number.isFinite(timestamp)) {
      continue
    }

    const open = Number.isFinite(quote.open?.[i]) ? quote.open[i] : close
    const high = Number.isFinite(quote.high?.[i]) ? quote.high[i] : close
    const low = Number.isFinite(quote.low?.[i]) ? quote.low[i] : close
    const volume = Number.isFinite(quote.volume?.[i]) ? quote.volume[i] : 0
    const adjClose = Number.isFinite(adjclose?.[i]) ? adjclose[i] : close

    historicalData.push({
      date: new Date(timestamp * 1000),
      open,
      high,
      low,
      close,
      volume,
      adjClose,
    })
  }

  return historicalData
}

/**
 * Fetch quote data for a ticker
 */
export async function quote(ticker: string): Promise<QuoteData> {
  // Use chart endpoint which is more reliable
  const url = `${BASE_URL}/v8/finance/chart/${ticker}`

  const data = await fetchJson<YahooChartResponse>(url, {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      Origin: 'https://finance.yahoo.com',
      Referer: 'https://finance.yahoo.com/',
    },
  })

  const result = data.chart?.result?.[0]

  if (!result || !result.meta) {
    throw new Error(`No quote data available for ${ticker}`)
  }

  const meta = result.meta

  // Try to get fundamental data from quoteSummary separately
  let fundamentals: Partial<QuoteData> = {}
  try {
    const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,financialData`
    const summaryData = await fetchJson<YahooSummaryResponse>(summaryUrl, fetchOptions)
    const summaryResult = summaryData.quoteSummary?.result?.[0]
    if (summaryResult) {
      const keyStats = summaryResult.defaultKeyStatistics
      const financialData = summaryResult.financialData
      fundamentals = {
        trailingPE: keyStats?.trailingPE?.raw,
        forwardPE: keyStats?.forwardPE?.raw,
        trailingPegRatio: keyStats?.pegRatio?.raw,
        profitMargins: financialData?.profitMargins?.raw,
        debtToEquity: financialData?.debtToEquity?.raw,
      }
    }
  } catch (_e) {
    // Fundamentals are optional, continue without them
  }

  return {
    symbol: ticker,
    regularMarketPrice: meta.regularMarketPrice || 0,
    regularMarketVolume: meta.regularMarketVolume || 0,
    ...fundamentals,
  }
}
