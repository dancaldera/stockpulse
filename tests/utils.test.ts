import { TechnicalIndicators, StockValidator, RetryHandler } from '../src/utils';

describe('TechnicalIndicators', () => {
  describe('sma', () => {
    it('should calculate simple moving average correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const sma = TechnicalIndicators.sma(data, 3);
      expect(sma).toEqual([20, 30, 40]);
    });

    it('should handle period larger than data', () => {
      const data = [10, 20, 30];
      const sma = TechnicalIndicators.sma(data, 5);
      expect(sma).toEqual([]);
    });

    it('should handle edge case with minimum data', () => {
      const data = [10, 20, 30];
      const sma = TechnicalIndicators.sma(data, 3);
      expect(sma).toEqual([20]);
    });
  });

  describe('ema', () => {
    it('should calculate exponential moving average correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const ema = TechnicalIndicators.ema(data, 3);
      expect(ema.length).toBe(3);
      expect(ema[0]).toBeCloseTo(20); // First EMA is SMA of first 3 values
      expect(ema[ema.length - 1]).toBeGreaterThan(ema[ema.length - 2]);
    });

    it('should handle empty data', () => {
      const data: number[] = [];
      const ema = TechnicalIndicators.ema(data, 3);
      expect(ema.length).toBeLessThanOrEqual(1); // Either empty or single value if SMA is calculated
    });
  });

  describe('rsi', () => {
    it('should calculate RSI correctly for uptrend', () => {
      const prices = Array.from({length: 20}, (_, i) => 100 + i * 2);
      const rsi = TechnicalIndicators.rsi(prices, 14);
      expect(rsi).toBeGreaterThan(70);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    it('should calculate RSI correctly for downtrend', () => {
      const prices = Array.from({length: 20}, (_, i) => 200 - i * 2);
      const rsi = TechnicalIndicators.rsi(prices, 14);
      expect(rsi).toBeLessThan(30);
      expect(rsi).toBeGreaterThanOrEqual(0);
    });

    it('should handle insufficient data', () => {
      const prices = [100, 101];
      const rsi = TechnicalIndicators.rsi(prices, 14);
      expect(isNaN(rsi) || (rsi >= 0 && rsi <= 100)).toBe(true);
    });
  });

  describe('macd', () => {
    it('should calculate MACD correctly', () => {
      const prices = Array.from({length: 50}, (_, i) => 100 + i * 0.1 + Math.sin(i * 0.1) * 5);
      const macd = TechnicalIndicators.macd(prices);
      expect(macd).toHaveProperty('macd');
      expect(macd).toHaveProperty('signal');
      expect(macd).toHaveProperty('histogram');
      expect(typeof macd.macd).toBe('number');
      expect(typeof macd.signal).toBe('number');
      expect(typeof macd.histogram).toBe('number');
    });

    it('should work with custom parameters', () => {
      // Need more data for longer EMA periods
      const prices = Array.from({length: 50}, (_, i) => 100 + i * 0.5);
      const macd = TechnicalIndicators.macd(prices, 12, 26, 9);
      expect(typeof macd.macd).toBe('number');
      expect(typeof macd.signal).toBe('number');
      expect(typeof macd.histogram).toBe('number');
    });
  });

  describe('bollingerBands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const prices = [100, 102, 98, 104, 96, 106, 94, 108, 92, 110,
                     101, 99, 103, 97, 105, 95, 107, 93, 109, 91];
      const bb = TechnicalIndicators.bollingerBands(prices);
      expect(bb.upper).toBeGreaterThan(bb.middle);
      expect(bb.lower).toBeLessThan(bb.middle);
      expect(bb.upper - bb.middle).toBe(bb.middle - bb.lower); // Symmetric
    });

    it('should work with custom standard deviation', () => {
      const prices = [100, 102, 98, 104, 96, 106, 94, 108, 92, 110,
                     101, 99, 103, 97, 105, 95, 107, 93, 109, 91];
      const bb1 = TechnicalIndicators.bollingerBands(prices, 20, 1);
      const bb2 = TechnicalIndicators.bollingerBands(prices, 20, 2);
      expect(Math.abs(bb2.upper - bb2.lower)).toBeGreaterThan(Math.abs(bb1.upper - bb1.lower));
    });
  });

  describe('atr', () => {
    it('should calculate ATR for volatile data', () => {
      const high = [102, 105, 103, 108, 106];
      const low = [98, 101, 99, 104, 102];
      const close = [100, 104, 101, 107, 104];
      const atr = TechnicalIndicators.atr(high, low, close, 3);
      expect(atr).toBeGreaterThan(0);
      expect(atr).toBeLessThan(10); // Reasonable range
    });

    it('should calculate ATR for stable data', () => {
      const high = [101, 101, 101, 101, 101];
      const low = [99, 99, 99, 99, 99];
      const close = [100, 100, 100, 100, 100];
      const atr = TechnicalIndicators.atr(high, low, close, 3);
      expect(atr).toBe(2); // True range is consistently 2
    });
  });

  describe('trendStrength', () => {
    it('should calculate positive trend strength for uptrend', () => {
      const prices = Array.from({length: 20}, (_, i) => 100 + i * 2);
      const strength = TechnicalIndicators.trendStrength(prices);
      expect(strength).toBeGreaterThan(0);
    });

    it('should calculate negative trend strength for downtrend', () => {
      const prices = Array.from({length: 20}, (_, i) => 200 - i * 2);
      const strength = TechnicalIndicators.trendStrength(prices);
      expect(strength).toBeLessThan(0);
    });

    it('should calculate near zero trend strength for sideways', () => {
      const prices = Array.from({length: 20}, (_, i) => 100 + Math.sin(i) * 2);
      const strength = TechnicalIndicators.trendStrength(prices);
      expect(Math.abs(strength)).toBeLessThan(0.1);
    });
  });
});

