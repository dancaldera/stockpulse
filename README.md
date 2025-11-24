# StockPulse 📈

Real-time stock analysis API on Cloudflare Workers with technical signals from Yahoo Finance.

## Features

- Edge deployment (300+ locations, <50ms response)
- 12+ technical indicators + fundamentals
- Daily cron job saves curated signals to D1
- Signal history dashboard at `/signals`
- Free Yahoo Finance data (no API keys)

## Quick Start

```bash
bun install
bun run dev     # http://localhost:8787
bun run deploy  # deploy to Cloudflare
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Main dashboard |
| `GET /signals` | Signal history dashboard |
| `GET /api/analyze/:ticker` | Analyze single stock |
| `POST /api/batch` | Analyze multiple (max 10) |
| `GET /api/scanner?limit=20&strategy=most_active` | Market scanner |
| `GET /api/signals/latest` | Latest signals |
| `GET /api/signals/history/:ticker` | Ticker history |
| `GET /api/signals/runs` | Cron execution log |
| `GET /api/health` | Health check |

### Scanner Strategies

- `most_active` - Highest volume (default)
- `gainers` - Top performers
- `losers` - Worst performers
- `mixed` - Combined
- `static` - Popular tickers

## Signal History (Cron)

Runs daily at 4pm ET analyzing 50 tickers:
- 19 curated: AAPL, AMD, ORCL, TSLA, INTC, NVDA, GOOGL, GS, NFLX, AMZN, MS, META, CSCO, WFC, JPM, BAC, CRM, V, ADBE
- Plus most active from Yahoo Finance

Signals stored in Cloudflare D1.

## Technical Indicators

**Trend**: SMA 50/200, EMA 20, Trend Strength, ADX
**Momentum**: RSI, MACD, Signal, Histogram
**Volatility**: Bollinger Bands, ATR
**Volume**: Volume Ratio
**Fundamentals**: P/E, Forward P/E, PEG, Profit Margin, Debt/Equity

## Recommendations

| Level | Score | Meaning |
|-------|-------|---------|
| STRONG BUY | ≥35 | Multiple bullish signals |
| BUY | 20-34 | Bullish outweighs bearish |
| HOLD | -19 to 19 | Mixed signals |
| SELL | -34 to -20 | Bearish outweighs bullish |
| STRONG SELL | ≤-35 | Multiple bearish signals |

## Response Example

```json
{
  "ticker": "AAPL",
  "recommendation": "BUY",
  "confidence": 65.5,
  "price": 258.02,
  "target_price": 268.50,
  "stop_loss": 248.75,
  "potential_gain": 4.06,
  "risk": 3.59,
  "risk_reward_ratio": 1.13,
  "reasons": ["✓ Golden Cross", "✓ RSI neutral", "✓ MACD bullish"]
}
```

## Configuration

Edit `wrangler.toml`:

```toml
[vars]
TICKER_STRATEGY = "most_active"

[[d1_databases]]
binding = "DB"
database_name = "stockpulse-signals"

[triggers]
crons = ["0 21 * * 1-5"]  # 4pm ET weekdays
```

## Commands

```bash
bun run dev          # Local dev
bun run test         # Run tests
bun run lint         # Lint code
bun run deploy       # Deploy
bun run tail         # View logs
```

## Stack

- Runtime: Cloudflare Workers
- Framework: Hono
- Database: Cloudflare D1
- Cache: Cloudflare KV
- Language: TypeScript

## Disclaimer

**Educational purposes only.** Not financial advice. Trading involves risk.

---

MIT License
