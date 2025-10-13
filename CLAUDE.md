# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StockPulse** is a Cloudflare Workers-based stock and cryptocurrency analysis API that provides real-time technical analysis and trading signals using Yahoo Finance data. It's built for edge computing with ultra-fast global responses.

**Crypto Support**: Fully supports cryptocurrency analysis (BTC-USD, ETH-USD, etc.) using the same technical indicators as stocks. Yahoo Finance natively supports crypto tickers with identical data structures.

## Development Commands

### Essential Commands
```bash
# Local development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# View live production logs
npm run tail

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Format code with Biome
npm run lint
```

### Cloudflare KV Setup (Optional)
```bash
# Create KV namespace for caching
npx wrangler kv namespace create "STOCK_CACHE"
npx wrangler kv namespace create "STOCK_CACHE" --preview

# Update IDs in wrangler.toml after creation
```

### Environment Setup
```bash
# Set FMP API key as secret (recommended)
npx wrangler secret put FMP_API_KEY

# Or for local dev, create .dev.vars (never commit)
echo "FMP_API_KEY=your_key_here" > .dev.vars
```

## Code Architecture

### Request Flow
1. **Hono Router** (src/index.ts) - HTTP request handling with middleware
2. **Rate Limiting** (src/rateLimiter.ts) - Durable Object-based rate limiter
3. **Stock Analyzer** (src/analyzer.ts) - Core technical analysis engine
4. **Yahoo Finance Client** (src/yahooFinance.ts) - Custom API client for Workers
5. **Ticker Fetcher** (src/tickerFetcher.ts) - Dynamic market scanner with FMP + Yahoo fallback
6. **Caching Layer** (src/utils.ts) - KV-based caching with TTL

### Core Components

#### StockAnalyzer (src/analyzer.ts)
The heart of the analysis engine. Uses a sophisticated scoring algorithm that combines:
- **Trend indicators**: SMA 50/200 (Golden/Death Cross), EMA 20, trend strength
- **Momentum indicators**: RSI (14-period), MACD with signal line and histogram
- **Volatility indicators**: Bollinger Bands, ATR for stop-loss calculation
- **Volume analysis**: Volume ratio against 20-period average
- **Fundamentals**: P/E, Forward P/E, PEG ratio, profit margin, debt-to-equity

**Scoring System**: Weighted algorithm assigns points for bullish/bearish signals:
- Golden/Death Cross: ±15 points
- RSI conditions: up to ±20 points with extreme overbought/oversold detection
- MACD crossovers: ±20 points when both line and histogram confirm
- Price vs EMA 20: ±12 points
- Bollinger Band position: ±15 points with extreme detection
- Volume: ±20 points with very high volume bonus
- Trend strength: ±15 points
- Fundamentals: ±15 points

**Veto Conditions**: Overrides score when extreme overbought (RSI > 75 AND BB > 0.9) or extreme oversold (RSI < 25 AND BB < 0.1).

**Multi-Indicator Confirmation**: Requires at least 3 of 4 key indicators aligned for strong BUY/SELL signals.

**Recommendation Thresholds**:
- STRONG BUY: score ≥ 60
- BUY: score ≥ 40
- HOLD: -40 to 40
- SELL: score ≤ -40
- STRONG SELL: score ≤ -60

#### Yahoo Finance Client (src/yahooFinance.ts)
Custom implementation to avoid Node.js dependencies. Uses:
- Chart API for historical data: `/v8/finance/chart/{ticker}?period1=X&period2=Y&interval=1d`
- Quote API for fundamentals via Chart API summary
- Custom User-Agent headers to mimic browser requests
- Handles null data points gracefully

**Important**: Yahoo Finance only returns trading days (Mon-Fri excluding holidays). Request ~1.5x the needed trading days to account for weekends/holidays.

#### Ticker Fetcher (src/tickerFetcher.ts)
Multi-API strategy with intelligent fallback:
1. **Primary**: Financial Modeling Prep (FMP) API for real-time market movers
   - `/api/v3/stock_market/actives` - Most active stocks
   - `/api/v3/stock_market/gainers` - Top gainers
   - `/api/v3/stock_market/losers` - Worst performers
2. **Fallback**: Yahoo Finance trending API
3. **Final Fallback**: Static curated list of liquid stocks

**Filtering**: Excludes penny stocks (< $5) and low volume (< 1M daily volume).

