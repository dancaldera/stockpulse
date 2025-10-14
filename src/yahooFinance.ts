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

const fetchOptions = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  },
}

/**
 * Fetch trending tickers from Yahoo Finance
 * Returns list of currently trending stock symbols
 */
export async function trending(count: number = 50): Promise<string[]> {
  try {
    const url = `${BASE_URL_ALT}/v1/finance/trending/US?count=${count}`

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      throw new Error(`Failed to fetch trending tickers: ${response.statusText}`)
    }

    const data = (await response.json()) as YahooTrendingResponse

    if (data?.finance?.result?.[0]?.quotes) {
      return data.finance.result[0].quotes
        .map((quote) => quote.symbol)
        .filter((symbol) => symbol && !symbol.includes('^') && !symbol.includes('='))
        .slice(0, count)
    }

    return []
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
export async function screener(type: 'gainers' | 'losers', count: number = 50): Promise<string[]> {
  try {
    // Yahoo Finance screener endpoint
    const endpoint = type === 'gainers' ? 'day_gainers' : 'day_losers'
    const url = `${BASE_URL_ALT}/v1/finance/screener/predefined/saved?scrIds=${endpoint}&count=${count}`

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      throw new Error(`Failed to fetch ${type}: ${response.statusText}`)
    }

    const data = (await response.json()) as YahooScreenerResponse

    if (data?.finance?.result?.[0]?.quotes) {
      return data.finance.result[0].quotes
        .map((quote) => quote.symbol)
        .filter((symbol) => symbol && !symbol.includes('^') && !symbol.includes('='))
        .slice(0, count)
    }

    return []
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

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      Origin: 'https://finance.yahoo.com',
      Referer: 'https://finance.yahoo.com/',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch historical data for ${ticker}: ${response.statusText}`)
  }

  const data = (await response.json()) as YahooChartResponse

  if (!data.chart?.result?.[0]) {
    throw new Error(`No data available for ${ticker}`)
  }

  const result = data.chart.result[0]
  const timestamps = result.timestamp
  const quote = result.indicators.quote[0]
  const adjclose = result.indicators.adjclose?.[0]?.adjclose || quote.close

  const historicalData: HistoricalData[] = []

  for (let i = 0; i < timestamps.length; i++) {
    if (quote.close[i] !== null) {
      historicalData.push({
        date: new Date(timestamps[i] * 1000),
        open: quote.open[i] || quote.close[i],
        high: quote.high[i] || quote.close[i],
        low: quote.low[i] || quote.close[i],
        close: quote.close[i],
        volume: quote.volume[i] || 0,
        adjClose: adjclose[i] || quote.close[i],
      })
    }
  }

  return historicalData
}

/**
 * Fetch quote data for a ticker
 */
export async function quote(ticker: string): Promise<QuoteData> {
  // Use chart endpoint which is more reliable
  const url = `${BASE_URL}/v8/finance/chart/${ticker}`

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      Origin: 'https://finance.yahoo.com',
      Referer: 'https://finance.yahoo.com/',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch quote for ${ticker}: ${response.statusText}`)
  }

  const data = (await response.json()) as YahooChartResponse

  if (!data.chart?.result?.[0]) {
    throw new Error(`No quote data available for ${ticker}`)
  }

  const result = data.chart.result[0]
  const meta = result.meta

  // Try to get fundamental data from quoteSummary separately
  let fundamentals: Partial<QuoteData> = {}
  try {
    const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,financialData`
    const summaryResponse = await fetch(summaryUrl, fetchOptions)

    if (summaryResponse.ok) {
      const summaryData = (await summaryResponse.json()) as YahooSummaryResponse
      if (summaryData.quoteSummary?.result?.[0]) {
        const keyStats = summaryData.quoteSummary.result[0].defaultKeyStatistics
        const financialData = summaryData.quoteSummary.result[0].financialData
        fundamentals = {
          trailingPE: keyStats?.trailingPE?.raw,
          forwardPE: keyStats?.forwardPE?.raw,
          trailingPegRatio: keyStats?.pegRatio?.raw,
          profitMargins: financialData?.profitMargins?.raw,
          debtToEquity: financialData?.debtToEquity?.raw,
        }
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
