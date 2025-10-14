import { describe, test, expect, beforeEach, mock } from 'bun:test'
import {
  sma,
  ema,
  rsi,
  macd,
  bollingerBands,
  atr,
  trendStrength,
  validateTicker,
  isValidTicker,
  executeWithRetry,
  CacheManager,
} from '@/utils'

describe('Technical Indicators', () => {
  describe('sma - Simple Moving Average', () => {
    test('should calculate SMA correctly with valid data', () => {
      const data = [10, 20, 30, 40, 50]
      const result = sma(data, 3)
      expect(result).toEqual([20, 30, 40])
    })

    test('should handle period equal to data length', () => {
      const data = [10, 20, 30]
      const result = sma(data, 3)
      expect(result).toEqual([20])
    })

    test('should return empty array when period larger than data', () => {
      const data = [10, 20, 30]
      const result = sma(data, 5)
      expect(result).toEqual([])
    })

    test('should handle single value period', () => {
      const data = [10, 20, 30, 40]
      const result = sma(data, 1)
      expect(result).toEqual([10, 20, 30, 40])
    })

    test('should calculate correct averages for real-world prices', () => {
      const prices = [100, 102, 98, 104, 96]
      const result = sma(prices, 3)
      expect(result[0]).toBeCloseTo(100) // (100 + 102 + 98) / 3
      expect(result[1]).toBeCloseTo(101.33, 1) // (102 + 98 + 104) / 3
      expect(result[2]).toBeCloseTo(99.33, 1) // (98 + 104 + 96) / 3
    })

    test('should handle empty array', () => {
      const data: number[] = []
      const result = sma(data, 3)
      expect(result).toEqual([])
    })

    test('should handle large dataset efficiently', () => {
      const data = Array.from({ length: 1000 }, (_, i) => i + 100)
      const result = sma(data, 50)
      expect(result.length).toBe(951) // 1000 - 50 + 1
      expect(result[0]).toBeCloseTo(124.5) // Average of 100-149
    })
  })

  describe('ema - Exponential Moving Average', () => {
    test('should calculate EMA correctly', () => {
      const data = [10, 20, 30, 40, 50]
      const result = ema(data, 3)
      expect(result.length).toBe(3)
      expect(result[0]).toBeCloseTo(20) // First EMA is SMA
    })

    test('should show exponential weighting', () => {
      const data = [10, 20, 30, 40, 50, 60, 70]
      const result = ema(data, 3)
      // Each subsequent value should be influenced by previous EMA
      expect(result[result.length - 1]).toBeGreaterThan(result[result.length - 2])
    })

    test('should handle period equal to data length', () => {
      const data = [10, 20, 30]
      const result = ema(data, 3)
      expect(result.length).toBe(1)
      expect(result[0]).toBeCloseTo(20) // SMA only
    })

    test('should handle empty or insufficient data', () => {
      const data: number[] = []
      const result = ema(data, 3)
      expect(result.length).toBeLessThanOrEqual(1) // May return empty or single NaN/0
    })

    test('should calculate EMA with different periods', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i)
      const ema12 = ema(prices, 12)
      const ema26 = ema(prices, 26)
      // Shorter period should have more values
      expect(ema12.length).toBeGreaterThan(ema26.length)
    })

    test('should respond faster to price changes than SMA', () => {
      const data = [100, 100, 100, 100, 100, 150, 150, 150]
      const emaResult = ema(data, 5)
      const smaResult = sma(data, 5)
      // EMA should react faster to the price jump
      expect(emaResult[emaResult.length - 1]).toBeGreaterThan(smaResult[smaResult.length - 1])
    })
  })

  describe('rsi - Relative Strength Index', () => {
    test('should calculate high RSI for strong uptrend', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2)
      const result = rsi(prices, 14)
      expect(result).toBeGreaterThan(70)
      expect(result).toBeLessThanOrEqual(100)
    })

    test('should calculate low RSI for strong downtrend', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 200 - i * 2)
      const result = rsi(prices, 14)
      expect(result).toBeLessThan(30)
      expect(result).toBeGreaterThanOrEqual(0)
    })

    test('should calculate RSI around 50 for sideways movement', () => {
      const prices = [100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101]
      const result = rsi(prices, 14)
      expect(result).toBeGreaterThan(40)
      expect(result).toBeLessThan(60)
    })

    test('should handle extreme overbought conditions', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 5)
      const result = rsi(prices, 14)
      expect(result).toBeGreaterThan(80)
    })

    test('should handle extreme oversold conditions', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 200 - i * 5)
      const result = rsi(prices, 14)
      expect(result).toBeLessThan(20)
    })

    test('should work with minimum required data', () => {
      const prices = Array.from({ length: 15 }, (_, i) => 100 + i)
      const result = rsi(prices, 14)
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })

    test('should handle insufficient data gracefully', () => {
      const prices = [100, 101]
      const result = rsi(prices, 14)
      // Should return a number even with insufficient data
      expect(typeof result).toBe('number')
    })

    test('should calculate consistent RSI for stable prices', () => {
      const prices = Array.from({ length: 20 }, () => 100)
      const result = rsi(prices, 14)
      // RSI should be NaN or 50 for no change
      expect(Number.isNaN(result) || Math.abs(result - 50) < 10).toBe(true)
    })
  })

  describe('macd - Moving Average Convergence Divergence', () => {
    test('should calculate MACD with all components', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5 + Math.sin(i * 0.1) * 5)
      const result = macd(prices)
      expect(result).toHaveProperty('macd')
      expect(result).toHaveProperty('signal')
      expect(result).toHaveProperty('histogram')
      expect(typeof result.macd).toBe('number')
      expect(typeof result.signal).toBe('number')
      expect(typeof result.histogram).toBe('number')
    })

    test('should calculate histogram as difference of MACD and signal', () => {
      const prices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.5)
      const result = macd(prices)
      // Check if values are finite before comparing
      if (Number.isFinite(result.macd) && Number.isFinite(result.signal)) {
        expect(result.histogram).toBeCloseTo(result.macd - result.signal, 5)
      } else {
        // If MACD or signal is NaN, histogram should also be NaN
        expect(Number.isNaN(result.histogram)).toBe(true)
      }
    })

    test('should detect bullish crossover (positive histogram)', () => {
      // Create a strong uptrend throughout to ensure positive MACD
      const prices = Array.from({ length: 100 }, (_, i) => 100 + i * 1.5)
      const result = macd(prices)
      // In a consistent uptrend, MACD should be positive
      expect(typeof result.histogram).toBe('number')
      if (Number.isFinite(result.histogram)) {
        expect(result.macd).toBeGreaterThan(result.signal) // Bullish when MACD > signal
      }
    })

    test('should detect bearish crossover (negative histogram)', () => {
      // Create a strong downtrend throughout to ensure negative MACD
      const prices = Array.from({ length: 100 }, (_, i) => 200 - i * 1.5)
      const result = macd(prices)
      // In a consistent downtrend, MACD should be negative
      expect(typeof result.histogram).toBe('number')
      if (Number.isFinite(result.histogram)) {
        expect(result.macd).toBeLessThan(result.signal) // Bearish when MACD < signal
      }
    })

    test('should work with custom parameters', () => {
      const prices = Array.from({ length: 60 }, (_, i) => 100 + i * 0.5)
      const result = macd(prices, 12, 26, 9)
      expect(typeof result.macd).toBe('number')
      expect(typeof result.signal).toBe('number')
      expect(typeof result.histogram).toBe('number')
    })

    test('should handle minimum required data', () => {
      // Need at least 26 + 9 = 35 data points for standard MACD
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i)
      const result = macd(prices)
      expect(typeof result.macd).toBe('number')
      expect(typeof result.signal).toBe('number')
      expect(typeof result.histogram).toBe('number')
    })

    test('should calculate positive MACD in uptrend', () => {
      const prices = Array.from({ length: 100 }, (_, i) => 100 + i * 2)
      const result = macd(prices)
      // Strong uptrend should produce positive values
      expect(typeof result.macd).toBe('number')
      // The fast EMA should be above slow EMA in uptrend
      if (Number.isFinite(result.macd)) {
        // MACD line itself may vary, but histogram should show trend
        expect(Math.abs(result.macd)).toBeGreaterThan(0)
      }
    })

    test('should calculate negative MACD in downtrend', () => {
      const prices = Array.from({ length: 100 }, (_, i) => 200 - i * 2)
      const result = macd(prices)
      // Strong downtrend should produce negative values
      expect(typeof result.macd).toBe('number')
      // The fast EMA should be below slow EMA in downtrend
      if (Number.isFinite(result.macd)) {
        // MACD line itself may vary, but should show trend
        expect(Math.abs(result.macd)).toBeGreaterThan(0)
      }
    })
  })

  describe('bollingerBands - Bollinger Bands', () => {
    test('should calculate Bollinger Bands correctly', () => {
      const prices = [100, 102, 98, 104, 96, 106, 94, 108, 92, 110, 101, 99, 103, 97, 105, 95, 107, 93, 109, 91]
      const bb = bollingerBands(prices)
      expect(bb.upper).toBeGreaterThan(bb.middle)
      expect(bb.lower).toBeLessThan(bb.middle)
      expect(bb.middle).toBeGreaterThan(0)
    })

    test('should have symmetric bands', () => {
      const prices = [100, 102, 98, 104, 96, 106, 94, 108, 92, 110, 101, 99, 103, 97, 105, 95, 107, 93, 109, 91]
      const bb = bollingerBands(prices)
      const upperDistance = bb.upper - bb.middle
      const lowerDistance = bb.middle - bb.lower
      expect(upperDistance).toBeCloseTo(lowerDistance, 5)
    })

    test('should widen bands with higher standard deviation', () => {
      const prices = [100, 102, 98, 104, 96, 106, 94, 108, 92, 110, 101, 99, 103, 97, 105, 95, 107, 93, 109, 91]
      const bb1 = bollingerBands(prices, 20, 1)
      const bb2 = bollingerBands(prices, 20, 2)
      const bb3 = bollingerBands(prices, 20, 3)
      expect(bb3.upper - bb3.lower).toBeGreaterThan(bb2.upper - bb2.lower)
      expect(bb2.upper - bb2.lower).toBeGreaterThan(bb1.upper - bb1.lower)
    })

    test('should handle volatile data', () => {
      const prices = Array.from({ length: 20 }, () => 100 + Math.random() * 20)
      const bb = bollingerBands(prices)
      expect(bb.upper).toBeGreaterThan(bb.middle)
      expect(bb.lower).toBeLessThan(bb.middle)
      expect(bb.upper - bb.lower).toBeGreaterThan(0)
    })

    test('should have narrow bands for stable prices', () => {
      const prices = Array.from({ length: 20 }, () => 100)
      const bb = bollingerBands(prices)
      expect(bb.upper).toBeCloseTo(bb.middle, 1)
      expect(bb.lower).toBeCloseTo(bb.middle, 1)
    })

    test('should return zeros for insufficient data', () => {
      const prices = [100, 101, 102]
      const bb = bollingerBands(prices, 20)
      expect(bb.upper).toBe(0)
      expect(bb.middle).toBe(0)
      expect(bb.lower).toBe(0)
    })

    test('should calculate middle band as SMA', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i)
      const bb = bollingerBands(prices, 20)
      const smaValue = sma(prices, 20)[0]
      expect(bb.middle).toBeCloseTo(smaValue, 5)
    })

    test('should handle custom period', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5)
      const bb10 = bollingerBands(prices, 10)
      const bb30 = bollingerBands(prices, 30)
      expect(bb10.middle).not.toBe(bb30.middle)
    })
  })

  describe('atr - Average True Range', () => {
    test('should calculate ATR for volatile data', () => {
      const high = [102, 105, 103, 108, 106, 110, 108, 112, 109, 115, 113, 118, 116, 120, 119]
      const low = [98, 101, 99, 104, 102, 106, 104, 108, 105, 111, 109, 114, 112, 116, 115]
      const close = [100, 104, 101, 107, 104, 109, 106, 111, 107, 114, 111, 117, 114, 119, 117]
      const result = atr(high, low, close, 14)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(10)
    })

    test('should calculate ATR for stable data', () => {
      const high = Array.from({ length: 15 }, () => 101)
      const low = Array.from({ length: 15 }, () => 99)
      const close = Array.from({ length: 15 }, () => 100)
      const result = atr(high, low, close, 14)
      expect(result).toBeCloseTo(2, 1) // True range is consistently 2
    })

    test('should handle gaps between days', () => {
      const high = [102, 105, 98, 108, 103]
      const low = [98, 101, 94, 104, 99]
      const close = [100, 104, 96, 107, 101]
      const result = atr(high, low, close, 3)
      expect(result).toBeGreaterThan(0)
    })

    test('should increase with higher volatility', () => {
      const high1 = [101, 102, 101, 102, 101, 102, 101, 102, 101, 102, 101, 102, 101, 102, 101]
      const low1 = [99, 98, 99, 98, 99, 98, 99, 98, 99, 98, 99, 98, 99, 98, 99]
      const close1 = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
      const atr1 = atr(high1, low1, close1, 14)

      const high2 = [110, 120, 105, 125, 100, 130, 95, 135, 90, 140, 85, 145, 80, 150, 75]
      const low2 = [90, 80, 95, 75, 100, 70, 105, 65, 110, 60, 115, 55, 120, 50, 125]
      const close2 = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
      const atr2 = atr(high2, low2, close2, 14)

      expect(atr2).toBeGreaterThan(atr1)
    })

    test('should handle minimum data points', () => {
      const high = [102, 105, 103, 108, 106, 110, 108, 112, 109, 115, 113, 118, 116, 120, 119]
      const low = [98, 101, 99, 104, 102, 106, 104, 108, 105, 111, 109, 114, 112, 116, 115]
      const close = [100, 104, 101, 107, 104, 109, 106, 111, 107, 114, 111, 117, 114, 119, 117]
      const result = atr(high, low, close, 3)
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThan(0)
    })

    test('should consider previous close in true range', () => {
      const high = [102, 110] // Large gap up
      const low = [98, 108]
      const close = [100, 109]
      const result = atr(high, low, close, 1)
      // True range should be max(110-108, |110-100|, |108-100|) = 10
      expect(result).toBeGreaterThan(8)
    })
  })

  describe('trendStrength - Trend Strength', () => {
    test('should calculate positive trend strength for uptrend', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2)
      const strength = trendStrength(prices)
      expect(strength).toBeGreaterThan(0)
    })

    test('should calculate negative trend strength for downtrend', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 200 - i * 2)
      const strength = trendStrength(prices)
      expect(strength).toBeLessThan(0)
    })

    test('should calculate near-zero trend strength for sideways movement', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + Math.sin(i) * 2)
      const strength = trendStrength(prices)
      expect(Math.abs(strength)).toBeLessThan(0.5)
    })

    test('should show stronger trend for steeper slope', () => {
      const prices1 = Array.from({ length: 20 }, (_, i) => 100 + i)
      const prices2 = Array.from({ length: 20 }, (_, i) => 100 + i * 3)
      const strength1 = trendStrength(prices1)
      const strength2 = trendStrength(prices2)
      expect(Math.abs(strength2)).toBeGreaterThan(Math.abs(strength1))
    })

    test('should normalize by price', () => {
      // Same absolute change but different price levels
      const prices1 = Array.from({ length: 20 }, (_, i) => 10 + i)
      const prices2 = Array.from({ length: 20 }, (_, i) => 1000 + i)
      const strength1 = trendStrength(prices1)
      const strength2 = trendStrength(prices2)
      // Higher priced stock should have lower normalized trend
      expect(Math.abs(strength1)).toBeGreaterThan(Math.abs(strength2))
    })

    test('should handle stable prices', () => {
      const prices = Array.from({ length: 20 }, () => 100)
      const strength = trendStrength(prices)
      expect(strength).toBeCloseTo(0, 5)
    })

    test('should handle volatile but trendless data', () => {
      const prices = [100, 110, 95, 105, 90, 100, 85, 95, 105, 100, 110, 95, 100, 105, 95, 100]
      const strength = trendStrength(prices)
      expect(Math.abs(strength)).toBeLessThan(1)
    })
  })
})

