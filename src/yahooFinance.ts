/**
 * Custom Yahoo Finance API client for Cloudflare Workers
 * This replaces yahoo-finance2 to avoid Node.js dependencies
 */

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface QuoteData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketVolume: number;
  trailingPE?: number;
  forwardPE?: number;
  trailingPegRatio?: number;
  profitMargins?: number;
  debtToEquity?: number;
}

export class YahooFinance {
  private static readonly BASE_URL = 'https://query2.finance.yahoo.com';

  /**
   * Fetch historical data for a ticker
   */
  static async historical(
    ticker: string,
    options: { period1: Date; period2: Date }
  ): Promise<HistoricalData[]> {
    const period1 = Math.floor(options.period1.getTime() / 1000);
    const period2 = Math.floor(options.period2.getTime() / 1000);

    const url = `${this.BASE_URL}/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch historical data for ${ticker}: ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (!data.chart?.result?.[0]) {
      throw new Error(`No data available for ${ticker}`);
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    const adjclose = result.indicators.adjclose?.[0]?.adjclose || quote.close;

    const historical: HistoricalData[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (quote.close[i] !== null) {
        historical.push({
          date: new Date(timestamps[i] * 1000),
          open: quote.open[i] || quote.close[i],
          high: quote.high[i] || quote.close[i],
          low: quote.low[i] || quote.close[i],
          close: quote.close[i],
          volume: quote.volume[i] || 0,
          adjClose: adjclose[i] || quote.close[i]
        });
      }
    }

    return historical;
  }

  /**
   * Fetch quote data for a ticker
   */
  static async quote(ticker: string): Promise<QuoteData> {
    // Use chart endpoint which is more reliable
    const url = `${this.BASE_URL}/v8/finance/chart/${ticker}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${ticker}: ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (!data.chart?.result?.[0]) {
      throw new Error(`No quote data available for ${ticker}`);
    }

    const result = data.chart.result[0];
    const meta = result.meta;

    // Try to get fundamental data from quoteSummary separately with crumb
    let fundamentals: any = {};
    try {
      const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,financialData`;
      const summaryResponse = await fetch(summaryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json() as any;
        if (summaryData.quoteSummary?.result?.[0]) {
          const keyStats = summaryData.quoteSummary.result[0].defaultKeyStatistics;
          const financialData = summaryData.quoteSummary.result[0].financialData;
          fundamentals = {
            trailingPE: keyStats?.trailingPE?.raw,
            forwardPE: keyStats?.forwardPE?.raw,
            trailingPegRatio: keyStats?.pegRatio?.raw,
            profitMargins: financialData?.profitMargins?.raw,
            debtToEquity: financialData?.debtToEquity?.raw
          };
        }
      }
    } catch (e) {
      // Fundamentals are optional, continue without them
    }

    return {
      symbol: ticker,
      regularMarketPrice: meta.regularMarketPrice || 0,
      regularMarketVolume: meta.regularMarketVolume || 0,
      trailingPE: fundamentals.trailingPE,
      forwardPE: fundamentals.forwardPE,
      trailingPegRatio: fundamentals.trailingPegRatio,
      profitMargins: fundamentals.profitMargins,
      debtToEquity: fundamentals.debtToEquity
    };
  }
}
