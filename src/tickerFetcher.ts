/**
 * Dynamic ticker fetcher service
 * Fetches top tickers based on market activity (most active, gainers, losers)
 */

export interface TickerFetcherConfig {
  fmpApiKey?: string;
  strategy: 'most_active' | 'gainers' | 'losers' | 'mixed' | 'static';
  minVolume?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface TickerInfo {
  ticker: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
}

export class TickerFetcher {
  private config: TickerFetcherConfig;

  constructor(config: TickerFetcherConfig) {
    this.config = {
      minVolume: 1000000, // 1M minimum volume
      minPrice: 5, // Exclude penny stocks
      maxPrice: 10000,
      limit: 50,
      ...config
    };
  }

  /**
   * Fetch tickers based on configured strategy
   */
  async fetchTickers(): Promise<string[]> {
    try {
      switch (this.config.strategy) {
        case 'most_active':
          return await this.fetchMostActive();
        case 'gainers':
          return await this.fetchGainers();
        case 'losers':
          return await this.fetchLosers();
        case 'mixed':
          return await this.fetchMixed();
        case 'static':
        default:
          return this.fetchStatic();
      }
    } catch (error) {
      console.error('Error fetching tickers, falling back to static list:', error);
      return this.fetchStatic();
    }
  }

  /**
   * Fetch most active stocks from FMP API
   */
  private async fetchMostActive(): Promise<string[]> {
    if (!this.config.fmpApiKey) {
      console.warn('FMP API key not provided, using Yahoo Finance fallback');
      return this.fetchYahooMostActive();
    }

    try {
      const url = `https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${this.config.fmpApiKey}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status}`);
      }

      const data = await response.json() as any[];
      return this.filterAndExtractTickers(data);
    } catch (error) {
      console.error('FMP most active fetch failed, using fallback:', error);
      return this.fetchYahooMostActive();
    }
  }

  /**
   * Fetch top gainers from FMP API
   */
  private async fetchGainers(): Promise<string[]> {
    if (!this.config.fmpApiKey) {
      console.warn('FMP API key not provided, using Yahoo Finance fallback');
      return this.fetchYahooGainers();
    }

    try {
      const url = `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${this.config.fmpApiKey}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status}`);
      }

      const data = await response.json() as any[];
      return this.filterAndExtractTickers(data);
    } catch (error) {
      console.error('FMP gainers fetch failed, using fallback:', error);
      return this.fetchYahooGainers();
    }
  }

  /**
   * Fetch top losers from FMP API
   */
  private async fetchLosers(): Promise<string[]> {
    if (!this.config.fmpApiKey) {
      console.warn('FMP API key not provided, using Yahoo Finance fallback');
      return this.fetchStatic();
    }

    try {
      const url = `https://financialmodelingprep.com/api/v3/stock_market/losers?apikey=${this.config.fmpApiKey}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status}`);
      }

      const data = await response.json() as any[];
      return this.filterAndExtractTickers(data);
    } catch (error) {
      console.error('FMP losers fetch failed, using fallback:', error);
      return this.fetchStatic();
    }
  }

  /**
   * Fetch mixed list: combination of actives and gainers
   */
  private async fetchMixed(): Promise<string[]> {
    try {
      const [actives, gainers] = await Promise.all([
        this.fetchMostActive(),
        this.fetchGainers()
      ]);

      // Combine and deduplicate
      const combined = [...new Set([...actives, ...gainers])];
      return combined.slice(0, this.config.limit);
    } catch (error) {
      console.error('Mixed fetch failed:', error);
      return this.fetchStatic();
    }
  }

  /**
   * Fetch most active stocks from Yahoo Finance
   * Uses the public trending/actives endpoint as a simpler alternative
   */
  private async fetchYahooMostActive(): Promise<string[]> {
    try {
      // Try the simpler Yahoo Finance trending tickers endpoint first
      const url = 'https://query1.finance.yahoo.com/v1/finance/trending/US?count=50';

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      const data = await response.json() as any;

      if (data?.finance?.result?.[0]?.quotes) {
        const tickers = data.finance.result[0].quotes
          .map((quote: any) => quote.symbol)
          .filter((symbol: string) => symbol && !symbol.includes('^') && !symbol.includes('='))
          .slice(0, this.config.limit);

        if (tickers.length > 0) {
          return tickers;
        }
      }

      throw new Error('Invalid Yahoo Finance response format');
    } catch (error) {
      console.error('Yahoo Finance fetch failed:', error);
      return this.fetchStatic();
    }
  }

  /**
   * Fetch gainers from Yahoo Finance
   * Note: Yahoo Finance doesn't have a reliable public gainers endpoint
   * This falls back to trending stocks
   */
  private async fetchYahooGainers(): Promise<string[]> {
    try {
      // Yahoo's gainers endpoint is not publicly accessible without auth
      // Fall back to trending as a proxy for active/popular stocks
      console.warn('Yahoo Finance gainers endpoint not available, using trending stocks');
      return this.fetchYahooMostActive();
    } catch (error) {
      console.error('Yahoo Finance gainers fetch failed:', error);
      return this.fetchStatic();
    }
  }

  /**
   * Filter and extract tickers from FMP response
   */
  private filterAndExtractTickers(data: any[]): string[] {
    if (!Array.isArray(data)) {
      return this.fetchStatic();
    }

    return data
      .filter(stock => {
        const price = stock.price || stock.lastPrice || 0;
        const volume = stock.volume || 0;

        return (
          price >= (this.config.minPrice || 0) &&
          price <= (this.config.maxPrice || 10000) &&
          volume >= (this.config.minVolume || 0)
        );
      })
      .map(stock => stock.symbol || stock.ticker)
      .filter(symbol => symbol && typeof symbol === 'string')
      .slice(0, this.config.limit);
  }

  /**
   * Fallback to static popular tickers
   */
  private fetchStatic(): string[] {
    // Import from tickers.ts
    const POPULAR_TICKERS = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
      'NFLX', 'AMD', 'INTC', 'ORCL', 'ADBE', 'CRM', 'CSCO',
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA',
      'JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'TMO', 'LLY',
      'WMT', 'HD', 'DIS', 'NKE', 'MCD', 'SBUX', 'COST',
      'BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'RTX',
      'XOM', 'CVX', 'COP', 'SLB', 'EOG',
      'T', 'VZ', 'TMUS',
      'PLTR', 'COIN', 'RBLX', 'SNOW', 'DKNG', 'SQ', 'SHOP'
    ];

    return POPULAR_TICKERS.slice(0, this.config.limit || 50);
  }
}