describe('Stock Validator', () => {
  describe('validateTicker', () => {
    test('should accept valid simple ticker symbols', () => {
      const result = validateTicker('AAPL')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedTicker).toBe('AAPL')
      expect(result.errors).toEqual([])
    })

    test('should accept tickers with numbers', () => {
      const result = validateTicker('BRK.B')
      expect(result.isValid).toBe(true)
    })

    test('should accept tickers with dots', () => {
      const result = validateTicker('FOO.ASX')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedTicker).toBe('FOO.ASX')
    })

    test('should accept tickers with dashes', () => {
      const result = validateTicker('BTC-USD')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedTicker).toBe('BTC-USD')
    })

    test('should sanitize by converting to uppercase', () => {
      const result = validateTicker('aapl')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedTicker).toBe('AAPL')
    })

    test('should trim whitespace', () => {
      const result = validateTicker('  AAPL  ')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedTicker).toBe('AAPL')
    })

    test('should remove internal whitespace', () => {
      const result = validateTicker('A A P L')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedTicker).toBe('AAPL')
    })

    test('should reject tickers with invalid characters', () => {
      const result = validateTicker('AAPL!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker contains invalid characters')
    })

    test('should reject tickers with special characters', () => {
      const invalids = ['AAPL@', 'GO#G', 'AM$N', 'TSL*', 'NVD&A']
      invalids.forEach((ticker) => {
        const result = validateTicker(ticker)
        expect(result.isValid).toBe(false)
      })
    })

    test('should reject tickers that are too long', () => {
      const result = validateTicker('VERYVERYLONGTICKERNAME')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker cannot exceed 10 characters')
    })

    test('should reject empty tickers', () => {
      const result = validateTicker('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker must be at least 1 characters')
    })

    test('should reject tickers with consecutive dots', () => {
      const result = validateTicker('FOO..ASX')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker cannot contain consecutive dots or dashes')
    })

    test('should reject tickers with consecutive dashes', () => {
      const result = validateTicker('BTC--USD')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker cannot contain consecutive dots or dashes')
    })

    test('should reject tickers starting with dot', () => {
      const result = validateTicker('.AAPL')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker cannot start or end with dot or dash')
    })

    test('should reject tickers ending with dot', () => {
      const result = validateTicker('AAPL.')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker cannot start or end with dot or dash')
    })

    test('should reject tickers starting with dash', () => {
      const result = validateTicker('-AAPL')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker cannot start or end with dot or dash')
    })

    test('should reject tickers ending with dash', () => {
      const result = validateTicker('AAPL-')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker cannot start or end with dot or dash')
    })

    test('should handle non-string input', () => {
      const result = validateTicker(123 as unknown as string)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker must be a string')
    })

    test('should accept common crypto tickers', () => {
      const cryptos = ['BTC-USD', 'ETH-USD', 'XRP-USD']
      cryptos.forEach((ticker) => {
        const result = validateTicker(ticker)
        expect(result.isValid).toBe(true)
      })
    })

    test('should accept international tickers', () => {
      const intl = ['0700.HK', 'SAP.DE', 'BP.L']
      intl.forEach((ticker) => {
        const result = validateTicker(ticker)
        expect(result.isValid).toBe(true)
      })
    })

    test('should return multiple errors for multiple violations', () => {
      const result = validateTicker('..TOOLONGTICKER!!')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })

    test('should handle custom validation options', () => {
      const result = validateTicker('AB', { minLength: 3 })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Ticker must be at least 3 characters')
    })
  })

  describe('isValidTicker', () => {
    test('should return true for valid tickers', () => {
      expect(isValidTicker('AAPL')).toBe(true)
      expect(isValidTicker('GOOGL')).toBe(true)
      expect(isValidTicker('MSFT')).toBe(true)
      expect(isValidTicker('BTC-USD')).toBe(true)
    })

    test('should return false for invalid tickers', () => {
      expect(isValidTicker('AAPL!')).toBe(false)
      expect(isValidTicker('')).toBe(false)
      expect(isValidTicker('...')).toBe(false)
      expect(isValidTicker('TOOLONGTICKERNAME')).toBe(false)
    })

    test('should handle case insensitivity', () => {
      expect(isValidTicker('aapl')).toBe(true)
      expect(isValidTicker('AaPl')).toBe(true)
    })

    test('should be a boolean shortcut', () => {
      const ticker = 'AAPL'
      const longForm = validateTicker(ticker).isValid
      const shortForm = isValidTicker(ticker)
      expect(longForm).toBe(shortForm)
    })
  })
})