#### Rate Limiter (src/rateLimiter.ts)
Implements Durable Objects for distributed rate limiting:
- **Window**: 60 seconds sliding window
- **Limit**: 100 requests per minute per client IP
- **Fail Open**: If rate limit check fails, allows request (doesn't block on errors)
- **Client Identification**: Uses CF-Connecting-IP header (Cloudflare's real IP)

#### Technical Indicators (src/utils.ts)
All indicators are implemented from scratch:
- **SMA**: Simple Moving Average using sliding window
- **EMA**: Exponential Moving Average with first value as SMA
- **RSI**: Relative Strength Index with smoothed gains/losses
- **MACD**: Fast EMA (12) - Slow EMA (26), with signal line (9-period EMA of MACD)
- **Bollinger Bands**: SMA ± 2 standard deviations
- **ATR**: Average True Range for volatility-based stop-loss
- **Trend Strength**: Linear regression slope normalized by price

#### Caching (src/utils.ts - CacheManager)
- **KV Storage**: Cloudflare KV for distributed edge caching
- **TTL**: 300 seconds (5 minutes) default for analysis results
- **Structure**: Stores `{ data, timestamp }` with manual TTL checking
- **Graceful Degradation**: Functions without KV if not configured

### Cryptocurrency Support

#### How Crypto Works
Yahoo Finance treats cryptocurrency tickers identically to stocks:
- **Format**: `{SYMBOL}-USD` (e.g., `BTC-USD`, `ETH-USD`, `XRP-USD`)
- **Data**: Same OHLCV (Open, High, Low, Close, Volume) structure
- **Indicators**: All technical indicators (RSI, MACD, SMA, Bollinger Bands) work identically
- **Analysis**: Same scoring algorithm and recommendation system

#### Crypto Ticker Fetching Strategy
When using `strategy=crypto` in the scanner:
1. **Primary**: CoinGecko API (free, no key required, 30 calls/min)
   - Fetches top 50 cryptos by market cap
   - Maps to Yahoo Finance format (e.g., `btc` → `BTC-USD`)
   - Filters out stablecoins (USDT, USDC, DAI, BUSD, TUSD)
2. **Fallback**: Static crypto list with top 20 cryptocurrencies

#### Static Crypto Tickers (src/tickers.ts)
Pre-defined list of 20 major cryptocurrencies:
- Major: BTC-USD, ETH-USD, BNB-USD, SOL-USD, XRP-USD
- DeFi: UNI-USD, LINK-USD, AAVE-USD, AVAX-USD
- Memecoins: DOGE-USD, SHIB-USD
- Layer 1: ADA-USD, DOT-USD, ATOM-USD, ALGO-USD

#### Testing Crypto Analysis
```bash
# Test single crypto
curl http://localhost:8787/api/analyze/BTC-USD

# Test crypto scanner
curl "http://localhost:8787/api/scanner?limit=10&strategy=crypto"

# Test batch crypto analysis
curl -X POST http://localhost:8787/api/batch \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["BTC-USD", "ETH-USD", "SOL-USD"]}'
```

### Configuration

#### Analysis Configuration (src/analyzer.ts)
Configurable parameters for all technical indicators:
```typescript
{
  shortMovingAverage: 50,    // Fast SMA period
  longMovingAverage: 200,    // Slow SMA period
  rsiPeriod: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  bollingerPeriod: 20,
  bollingerStdDev: 2,
  atrPeriod: 14,
  volumePeriod: 20,
  cacheTtl: 300,              // Cache duration
  maxRetryAttempts: 3,        // API retry attempts
  retryDelay: 1000,           // Initial retry delay (ms)
  maxRetryDelay: 5000,        // Max retry delay (ms)
}
```

To modify: Pass partial config to `StockAnalyzer` constructor or use `updateConfig()` method.

#### Environment Variables (wrangler.toml)
```toml
ENVIRONMENT = "production"
TICKER_STRATEGY = "most_active"  # Options: most_active, gainers, losers, mixed, crypto, static
```

### API Endpoints

1. **GET /** - Dashboard with interactive UI (supports crypto)
2. **GET /api/health** - Health check endpoint
3. **GET /api/analyze/:ticker** - Analyze single stock or crypto (e.g., AAPL or BTC-USD)
4. **POST /api/batch** - Analyze up to 10 tickers (stocks, crypto, or mixed)
5. **GET /api/scanner?limit=20&strategy=most_active** - Market scanner (strategies: most_active, gainers, losers, mixed, crypto, static)
6. **POST /api/scanner** - Scanner with custom ticker list (up to 50 tickers, stocks and crypto)

### Data Flow Example

For `/api/analyze/AAPL`:
1. Rate limiter checks client IP (Durable Object)
2. Ticker validation and sanitization
3. Check KV cache for `stock:AAPL`
4. If cache miss:
   - Fetch 375 calendar days of historical data from Yahoo Finance
   - Fetch current quote for fundamentals
   - Calculate all technical indicators
   - Generate scoring with reasons
   - Calculate target price and stop-loss using ATR
   - Generate full chart data arrays (250 trading days visible)
   - Cache result in KV
5. Return full analysis with recommendation

### Testing

Tests use Jest with ts-jest preset:
- Test environment: Node.js (not Cloudflare Workers runtime)
- Tests location: `tests/` directory
- Path alias: `@/` maps to `src/`
- Coverage: Collects from `src/**/*.{ts,js}`, excludes `*.d.ts`

## Important Implementation Details

### MACD Calculation Timing
MACD requires 26 trading days minimum (slow EMA period). Signal line requires 9 more days. Histogram starts when signal line is available. Chart data must align all indicator arrays properly - see `generateChartData()` in analyzer.ts for alignment logic.

### Chart Data Alignment
Different indicators start at different points in the historical data:
- SMA 50 starts at index 49
- SMA 200 starts at index 199
- MACD line starts at index 25
- MACD signal starts at index 33

The `alignArray()` helper in analyzer.ts ensures all indicators align correctly when chart starts at index 199.

### Cloudflare Workers Constraints
- No Node.js built-ins (fs, path, etc.)
- Use `fetch()` for all HTTP requests
- Durable Objects for stateful rate limiting
- KV for distributed caching
- All code must be compatible with V8 isolates

### Error Handling Philosophy
- **Retry with exponential backoff** for transient failures
- **Graceful degradation** for missing data (fundamentals, MACD)
- **Fail open** for rate limiting (don't block on errors)
- **Descriptive errors** with context (ticker, reason)

### Biome Formatting
- **Semicolons**: As needed (not required)
- **Quotes**: Single quotes
- **Line width**: 120 for JS/TS, 100 for JSON
- **Indent**: 2 spaces

Run `npm run lint` to format. Biome linter is disabled.

## Common Development Tasks

### Adding a New Technical Indicator
1. Implement calculation in `TechnicalIndicators` class (src/utils.ts)
2. Call from `calculateMetrics()` in StockAnalyzer (src/analyzer.ts)
3. Add to `StockMetrics` interface (src/types.ts)
4. Update scoring in `calculateScore()` method
5. Add to chart data generation if time-series indicator

### Modifying Scoring Algorithm
Edit `calculateScore()` in src/analyzer.ts. Each indicator contributes weighted points. Consider:
- Bullish/bearish count for confirmation
- Extreme conditions (veto logic)
- Multi-indicator alignment requirements
- Reasons array for explainability

### Testing Locally
1. `npm run dev` starts local server on http://localhost:8787
2. Test endpoint: `curl http://localhost:8787/api/analyze/AAPL`
3. Use `.dev.vars` for local secrets (not committed)
4. KV preview namespace used automatically in dev mode

### Deployment
1. `npm run deploy` pushes to Cloudflare Workers
2. Uses production KV namespaces (not preview)
3. Secrets must be set via `npx wrangler secret put SECRET_NAME`
4. Check logs: `npm run tail`

## TypeScript Configuration

- **Target**: ES2022 (Cloudflare Workers runtime)
- **Module**: ESNext
- **Path Mapping**: `@/*` → `src/*`
- **Strict Mode**: Enabled
- **Lib**: ES2022 + WebWorker (for Workers types)

## Key Dependencies

- **hono**: Ultrafast web framework for Workers
- **@cloudflare/workers-types**: TypeScript definitions
- **biome**: Fast formatter (replaces Prettier/ESLint)
- **wrangler**: Cloudflare Workers CLI
- **jest + ts-jest**: Testing framework

## Troubleshooting

### "Insufficient data" errors
Yahoo Finance may return fewer trading days than expected. Increase the multiplier in analyzer.ts line 67 from 1.5 to 2.0.

### MACD showing null
Not enough historical data (need 26+ trading days). Check `historical.length` in response.

### Rate limit errors in dev
Durable Objects may persist state between restarts. Clear by restarting dev server or wait 60 seconds.

### Cache not working
Verify KV namespace is bound in wrangler.toml and namespace exists in Cloudflare dashboard.

### FMP API not working
Check API key with `npx wrangler secret list`. Verify key is valid at financialmodelingprep.com. System falls back to Yahoo Finance if FMP fails.
