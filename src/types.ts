export interface StockSignal {
  ticker: string;
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL';
  confidence: number;
  price: number;
  target_price: number;
  stop_loss: number;
  potential_gain: number;
  risk: number;
  risk_reward_ratio: number;
  reasons: string[];
  metrics: StockMetrics;
  timestamp: string;
}

export interface StockMetrics {
  current_price: number;
  sma_50: number;
  sma_200: number;
  ema_20: number;
  rsi: number;
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  bb_position: number;
  volume_ratio: number;
  atr: number;
  trend_strength: number;
  pe_ratio?: number;
  forward_pe?: number;
  peg_ratio?: number;
  profit_margin?: number;
  debt_to_equity?: number;
  price_change_50d: number;
}

export type Bindings = {
  STOCK_CACHE?: KVNamespace;
  RATE_LIMITER?: DurableObjectNamespace;
  ENVIRONMENT?: string;
}

export interface CacheEntry {
  data: StockSignal;
  timestamp: number;
}
