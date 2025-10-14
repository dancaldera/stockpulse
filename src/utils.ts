import type { ValidationOptions, ValidationResult } from './types'

/**
 * Execute a function with retry logic
 * @param fn The async function to execute
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Initial delay between retries (exponential backoff)
 * @param maxDelayMs Maximum delay between retries
 * @returns Promise that resolves with the function result
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  maxDelayMs: number = 5000,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.1 + 0.9 // 0.9 to 1.0
      const delay = Math.min(delayMs * 2 ** attempt * jitter, maxDelayMs)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Unknown error occurred')
}

/**
 * Validate and sanitize a stock ticker symbol
 * @param ticker The ticker symbol to validate
 * @param options Validation options
 * @returns ValidationResult with validation status and sanitized ticker
 */
export function validateTicker(ticker: string, options: ValidationOptions = {}): ValidationResult {
  const errors: string[] = []
  const defaultOptions: ValidationOptions = {
    minLength: 1,
    maxLength: 10,
    allowedSymbols: [
      '.',
      '-',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ],
    allowNumbers: true,
    ...options,
  }

  // Check if input is string
  if (typeof ticker !== 'string') {
    errors.push('Ticker must be a string')
    return { isValid: false, sanitizedTicker: '', errors }
  }

  // Basic sanitization
  let sanitized = ticker.toUpperCase().trim()

  // Remove any whitespace
  sanitized = sanitized.replace(/\s+/g, '')

  // Check minimum length
  if (sanitized.length < (defaultOptions.minLength || 1)) {
    errors.push(`Ticker must be at least ${defaultOptions.minLength} characters`)
  }

  // Check maximum length
  if (sanitized.length > (defaultOptions.maxLength || 10)) {
    errors.push(`Ticker cannot exceed ${defaultOptions.maxLength} characters`)
  }

  // Check for valid characters only (dash must be escaped in character class)
  const allowedRegex = /^[A-Z0-9.-]+$/
  if (!allowedRegex.test(sanitized)) {
    errors.push('Ticker contains invalid characters')
  }

  // Check for sequential dots or dashes
  if (/[.-]{2,}/.test(sanitized)) {
    errors.push('Ticker cannot contain consecutive dots or dashes')
  }

  // Cannot start or end with dot or dash
  if (/^[.-]/.test(sanitized) || /[.-]$/.test(sanitized)) {
    errors.push('Ticker cannot start or end with dot or dash')
  }

  return {
    isValid: errors.length === 0,
    sanitizedTicker: sanitized,
    errors,
  }
}

/**
 * Quick validation for common stock tickers
 * @param ticker The ticker to validate
 * @returns true if ticker appears valid, false otherwise
 */
export function isValidTicker(ticker: string): boolean {
  const result = validateTicker(ticker)
  return result.isValid
}

/**
 * Calculate Simple Moving Average
 */
export function sma(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / period)
  }
  return result
}

/**
 * Calculate Exponential Moving Average
 */
export function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const result: number[] = []

  // First EMA is SMA
  const firstSma = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(firstSma)

  for (let i = period; i < data.length; i++) {
    const emaValue = data[i] * k + result[result.length - 1] * (1 - k)
    result.push(emaValue)
  }

  return result
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function rsi(prices: number[], period: number = 14): number {
  const changes = prices.slice(1).map((price, i) => price - prices[i])

  let gains = 0
  let losses = 0

  // First average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i]
    else losses -= changes[i]
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  // Smooth subsequent values
  for (let i = period; i < changes.length; i++) {
    const change = changes[i]
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period
  }

  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/**
 * Calculate MACD
 * @param prices Array of prices to calculate MACD for
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line EMA period (default: 9)
 */
export function macd(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
): { macd: number; signal: number; histogram: number } {
  const emaFast = ema(prices, fastPeriod)
  const emaSlow = ema(prices, slowPeriod)

  const macdLine: number[] = []
  const offset = emaSlow.length - emaFast.length

  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i + offset] - emaSlow[i])
  }

  const signalLine = ema(macdLine, signalPeriod)
  const histogram = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1]

  return {
    macd: macdLine[macdLine.length - 1],
    signal: signalLine[signalLine.length - 1],
    histogram,
  }
}

/**
 * Calculate Bollinger Bands
 */
