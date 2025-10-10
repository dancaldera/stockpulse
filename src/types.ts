export interface ValidationResult {
  isValid: boolean
  sanitizedTicker: string
  errors: string[]
}

export interface ChartData {
  dates: string[]
  prices: number[]
  sma_50_values: number[]
  sma_200_values: number[]
  ema_20_values: number[]
  rsi_values: number[]
  macd_values: number[]
  macd_signal_values: number[]
  macd_histogram_values: number[]
  bb_upper: number[]
  bb_middle: number[]
  bb_lower: number[]
  volumes: number[]
  volume_sma: number[]
}

export interface StockSignal {
  ticker: string
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL'
  confidence: number
  price: number
  target_price: number
  stop_loss: number
  potential_gain: number
  risk: number
  risk_reward_ratio: number
  reasons: string[]
  metrics: StockMetrics
  chartData: ChartData
  timestamp: string
}

export interface StockMetrics {
  current_price: number
  sma_50: number
  sma_200: number
  ema_20: number
  rsi: number
  macd: number
  macd_signal: number
  macd_histogram: number
  bb_position: number
  volume_ratio: number
  atr: number
  trend_strength: number
  pe_ratio?: number
  forward_pe?: number
  peg_ratio?: number
  profit_margin?: number
  debt_to_equity?: number
  price_change_50d: number
}

export type Bindings = {
  STOCK_CACHE?: KVNamespace
  TICKER_CACHE?: KVNamespace
  RATE_LIMITER?: DurableObjectNamespace
  ENVIRONMENT?: string
  FMP_API_KEY?: string
  TICKER_STRATEGY?: 'most_active' | 'gainers' | 'losers' | 'mixed' | 'static'
}

export interface ValidationOptions {
  minLength?: number
  maxLength?: number
  allowedSymbols?: string[]
  allowNumbers?: boolean
}

export interface AnalysisConfig {
  shortMovingAverage: number
  longMovingAverage: number
  rsiPeriod: number
  rsiOversold: number
  rsiOverbought: number
  macdFast: number
  macdSlow: number
  macdSignal: number
  bollingerPeriod: number
  bollingerStdDev: number
  atrPeriod: number
  volumePeriod: number
  cacheTtl: number
  maxRetryAttempts: number
  retryDelay: number
  maxRetryDelay: number
}

export interface CacheEntry {
  data: StockSignal
  timestamp: number
}
