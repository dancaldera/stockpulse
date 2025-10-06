/**
 * Technical Analysis Utilities
 */

export class TechnicalIndicators {
  /**
   * Calculate Simple Moving Average
   */
  static sma(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  /**
   * Calculate Exponential Moving Average
   */
  static ema(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const result: number[] = [];

    // First EMA is SMA
    const firstSma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(firstSma);

    for (let i = period; i < data.length; i++) {
      const ema = data[i] * k + result[result.length - 1] * (1 - k);
      result.push(ema);
    }

    return result;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  static rsi(prices: number[], period: number = 14): number {
    const changes = prices.slice(1).map((price, i) => price - prices[i]);

    let gains = 0;
    let losses = 0;

    // First average
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) gains += changes[i];
      else losses -= changes[i];
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smooth subsequent values
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD
   */
  static macd(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.ema(prices, 12);
    const ema26 = this.ema(prices, 26);

    const macdLine: number[] = [];
    const offset = ema26.length - ema12.length;

    for (let i = 0; i < ema26.length; i++) {
      macdLine.push(ema12[i + offset] - ema26[i]);
    }

    const signalLine = this.ema(macdLine, 9);
    const histogram = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1];

    return {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  static bollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    const sma = this.sma(prices, period);
    const lastSma = sma[sma.length - 1];

    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => {
      return sum + Math.pow(price - lastSma, 2);
    }, 0) / period;

    const std = Math.sqrt(variance);

    return {
      upper: lastSma + (stdDev * std),
      middle: lastSma,
      lower: lastSma - (stdDev * std)
    };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  static atr(high: number[], low: number[], close: number[], period: number = 14): number {
    const trueRanges: number[] = [];

    for (let i = 1; i < high.length; i++) {
      const tr1 = high[i] - low[i];
      const tr2 = Math.abs(high[i] - close[i - 1]);
      const tr3 = Math.abs(low[i] - close[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    const atrValues = this.sma(trueRanges, period);
    return atrValues[atrValues.length - 1];
  }

  /**
   * Calculate trend strength using linear regression
   */
  static trendStrength(prices: number[]): number {
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * prices[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Normalize by price
    return (slope / prices[prices.length - 1]) * 100;
  }
}

/**
 * Cache utilities
 */
export class CacheManager {
  private cache: KVNamespace | undefined;
  private ttl: number = 300; // 5 minutes default

  constructor(cache?: KVNamespace, ttl: number = 300) {
    this.cache = cache;
    this.ttl = ttl;
  }

  async get(key: string): Promise<any | null> {
    if (!this.cache) return null;

    try {
      const value = await this.cache.get(key);
      if (!value) return null;

      const cached = JSON.parse(value);
      const age = Date.now() - cached.timestamp;

      // Return cached data if less than TTL
      if (age < this.ttl * 1000) {
        return cached.data;
      }

      return null;
    } catch (e) {
      console.error('Cache get error:', e);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.cache) return;

    try {
      const cacheEntry = {
        data: value,
        timestamp: Date.now()
      };

      await this.cache.put(key, JSON.stringify(cacheEntry), {
        expirationTtl: this.ttl
      });
    } catch (e) {
      console.error('Cache set error:', e);
    }
  }
}