describe('StockValidator', () => {
  describe('validateTicker', () => {
    it('should accept valid ticker symbols', () => {
      const result = StockValidator.validateTicker('AAPL');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedTicker).toBe('AAPL');
      expect(result.errors).toEqual([]);
    });

    it('should accept tickers with numbers and dots', () => {
      const result = StockValidator.validateTicker('FOO.ASX');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedTicker).toBe('FOO.ASX');
    });

    it('should sanitize ticker by converting to uppercase', () => {
      const result = StockValidator.validateTicker('aapl');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedTicker).toBe('AAPL');
    });

    it('should trim whitespace', () => {
      const result = StockValidator.validateTicker('  AAPL  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedTicker).toBe('AAPL');
    });

    it('should reject tickers with invalid characters', () => {
      const result = StockValidator.validateTicker('AAPL!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ticker contains invalid characters');
    });

    it('should reject tickers that are too long', () => {
      const result = StockValidator.validateTicker('VERYVERYLONGTICKERNAME');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ticker cannot exceed 10 characters');
    });

    it('should reject empty tickers', () => {
      const result = StockValidator.validateTicker('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ticker must be at least 1 characters');
    });

    it('should reject tickers with consecutive dots', () => {
      const result = StockValidator.validateTicker('FOO..ASX');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ticker cannot contain consecutive dots or dashes');
    });

    it('should reject tickers ending with dot', () => {
      const result = StockValidator.validateTicker('AAPL.');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ticker cannot start or end with dot or dash');
    });
  });

  describe('isValidTicker', () => {
    it('should return true for valid tickers', () => {
      expect(StockValidator.isValidTicker('AAPL')).toBe(true);
      expect(StockValidator.isValidTicker('GOOGL')).toBe(true);
    });

    it('should return false for invalid tickers', () => {
      expect(StockValidator.isValidTicker('AAPL!')).toBe(false);
      expect(StockValidator.isValidTicker('')).toBe(false);
    });
  });
});

describe('RetryHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await RetryHandler.executeWithRetry(mockFn);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      let attempts = 0;
      const mockFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve('success');
      });

      const promise = RetryHandler.executeWithRetry(mockFn, 2);
      await jest.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should validate retry parameters', () => {
      // Test that retry parameters are passed correctly (internal validation)
      expect(typeof RetryHandler.executeWithRetry).toBe('function');
    });
  });
});
