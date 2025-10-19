/**
 * Dynamic ticker fetcher service
 * Fetches top tickers using Yahoo Finance (free, no API keys required)
 */

import { POPULAR_TICKERS } from './tickers'
import { YahooFinanceAdapter, type YahooDataSource } from './data-sources/yahoo-adapter'

export interface TickerFetcherConfig {
  strategy: 'most_active' | 'gainers' | 'losers' | 'mixed' | 'static'
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
  private dataSource: YahooDataSource

  constructor(config: TickerFetcherConfig, dataSource: YahooDataSource = new YahooFinanceAdapter()) {
    this.config = {
      minVolume: 1000000, // 1M minimum volume
      minPrice: 5, // Exclude penny stocks
      maxPrice: 10000,
      limit: 50,
      ...config,
    }
    this.dataSource = dataSource
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
      return await this.dataSource.getTrendingTickers(this.config.limit)
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
      return await this.dataSource.getGainers(this.config.limit)
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
      return await this.dataSource.getLosers(this.config.limit)
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
      const halfLimit = Math.ceil((this.config.limit || 50) / 2)
      const [trending, gainers] = await Promise.all([
        this.dataSource.getTrendingTickers(halfLimit),
        this.dataSource.getGainers(halfLimit),
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
   * Fallback to static popular tickers
   */
  private fetchStatic(): string[] {
    return POPULAR_TICKERS.slice(0, this.config.limit || 50)
  }
}