export function bollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 }
  }

  const smaValues = sma(prices, period)
  const lastSma = smaValues[smaValues.length - 1]

  // Use the most recent prices for standard deviation calculation
  const recentPrices = prices.slice(-period)

  // Calculate standard deviation properly
  const mean = lastSma
  const squaredDiffs = recentPrices.map((price) => (price - mean) ** 2)
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period
  const std = Math.sqrt(variance)

  return {
    upper: lastSma + stdDev * std,
    middle: lastSma,
    lower: lastSma - stdDev * std,
  }
}

/**
 * Calculate ATR (Average True Range)
 */
export function atr(high: number[], low: number[], close: number[], period: number = 14): number {
  const trueRanges: number[] = []

  for (let i = 1; i < high.length; i++) {
    const tr1 = high[i] - low[i]
    const tr2 = Math.abs(high[i] - close[i - 1])
    const tr3 = Math.abs(low[i] - close[i - 1])
    trueRanges.push(Math.max(tr1, tr2, tr3))
  }

  const atrValues = sma(trueRanges, period)
  return atrValues[atrValues.length - 1]
}

/**
 * Calculate trend strength using linear regression
 */
export function trendStrength(prices: number[]): number {
  const n = prices.length
  const x = Array.from({ length: n }, (_, i) => i)

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = prices.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * prices[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  // Normalize by price
  return (slope / prices[prices.length - 1]) * 100
}

/**
 * Cache utilities with tiered TTL strategy
 */
export class CacheManager {
  private cache: KVNamespace | undefined
  private ttl: number = 300 // 5 minutes default

  // Tiered TTL strategy (in seconds)
  private static readonly CACHE_TIERS = {
    quote: 60, // 1 minute for real-time quotes
    analysis: 300, // 5 minutes for analysis results
    historical: 3600, // 1 hour for historical data
    tickers: 1800, // 30 minutes for ticker lists
  }

  constructor(cache?: KVNamespace, ttl: number = 300) {
    this.cache = cache
    this.ttl = ttl
  }

  /**
   * Get cache tier TTL based on key prefix
   */
  private getTierTTL(key: string): number {
    if (key.startsWith('quote:')) return CacheManager.CACHE_TIERS.quote
    if (key.startsWith('stock:')) return CacheManager.CACHE_TIERS.analysis
    if (key.startsWith('historical:')) return CacheManager.CACHE_TIERS.historical
    if (key.startsWith('tickers:')) return CacheManager.CACHE_TIERS.tickers
    return this.ttl // default
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.cache) return null

    try {
      const value = await this.cache.get(key)
      if (!value) return null

      const cached = JSON.parse(value)
      const age = Date.now() - cached.timestamp
      const ttl = this.getTierTTL(key)

      // Return cached data if less than TTL
      if (age < ttl * 1000) {
        return cached.data as T
      }

      return null
    } catch (_e) {
      // Gracefully handle cache errors
      return null
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    if (!this.cache) return

    try {
      const cacheEntry = {
        data: value,
        timestamp: Date.now(),
      }

      const ttl = this.getTierTTL(key)

      await this.cache.put(key, JSON.stringify(cacheEntry), {
        expirationTtl: ttl,
      })
    } catch (_e) {
      // Gracefully handle cache errors
    }
  }

  /**
   * Stale-while-revalidate: Return stale data immediately while fetching fresh data in background
   * @param key Cache key
   * @param fetchFn Function to fetch fresh data
   * @param staleTime How long to consider data fresh (seconds)
   * @param maxStale Maximum age of stale data to return (seconds)
   */
  async getWithRevalidate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    staleTime: number = 300,
    maxStale: number = 3600,
  ): Promise<T> {
    if (!this.cache) {
      return await fetchFn()
    }

    try {
      const value = await this.cache.get(key)

      if (value) {
        const cached = JSON.parse(value)
        const age = Date.now() - cached.timestamp

        // If fresh, return immediately
        if (age < staleTime * 1000) {
          return cached.data as T
        }

        // If stale but not too old, return stale data and revalidate in background
        if (age < maxStale * 1000) {
          // Don't await - fire and forget background revalidation
          fetchFn().then((freshData) => {
            this.set(key, freshData).catch(() => {
              // Ignore revalidation errors
            })
          })

          return cached.data as T
        }
      }

      // No cache or too old - fetch fresh data
      const freshData = await fetchFn()
      await this.set(key, freshData)
      return freshData
    } catch (_e) {
      // On error, try to fetch fresh data
      return await fetchFn()
    }
  }
}
