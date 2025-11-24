-- Signal history tables for StockPulse

CREATE TABLE IF NOT EXISTS ticker_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence REAL NOT NULL,
  price REAL NOT NULL,
  target_price REAL NOT NULL,
  stop_loss REAL NOT NULL,
  potential_gain REAL NOT NULL,
  risk REAL NOT NULL,
  risk_reward_ratio REAL NOT NULL,
  bullish_count INTEGER,
  bearish_count INTEGER,
  reasons TEXT,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ticker, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_ticker_signals_ticker_timestamp
  ON ticker_signals(ticker, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ticker_signals_recommendation
  ON ticker_signals(recommendation);
CREATE INDEX IF NOT EXISTS idx_ticker_signals_created_at
  ON ticker_signals(created_at DESC);

CREATE TABLE IF NOT EXISTS signal_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tickers_analyzed INTEGER NOT NULL,
  signals_saved INTEGER NOT NULL,
  duration_ms INTEGER,
  status TEXT NOT NULL,
  error_message TEXT,
  run_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signal_runs_timestamp
  ON signal_runs(run_timestamp DESC);
