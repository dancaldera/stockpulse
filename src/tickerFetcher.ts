/**
 * Dynamic ticker fetcher service
 * Fetches top tickers using Yahoo Finance and CoinGecko APIs (100% free, no API keys required)
 */

import { YahooFinance } from './yahooFinance'
import { POPULAR_TICKERS, CRYPTO_TICKERS } from './tickers'

export interface TickerFetcherConfig {
  strategy: 'most_active' | 'gainers' | 'losers' | 'mixed' | 'static' | 'crypto'
  minVolume?: number
  minPrice?: number
  maxPrice?: number
  limit?: number
}

export interface TickerInfo {
  ticker: string
  name?: string
  price?: number
  change?: number
  changePercent?: number
  volume?: number
}

export class TickerFetcher {
  private config: TickerFetcherConfig

  constructor(config: TickerFetcherConfig) {
    this.config = {
      minVolume: 1000000, // 1M minimum volume
      minPrice: 5, // Exclude penny stocks
      maxPrice: 10000,
      limit: 50,
      ...config,
    }
  }

  /**
   * Fetch tickers based on configured strategy
   */
  async fetchTickers(): Promise<string[]> {
    try {
      switch (this.config.strategy) {
        case 'most_active':
          return await this.fetchMostActive()
        case 'gainers':
          return await this.fetchGainers()
        case 'losers':
          return await this.fetchLosers()
        case 'mixed':
          return await this.fetchMixed()
        case 'crypto':
          return await this.fetchCrypto()
        case 'static':
        default:
          return this.fetchStatic()
      }
    } catch (error) {
      console.error('Error fetching tickers, falling back to static list:', error)
      return this.fetchStatic()
    }
  }

  /**
   * Fetch most active stocks from Yahoo Finance trending API
   */
  private async fetchMostActive(): Promise<string[]> {
    try {
      const tickers = await YahooFinance.trending(this.config.limit || 50)

      if (tickers.length > 0) {
        return tickers.slice(0, this.config.limit)
      }

      throw new Error('No trending tickers found')
    } catch (error) {
      console.error('Yahoo Finance trending fetch failed, using static list:', error)
      return this.fetchStatic()
    }
  }

  /**
   * Fetch top gainers from Yahoo Finance screener
   */
  private async fetchGainers(): Promise<string[]> {
    try {
      const tickers = await YahooFinance.screener('gainers', this.config.limit || 50)

      if (tickers.length > 0) {
        return tickers.slice(0, this.config.limit)
      }

      throw new Error('No gainers found')
    } catch (error) {
      console.error('Yahoo Finance gainers fetch failed, using static list:', error)
      return this.fetchStatic()
    }
  }

  /**
   * Fetch top losers from Yahoo Finance screener
   */
  private async fetchLosers(): Promise<string[]> {
    try {
      const tickers = await YahooFinance.screener('losers', this.config.limit || 50)

      if (tickers.length > 0) {
        return tickers.slice(0, this.config.limit)
      }

      throw new Error('No losers found')
    } catch (error) {
      console.error('Yahoo Finance losers fetch failed, using static list:', error)
      return this.fetchStatic()
    }
  }

  /**
   * Fetch mixed list: combination of trending and gainers
   */
  private async fetchMixed(): Promise<string[]> {
    try {
      const [trending, gainers] = await Promise.all([
        YahooFinance.trending(Math.ceil((this.config.limit || 50) / 2)),
        YahooFinance.screener('gainers', Math.ceil((this.config.limit || 50) / 2)),
      ])

      // Combine and deduplicate
      const combined = [...new Set([...trending, ...gainers])]
      return combined.slice(0, this.config.limit)
    } catch (error) {
      console.error('Mixed fetch failed:', error)
      return this.fetchStatic()
    }
  }

  /**
   * Fetch top cryptocurrencies from CoinGecko API (free, no key required)
   */
  private async fetchCrypto(): Promise<string[]> {
    try {
      // Fetch top cryptocurrencies by market cap from CoinGecko (free API)
      const url =
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1'

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }

      const data = (await response.json()) as any[]

      // Map CoinGecko symbols to Yahoo Finance format (SYMBOL-USD)
      // Filter out stablecoins
      const cryptoTickers = data
        .filter((coin) => {
          // Filter out stablecoins
          const isStablecoin = ['usdt', 'usdc', 'dai', 'busd', 'tusd'].includes(coin.id.toLowerCase())
          return !isStablecoin && coin.current_price > 0
        })
        .map((coin) => {
          // Convert CoinGecko symbol to Yahoo Finance format
          // CoinGecko: btc -> Yahoo: BTC-USD
          return `${coin.symbol.toUpperCase()}-USD`
        })
        .slice(0, this.config.limit)

      if (cryptoTickers.length > 0) {
        return cryptoTickers
      }

      throw new Error('No crypto tickers found from CoinGecko')
    } catch (error) {
      console.error('CoinGecko fetch failed, using static crypto list:', error)
      return this.fetchStaticCrypto()
    }
  }

  /**
   * Fallback to static popular tickers
   */
  private fetchStatic(): string[] {
    return POPULAR_TICKERS.slice(0, this.config.limit || 50)
  }

  /**
   * Fallback to static crypto tickers
   */
  private fetchStaticCrypto(): string[] {
    return CRYPTO_TICKERS.slice(0, this.config.limit || 20)
  }
}