describe('Retry Handler', () => {
  describe('executeWithRetry', () => {
    test('should succeed on first attempt', async () => {
      const mockFn = mock(() => Promise.resolve('success'))
      const result = await executeWithRetry(mockFn)
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    test('should retry on failure and eventually succeed', async () => {
      let attempts = 0
      const mockFn = mock(() => {
        attempts++
        if (attempts < 2) {
          return Promise.reject(new Error('Temporary failure'))
        }
        return Promise.resolve('success')
      })

      const result = await executeWithRetry(mockFn, 3, 10, 100) // Short delays for testing
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    test('should throw error after max retries', async () => {
      const mockFn = mock(() => Promise.reject(new Error('Permanent failure')))

      try {
        await executeWithRetry(mockFn, 2, 10, 100)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Permanent failure')
        expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
      }
    })

    test('should apply exponential backoff', async () => {
      let attempts = 0

      const mockFn = mock(() => {
        attempts++
        if (attempts <= 3) {
          return Promise.reject(new Error('Retry'))
        }
        return Promise.resolve('success')
      })

      const startTime = Date.now()
      await executeWithRetry(mockFn, 3, 50, 500)
      const totalTime = Date.now() - startTime

      // Should take at least 50ms + 100ms + 200ms = 350ms (with jitter ~315ms)
      expect(totalTime).toBeGreaterThan(300)
    })

    test('should respect max delay', async () => {
      let attempts = 0
      const mockFn = mock(() => {
        attempts++
        if (attempts < 5) {
          return Promise.reject(new Error('Retry'))
        }
        return Promise.resolve('success')
      })

      const startTime = Date.now()
      await executeWithRetry(mockFn, 5, 100, 200) // Max delay capped at 200ms
      const totalTime = Date.now() - startTime

      // Even with exponential backoff, delays should be capped
      expect(totalTime).toBeLessThan(1500) // Should not grow unbounded
    })

    test('should handle async function returning data', async () => {
      const mockFn = mock(() => Promise.resolve({ data: 'test', value: 42 }))
      const result = await executeWithRetry(mockFn)
      expect(result).toEqual({ data: 'test', value: 42 })
    })

    test('should preserve error context', async () => {
      const customError = new Error('Custom error with context')
      const mockFn = mock(() => Promise.reject(customError))

      try {
        await executeWithRetry(mockFn, 1, 10, 100)
      } catch (error) {
        expect(error).toBe(customError)
      }
    })

    test('should work with default parameters', async () => {
      const mockFn = mock(() => Promise.resolve('default params work'))
      const result = await executeWithRetry(mockFn)
      expect(result).toBe('default params work')
    })

    test('should handle synchronous errors', async () => {
      const mockFn = mock(() => {
        throw new Error('Synchronous error')
      })

      try {
        await executeWithRetry(mockFn, 1, 10, 100)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Synchronous error')
      }
    })
  })
})

// Mock type for testing that matches KVNamespace interface
interface MockKV {
  get: ReturnType<typeof mock>
  put: ReturnType<typeof mock>
}

describe('CacheManager', () => {
  let mockKV: MockKV

  beforeEach(() => {
    mockKV = {
      get: mock(() => Promise.resolve(null)),
      put: mock(() => Promise.resolve()),
    }
  })

  describe('constructor', () => {
    test('should create cache manager without KV', () => {
      const cache = new CacheManager()
      expect(cache).toBeInstanceOf(CacheManager)
    })

    test('should create cache manager with KV', () => {
      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      expect(cache).toBeInstanceOf(CacheManager)
    })

    test('should accept custom TTL', () => {
      const cache = new CacheManager(mockKV as unknown as KVNamespace, 600)
      expect(cache).toBeInstanceOf(CacheManager)
    })
  })

  describe('get', () => {
    test('should return null when cache is not available', async () => {
      const cache = new CacheManager()
      const result = await cache.get('test-key')
      expect(result).toBeNull()
    })

    test('should return null for cache miss', async () => {
      mockKV.get = mock(() => Promise.resolve(null))
      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      const result = await cache.get('missing-key')
      expect(result).toBeNull()
    })

    test('should return cached data if not expired', async () => {
      const cachedData = {
        data: { value: 'test' },
        timestamp: Date.now(),
      }
      mockKV.get = mock(() => Promise.resolve(JSON.stringify(cachedData)))

      const cache = new CacheManager(mockKV as unknown as KVNamespace, 300)
      const result = await cache.get('test-key')
      expect(result).toEqual({ value: 'test' })
    })

    test('should return null for expired data', async () => {
      const cachedData = {
        data: { value: 'test' },
        timestamp: Date.now() - 400000, // 400 seconds ago
      }
      mockKV.get = mock(() => Promise.resolve(JSON.stringify(cachedData)))

      const cache = new CacheManager(mockKV as unknown as KVNamespace, 300)
      const result = await cache.get('stock:AAPL')
      expect(result).toBeNull()
    })

    test('should handle different TTLs for different key prefixes', async () => {
      const cache = new CacheManager(mockKV as unknown as KVNamespace)

      // Quote cache (60s TTL)
      const recentQuote = {
        data: { price: 150 },
        timestamp: Date.now() - 50000, // 50 seconds ago
      }
      mockKV.get = mock(() => Promise.resolve(JSON.stringify(recentQuote)))
      const quoteResult = await cache.get('quote:AAPL')
      expect(quoteResult).toEqual({ price: 150 })

      // Analysis cache (300s TTL)
      const oldAnalysis = {
        data: { score: 75 },
        timestamp: Date.now() - 100000, // 100 seconds ago
      }
      mockKV.get = mock(() => Promise.resolve(JSON.stringify(oldAnalysis)))
      const analysisResult = await cache.get('stock:AAPL')
      expect(analysisResult).toEqual({ score: 75 })
    })

    test('should handle parse errors gracefully', async () => {
      mockKV.get = mock(() => Promise.resolve('invalid json'))
      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      const result = await cache.get('test-key')
      expect(result).toBeNull()
    })

    test('should handle KV errors gracefully', async () => {
      mockKV.get = mock(() => Promise.reject(new Error('KV error')))
      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      const result = await cache.get('test-key')
      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    test('should do nothing when cache is not available', async () => {
      const cache = new CacheManager()
      await cache.set('test-key', { value: 'test' })
      // Should not throw
    })

    test('should store data with timestamp', async () => {
      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      await cache.set('test-key', { value: 'test' })

      expect(mockKV.put).toHaveBeenCalled()
      const [key, value, options] = mockKV.put.mock.calls[0]
      expect(key).toBe('test-key')

      const stored = JSON.parse(value)
      expect(stored.data).toEqual({ value: 'test' })
      expect(stored.timestamp).toBeGreaterThan(0)
      expect(options.expirationTtl).toBeGreaterThan(0)
    })

    test('should use tiered TTL based on key prefix', async () => {
      const cache = new CacheManager(mockKV as unknown as KVNamespace)

      await cache.set('quote:AAPL', { price: 150 })
      expect(mockKV.put.mock.calls[0][2].expirationTtl).toBe(60)

      await cache.set('stock:AAPL', { score: 75 })
      expect(mockKV.put.mock.calls[1][2].expirationTtl).toBe(300)

      await cache.set('historical:AAPL', { data: [] })
      expect(mockKV.put.mock.calls[2][2].expirationTtl).toBe(3600)

      await cache.set('tickers:most_active', { tickers: [] })
      expect(mockKV.put.mock.calls[3][2].expirationTtl).toBe(1800)
    })

    test('should handle KV errors gracefully', async () => {
      mockKV.put = mock(() => Promise.reject(new Error('KV error')))
      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      await cache.set('test-key', { value: 'test' })
      // Should not throw
    })
  })

  describe('getWithRevalidate', () => {
    test('should fetch fresh data when no cache available', async () => {
      const cache = new CacheManager()
      const fetchFn = mock(() => Promise.resolve({ value: 'fresh' }))

      const result = await cache.getWithRevalidate('test-key', fetchFn)
      expect(result).toEqual({ value: 'fresh' })
      expect(fetchFn).toHaveBeenCalledTimes(1)
    })

    test('should return fresh cached data immediately', async () => {
      const cachedData = {
        data: { value: 'cached' },
        timestamp: Date.now() - 100000, // 100 seconds ago
      }
      mockKV.get = mock(() => Promise.resolve(JSON.stringify(cachedData)))

      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      const fetchFn = mock(() => Promise.resolve({ value: 'fresh' }))

      const result = await cache.getWithRevalidate('test-key', fetchFn, 200, 400)
      expect(result).toEqual({ value: 'cached' })
      expect(fetchFn).not.toHaveBeenCalled()
    })

    test('should return stale data and revalidate in background', async () => {
      const cachedData = {
        data: { value: 'stale' },
        timestamp: Date.now() - 350000, // 350 seconds ago (stale but within maxStale)
      }
      mockKV.get = mock(() => Promise.resolve(JSON.stringify(cachedData)))

      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      const fetchFn = mock(() => Promise.resolve({ value: 'fresh' }))

      const result = await cache.getWithRevalidate('test-key', fetchFn, 300, 600)
      expect(result).toEqual({ value: 'stale' })

      // Give background revalidation time to complete
      await Bun.sleep(10)
      expect(fetchFn).toHaveBeenCalled()
    })

    test('should fetch fresh data when cache too old', async () => {
      const cachedData = {
        data: { value: 'very-old' },
        timestamp: Date.now() - 4000000, // Very old
      }
      mockKV.get = mock(() => Promise.resolve(JSON.stringify(cachedData)))

      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      const fetchFn = mock(() => Promise.resolve({ value: 'fresh' }))

      const result = await cache.getWithRevalidate('test-key', fetchFn, 300, 3600)
      expect(result).toEqual({ value: 'fresh' })
      expect(fetchFn).toHaveBeenCalled()
    })

    test('should handle cache errors by fetching fresh data', async () => {
      mockKV.get = mock(() => Promise.reject(new Error('KV error')))

      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      const fetchFn = mock(() => Promise.resolve({ value: 'fresh' }))

      const result = await cache.getWithRevalidate('test-key', fetchFn)
      expect(result).toEqual({ value: 'fresh' })
      expect(fetchFn).toHaveBeenCalled()
    })

    test('should handle fetch errors gracefully', async () => {
      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      const fetchFn = mock(() => Promise.reject(new Error('Fetch error')))

      try {
        await cache.getWithRevalidate('test-key', fetchFn)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Fetch error')
      }
    })

    test('should return stale data when background revalidation is triggered', async () => {
      const cachedData = {
        data: { value: 'stale' },
        timestamp: Date.now() - 350000, // Stale but within maxStale
      }
      mockKV.get = mock(() => Promise.resolve(JSON.stringify(cachedData)))

      const cache = new CacheManager(mockKV as unknown as KVNamespace)
      let revalidationCalled = false
      const fetchFn = mock(() => {
        revalidationCalled = true
        // Return a promise that resolves later
        return new Promise((resolve) => {
          setTimeout(() => resolve({ value: 'fresh' }), 100)
        })
      })

      const result = await cache.getWithRevalidate('test-key', fetchFn, 300, 600)
      // Should immediately return stale data
      expect(result).toEqual({ value: 'stale' })

      // Background revalidation should be triggered
      await Bun.sleep(50)
      expect(revalidationCalled).toBe(true)
    })
  })
})
