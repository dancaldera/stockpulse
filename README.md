# StockPulse 📈

A high-performance **Cloudflare Workers** stock analysis API that provides real-time technical analysis and trading signals using Yahoo Finance data. Built with edge computing for ultra-fast global responses.

---

## 🚀 Features

✅ **Global Edge Deployment** - Runs on Cloudflare's 300+ data centers worldwide
✅ **Sub-50ms Response Times** - Leverages edge computing for instant analysis
✅ **Dynamic Ticker Selection** - Automatically fetches most active, gainers, or losers
✅ **Multi-API Support** - FMP API with Yahoo Finance fallback
✅ **Comprehensive Analysis** - 12+ technical indicators + fundamentals
✅ **Smart Caching** - 5-minute cache for analysis + 30-minute cache for ticker lists
✅ **Auto-scaling** - Handles millions of requests seamlessly
✅ **Zero Cold Starts** - Instant responses, no warm-up needed
✅ **Free Tier** - 100,000 requests/day included on Cloudflare's free plan

---

## 📊 Technical Analysis Capabilities

The API performs comprehensive multi-dimensional analysis:

### **Trend Indicators**
- **SMA 50** (Short-term trend) - 50-day Simple Moving Average
- **SMA 200** (Long-term trend) - 200-day Simple Moving Average
- **EMA 20** (Momentum) - 20-day Exponential Moving Average
- **Trend Strength** - Linear regression slope analysis

### **Momentum Indicators**
- **RSI** (Relative Strength Index) - Overbought/oversold conditions
- **MACD** (Moving Average Convergence Divergence) - Trend reversals
- **MACD Signal Line** - Crossover signals
- **MACD Histogram** - Momentum strength

### **Volatility Indicators**
- **Bollinger Bands** - Price volatility and extremes
- **ATR** (Average True Range) - Volatility measurement for stop-loss

### **Volume Analysis**
- **Volume Ratio** - Current vs 20-day average volume

### **Fundamental Metrics** (when available)
- **P/E Ratio** (Price-to-Earnings)
- **Forward P/E** - Expected future earnings
- **PEG Ratio** (Price/Earnings to Growth)
- **Profit Margin** - Company profitability
- **Debt-to-Equity** - Financial leverage

---

## 🏗️ Project Structure

```
stockpulse/
├── src/
│   ├── index.ts        # Main API handler (Hono framework)
│   ├── analyzer.ts     # Stock analysis engine with scoring logic
│   ├── yahooFinance.ts # Custom Yahoo Finance API client
│   ├── types.ts        # TypeScript type definitions
│   └── utils.ts        # Technical indicators & caching utilities
├── wrangler.toml       # Cloudflare Workers configuration
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+ installed
- Cloudflare account (free tier works)

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd stockpulse

# Install dependencies
npm install

# Start local development server
npm run dev

# API will be available at http://localhost:8787
```

### Cloudflare Deployment

```bash
# Login to Cloudflare
npx wrangler login

# Deploy to production
npm run deploy

# View live logs
npm run tail
```

### Optional: Enable KV Caching

```bash
# Create KV namespace for stock data caching
npx wrangler kv namespace create "STOCK_CACHE"
npx wrangler kv namespace create "STOCK_CACHE" --preview

# Create KV namespace for ticker list caching
npx wrangler kv namespace create "TICKER_CACHE"
npx wrangler kv namespace create "TICKER_CACHE" --preview

# Copy the namespace IDs and update wrangler.toml:
# Update the [[kv_namespaces]] sections with your IDs
```

### Optional: Enable Dynamic Ticker Fetching

```bash
# Get a free API key from Financial Modeling Prep
# Visit: https://site.financialmodelingprep.com/developer/docs

# Set the API key as a secret (recommended)
npx wrangler secret put FMP_API_KEY
# Enter your API key when prompted

# Or for development, add to .dev.vars file (don't commit!)
echo "FMP_API_KEY=your_key_here" > .dev.vars

# Configure ticker strategy in wrangler.toml (already set)
# Options: most_active, gainers, losers, mixed, or static
```

### Custom Domain Setup

Update `wrangler.toml`:
```toml
[env.production]
route = "api.yourdomain.com/*"
```

---

## 🔌 API Endpoints

### 1. Root Endpoint
```bash
GET /
```
Returns API information and available endpoints.

**Example:**
```bash
curl http://localhost:8787/
```

**Response:**
```json
{
  "name": "Stock Analyzer API",
  "version": "1.0.0",
  "endpoints": {
    "analyze": "/api/analyze/:ticker",
    "batch": "/api/batch (POST)",
    "health": "/api/health"
  }
}
```

---

### 2. Health Check
```bash
GET /api/health
```
Returns API health status and environment info.

**Example:**
```bash
curl http://localhost:8787/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-06T00:00:00.000Z",
  "environment": "production"
}
```

---

### 3. Analyze Single Stock
```bash
GET /api/analyze/:ticker
```

Provides comprehensive analysis for a single ticker symbol.

**Example:**
```bash
curl http://localhost:8787/api/analyze/AAPL
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "recommendation": "BUY",
    "confidence": 65.5,
    "price": 258.02,
    "target_price": 268.50,
    "stop_loss": 248.75,
    "potential_gain": 4.06,
    "risk": 3.59,
    "risk_reward_ratio": 1.13,
    "reasons": [
      "✓ Golden Cross: 50-day MA above 200-day MA (bullish)",
      "✓ RSI neutral at 55.2 (healthy)",
      "✓ MACD bullish crossover",
      "✓ Price above 20-day EMA (short-term uptrend)",
      "✓ High volume (1.5x average)"
    ],
    "metrics": {
      "current_price": 258.02,
      "sma_50": 245.32,
      "sma_200": 228.87,
      "ema_20": 252.45,
      "rsi": 55.2,
      "macd": 2.45,
      "macd_signal": 1.87,
      "macd_histogram": 0.58,
      "bb_position": 0.65,
      "volume_ratio": 1.5,
      "atr": 4.85,
      "trend_strength": 0.85,
      "pe_ratio": 28.5,
      "forward_pe": 24.3,
      "peg_ratio": 0.95,
      "profit_margin": 25.5,
      "debt_to_equity": 1.73,
      "price_change_50d": 5.48
    },
    "timestamp": "2025-10-06T00:00:00.000Z"
  },
  "cached": false
}
```

---

### 4. Market Scanner (Dynamic Ticker Selection)
```bash
GET /api/scanner?limit=20&strategy=most_active
```

Automatically scan the market based on real-time activity. Returns top opportunities sorted by potential gain.

**Query Parameters:**
- `limit` (optional): Number of results (1-50, default: 20)
- `strategy` (optional): Ticker selection strategy
  - `most_active`: Stocks with highest trading volume (default)
  - `gainers`: Top performing stocks today
  - `losers`: Worst performing stocks today
  - `mixed`: Combination of actives and gainers
  - `static`: Predefined popular ticker list

**Example:**
```bash
# Get top 10 most active stocks
curl "http://localhost:8787/api/scanner?limit=10&strategy=most_active"

# Get top 25 gainers
curl "http://localhost:8787/api/scanner?limit=25&strategy=gainers"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ticker": "NVDA",
      "recommendation": "STRONG BUY",
      "confidence": 85.2,
      "price": 875.50,
      "potential_gain": 8.45,
      "risk_reward_ratio": 2.8
    },
    {
      "ticker": "TSLA",
      "recommendation": "BUY",
      "confidence": 62.3,
      "price": 245.20,
      "potential_gain": 5.12,
      "risk_reward_ratio": 2.1
    }
  ],
  "total": 2,
  "strategy": "most_active"
}
```

**How it works:**
1. Fetches real-time market movers from Financial Modeling Prep API
2. Falls back to Yahoo Finance trending stocks if FMP unavailable
3. Falls back to static list if all APIs fail
4. Caches ticker lists for 30 minutes to avoid rate limits
5. Filters stocks: minimum $5 price, 1M+ daily volume
6. Analyzes each ticker and sorts by potential gain

**Note:** Without an FMP API key, the system uses Yahoo Finance trending stocks or the static ticker list. For true real-time market movers (most active, gainers, losers), an FMP API key is recommended (free tier available).

---

### 5. Batch Analysis
```bash
POST /api/batch
Content-Type: application/json
```

Analyze multiple stocks in a single request (max 10 tickers).

**Request Body:**
```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL", "TSLA"]
}
```

**Example:**
```bash
curl -X POST http://localhost:8787/api/batch \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "MSFT", "GOOGL"]}'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ticker": "AAPL",
      "recommendation": "BUY",
      "confidence": 65.5,
      "price": 258.02,
      "potential_gain": 4.06
    },
    {
      "ticker": "MSFT",
      "recommendation": "STRONG BUY",
      "confidence": 82.3,
      "price": 517.35,
      "potential_gain": 6.25
    },
    {
      "ticker": "GOOGL",
      "recommendation": "HOLD",
      "confidence": 15.8,
      "price": 245.35,
      "potential_gain": 2.12
    }
  ]
}
```

---

## 📈 Recommendation Levels

The API provides **5 recommendation levels** based on a proprietary scoring algorithm:

| Recommendation | Score Range | Interpretation |
|---------------|-------------|----------------|
| **STRONG BUY** | ≥ 50 | Multiple strong bullish signals aligned |
| **BUY** | 25 to 49 | Bullish signals outweigh bearish |
| **HOLD** | -24 to 24 | Mixed signals, no clear direction |
| **SELL** | -49 to -25 | Bearish signals outweigh bullish |
| **STRONG SELL** | ≤ -50 | Multiple strong bearish signals |

### Scoring Breakdown

The score is calculated from multiple factors:

1. **Golden/Death Cross** (±20 points)
   - +20: SMA 50 > SMA 200 (bullish)
   - -20: SMA 50 < SMA 200 (bearish)

2. **RSI Levels** (±15 points)
   - +15: RSI < 30 (oversold, potential bounce)
   - -15: RSI > 70 (overbought, potential pullback)
   - +5: RSI 40-60 (neutral, healthy)

3. **MACD Crossover** (±15 points)
   - +15: MACD > Signal & Histogram > 0
   - -15: MACD < Signal & Histogram < 0

4. **Price vs EMA 20** (±10 points)
   - +10: Price > EMA 20 (short-term uptrend)
   - -10: Price < EMA 20 (short-term downtrend)

5. **Bollinger Bands** (±10 points)
   - +10: BB position < 0.2 (near lower band)
   - -10: BB position > 0.8 (near upper band)

6. **Volume** (±10 points)
   - +10: Volume ratio > 1.5x
   - -5: Volume ratio < 0.5x

7. **Trend Strength** (±10 points)
   - +10: Trend > 0.7 (strong uptrend)
   - -10: Trend < -0.7 (strong downtrend)

8. **Fundamentals** (±15 points)
   - +10: Forward P/E < 15 & P/E < 25
   - +5: PEG ratio < 1.0
   - -5: P/E > 40

---

## 🤖 LLM Analysis Guidelines

### For AI/LLM Systems Analyzing StockPulse Data

This section provides comprehensive guidance for **Large Language Models (LLMs)** to interpret and analyze the stock data returned by the StockPulse API.

---

### 📚 Understanding the Data Structure

When you receive a response from the API, you'll get a JSON object with the following structure:

```json
{
  "recommendation": "BUY|SELL|HOLD|STRONG BUY|STRONG SELL",
  "confidence": 0-100,
  "price": current_price,
  "target_price": predicted_target,
  "stop_loss": risk_management_level,
  "potential_gain": percentage_upside,
  "risk": percentage_downside,
  "risk_reward_ratio": gain/risk_ratio,
  "reasons": ["array of human-readable signals"],
  "metrics": { /* detailed technical indicators */ }
}
```

---

### 🔍 Step-by-Step Analysis Framework

#### **1. Trend Analysis (Primary)**

**What to look for:**
- **SMA 50 vs SMA 200**: Golden Cross (bullish) or Death Cross (bearish)
- **Price vs EMAs**: Is price above key moving averages?
- **Trend Strength**: Positive = uptrend, Negative = downtrend

**LLM Interpretation Pattern:**
```
IF sma_50 > sma_200 AND current_price > ema_20:
  → "The stock is in a confirmed uptrend with both short and long-term momentum positive"

IF sma_50 < sma_200 AND current_price < ema_20:
  → "The stock is in a confirmed downtrend with negative momentum across timeframes"

IF sma_50 > sma_200 BUT current_price < ema_20:
  → "Long-term uptrend but experiencing short-term weakness - potential pullback"
```

**Example Analysis:**
> "AAPL shows a Golden Cross (SMA 50 at 245.32 above SMA 200 at 228.87), indicating a long-term bullish trend. The current price of 258.02 is above the 20-day EMA (252.45), confirming short-term momentum. The trend strength of 0.85 suggests strong upward momentum."

---

#### **2. Momentum Indicators (Secondary)**

**RSI Interpretation:**
- **RSI < 30**: Oversold - potential bounce opportunity
- **RSI 30-40**: Slightly oversold - watch for reversal
- **RSI 40-60**: Neutral zone - healthy range
- **RSI 60-70**: Slightly overbought - approaching resistance
- **RSI > 70**: Overbought - potential pullback risk

**MACD Analysis:**
- **MACD > Signal & Histogram > 0**: Bullish momentum building
- **MACD < Signal & Histogram < 0**: Bearish momentum building
- **Histogram increasing**: Momentum accelerating
- **Histogram decreasing**: Momentum slowing

**LLM Pattern:**
```
IF rsi > 70 AND macd < macd_signal:
  → "Overbought conditions with weakening momentum - high risk of reversal"

IF rsi < 30 AND macd > macd_signal:
  → "Oversold with improving momentum - potential buying opportunity"

IF 40 <= rsi <= 60 AND macd > macd_signal:
  → "Healthy momentum in neutral territory - sustainable trend"
```

**Example Analysis:**
> "RSI at 71.0 indicates overbought conditions, suggesting the stock may face resistance. However, this alone doesn't guarantee a reversal - strong stocks can stay overbought during sustained rallies. Monitor for MACD bearish crossover for confirmation."

---

#### **3. Volatility & Risk Assessment**

**Bollinger Bands Position:**
- **bb_position < 0.2**: Near lower band - oversold
- **bb_position 0.2-0.4**: Below middle - weak
- **bb_position 0.4-0.6**: Middle zone - neutral
- **bb_position 0.6-0.8**: Above middle - strong
- **bb_position > 0.8**: Near upper band - overbought

**ATR (Average True Range):**
- Used to set stop-loss levels
- Higher ATR = More volatile = Wider stops needed
- Lower ATR = Less volatile = Tighter stops

**LLM Risk Assessment:**
```
IF bb_position > 0.8 AND rsi > 70:
  → "High risk: Price at upper volatility extreme with overbought momentum"

IF atr > (current_price * 0.03):  // ATR > 3% of price
  → "High volatility stock - use wider stop losses (1.5-2x ATR)"

IF risk_reward_ratio < 1:
  → "Poor risk/reward - potential gain doesn't justify the risk"
```

**Example Analysis:**
> "With an ATR of 4.85 and a current price of 258.02, the stock has ~1.88% daily volatility. The stop-loss is set at 253.17 (1.5x ATR below current price), providing adequate protection while allowing for normal price fluctuation."

---

#### **4. Volume Confirmation**

**Volume Ratio Interpretation:**
- **> 1.5x**: High volume - strong conviction in move
- **1.0-1.5x**: Normal volume - standard participation
- **0.5-1.0x**: Below average - weak conviction
- **< 0.5x**: Very low volume - lack of interest

**LLM Volume Analysis:**
```
IF recommendation == "BUY" AND volume_ratio > 1.5:
  → "Bullish signal confirmed with strong volume - higher probability of success"

IF recommendation == "BUY" AND volume_ratio < 0.5:
  → "Bullish signal but weak volume - wait for confirmation"

IF price increasing AND volume_ratio decreasing:
  → "Warning: Price rising on declining volume - potential exhaustion"
```

**Example Analysis:**
> "Volume ratio at 0.82x indicates below-average participation. While the price is rising, the lack of volume support suggests weak conviction. This move may not be sustainable without increased buying pressure."

---

#### **5. Fundamental Analysis (Context)**

**P/E Ratio Assessment:**
- **< 15**: Potentially undervalued
- **15-25**: Fair value range
- **25-40**: Premium valuation (growth stock)
- **> 40**: Expensive - requires strong growth to justify

**PEG Ratio (Most Important):**
- **< 1.0**: Undervalued relative to growth
- **1.0-2.0**: Fair value
- **> 2.0**: Overvalued relative to growth

**LLM Fundamental Pattern:**
```
IF peg_ratio < 1.0 AND pe_ratio < 25:
  → "Attractive valuation - stock is cheap relative to growth prospects"

IF peg_ratio > 2.0 AND rsi > 70:
  → "Expensive valuation with overbought technicals - high risk"

IF profit_margin > 20 AND debt_to_equity < 1.0:
  → "Strong fundamentals - profitable with low debt"
```

**Example Analysis:**
> "With a P/E of 28.5 and PEG ratio of 0.95, the stock appears reasonably valued despite a premium P/E. The PEG below 1.0 suggests earnings growth justifies the valuation. Profit margin of 25.5% indicates strong operational efficiency."

---

### 🎯 Complete LLM Analysis Template

When analyzing a stock, follow this structured approach:

```markdown
## Stock Analysis: [TICKER]

### 1. EXECUTIVE SUMMARY
- Recommendation: [STRONG BUY/BUY/HOLD/SELL/STRONG SELL]
- Confidence: [0-100]%
- Entry Price: $[price]
- Target Price: $[target_price] (+[potential_gain]%)
- Stop Loss: $[stop_loss] (-[risk]%)
- Risk/Reward: [risk_reward_ratio]:1

### 2. TREND ANALYSIS
[Analyze SMA 50 vs 200, Price vs EMA 20, Trend Strength]

**Assessment:** [Bullish/Bearish/Neutral]
**Reasoning:** [Explain the trend structure]

### 3. MOMENTUM & OSCILLATORS
[Analyze RSI, MACD, MACD Signal, Histogram]

**Current State:** [Overbought/Oversold/Neutral]
**Momentum Direction:** [Strengthening/Weakening]
**Reasoning:** [Explain momentum signals]

### 4. VOLATILITY & RISK
[Analyze Bollinger Bands Position, ATR]

**Volatility Level:** [High/Medium/Low]
**Risk Assessment:** [Explain risk factors]
**Stop Loss Justification:** [Why this level]

### 5. VOLUME ANALYSIS
[Analyze Volume Ratio]

**Volume Confirmation:** [Strong/Weak/Neutral]
**Conviction Level:** [High/Medium/Low]

### 6. FUNDAMENTAL CONTEXT
[Analyze P/E, PEG, Profit Margin, Debt/Equity if available]

**Valuation:** [Cheap/Fair/Expensive]
**Financial Health:** [Strong/Moderate/Weak]

### 7. KEY SIGNALS SUMMARY
[List the "reasons" array with interpretation]

✓ Bullish Signals: [count and list]
✗ Bearish Signals: [count and list]
⚠ Warning Signs: [list if any]

### 8. TRADE SETUP (If applicable)
- **Entry Strategy:** [When to enter]
- **Position Sizing:** [Based on risk]
- **Exit Strategy:** [Target and stop levels]
- **Risk Management:** [Maximum loss tolerance]

### 9. RISKS & CONSIDERATIONS
[List specific risks for this trade]

### 10. FINAL VERDICT
[Concise 2-3 sentence recommendation with timeframe]
```

---

### 📝 Example Complete Analysis

```markdown
## Stock Analysis: AAPL

### 1. EXECUTIVE SUMMARY
- Recommendation: HOLD
- Confidence: 25%
- Entry Price: $258.02
- Target Price: $262.87 (+1.88%)
- Stop Loss: $253.17 (-1.88%)
- Risk/Reward: 1:1

### 2. TREND ANALYSIS
The stock shows a Death Cross with SMA 50 (232.72) below SMA 200, indicating
long-term bearish structure. However, price is above EMA 20 (247.84), showing
short-term strength. Trend strength at 0.37 is mildly positive.

**Assessment:** Conflicting - Long-term bearish, short-term bullish
**Reasoning:** The stock is in a long-term downtrend but experiencing a
short-term bounce or counter-trend rally.

### 3. MOMENTUM & OSCILLATORS
RSI at 71.0 indicates overbought conditions. MACD data is incomplete (null values),
preventing full momentum assessment. The overbought RSI suggests exhaustion risk.

**Current State:** Overbought
**Momentum Direction:** Unknown (MACD data missing)
**Reasoning:** High RSI without MACD confirmation makes this risky for new entries.

### 4. VOLATILITY & RISK
Bollinger Band position at 0.795 shows price near the upper band, indicating
the stock has moved significantly above its average. ATR of 4.85 provides a
reasonable stop-loss range.

**Volatility Level:** Moderate
**Risk Assessment:** Price at volatility extreme increases pullback risk
**Stop Loss Justification:** 1.5x ATR provides cushion for normal fluctuations

### 5. VOLUME ANALYSIS
Volume ratio at 0.82x shows below-average participation, suggesting weak
conviction in the current move.

**Volume Confirmation:** Weak
**Conviction Level:** Low - Rising price without volume support is concerning

### 6. FUNDAMENTAL CONTEXT
No fundamental data available in this response.

**Valuation:** Cannot assess
**Financial Health:** Cannot assess

### 7. KEY SIGNALS SUMMARY
✗ Bearish Signals (2):
  - Death Cross: 50-day MA below 200-day MA
  - RSI overbought at 71.0 (potential pullback)

✓ Bullish Signals (1):
  - Price above 20-day EMA (short-term uptrend)

⚠ Warning Signs:
  - Weak volume support (0.82x average)
  - Price at upper Bollinger Band (volatility extreme)

### 8. TRADE SETUP
**Not Recommended** - The stock presents a poor risk/reward setup with:
- 1:1 risk/reward ratio (needs minimum 2:1)
- Overbought conditions at volatility extremes
- Weak volume confirmation
- Conflicting trend signals

### 9. RISKS & CONSIDERATIONS
1. **Reversal Risk:** Overbought RSI at upper Bollinger Band = high reversal probability
2. **Trend Conflict:** Death Cross vs short-term bounce creates directional uncertainty
3. **Volume Weakness:** Low volume raises questions about move sustainability
4. **Limited Upside:** Only 1.88% potential gain vs 1.88% risk

### 10. FINAL VERDICT
**HOLD/WAIT** - This is NOT an attractive entry point. The stock shows short-term
strength but is overbought with weak volume support in a long-term downtrend.
Wait for either: (a) a pullback to support levels with improving volume, or
(b) a break above resistance with strong volume confirmation. Current risk/reward
does not justify new positions.
```

---

### 🚨 Critical Rules for LLM Analysis

1. **Never provide financial advice** - Always frame as educational analysis
2. **Acknowledge limitations** - Note when data is missing or incomplete
3. **Consider multiple timeframes** - Short-term can conflict with long-term
4. **Volume is crucial** - Price moves without volume are suspect
5. **Risk/Reward minimum** - Don't recommend trades with < 2:1 R/R unless very high confidence
6. **Overbought ≠ Sell** - Strong stocks can stay overbought (same for oversold)
7. **Fundamentals matter** - Technical signals are stronger when fundamentals align
8. **Context is key** - Market conditions, sector trends, and news affect validity

---

### 💡 Advanced LLM Analysis Patterns

#### **Pattern 1: Momentum Divergence**
```
IF price making new highs AND rsi not making new highs:
  → "Bearish divergence - momentum weakening despite price strength"

IF price making new lows AND rsi not making new lows:
  → "Bullish divergence - selling pressure weakening despite price weakness"
```

#### **Pattern 2: Trend Confirmation**
```
IF sma_50 > sma_200 AND current_price > ema_20 AND macd > macd_signal AND volume_ratio > 1.2:
  → "All systems aligned - high-probability bullish setup"
```

#### **Pattern 3: Reversal Setup**
```
IF (rsi < 30 OR bb_position < 0.2) AND volume_ratio > 1.5 AND macd_histogram increasing:
  → "Potential reversal - oversold with volume and momentum improving"
```

#### **Pattern 4: Breakdown Warning**
```
IF sma_50 approaching sma_200 from above AND rsi < 50 AND volume_ratio > 1.3:
  → "Death Cross forming with volume - high breakdown risk"
```

---

### 🎓 Learning from API Responses

**High-Quality Signals (Trust More):**
- Multiple indicators aligned in same direction
- Strong volume confirmation (> 1.5x)
- Risk/reward > 2:1
- Confidence > 70%
- Clear trend structure

**Low-Quality Signals (Use Caution):**
- Conflicting indicators
- Weak volume (< 0.8x)
- Risk/reward < 1.5:1
- Confidence < 30%
- Choppy, unclear trend

**Red Flags (Avoid):**
- Extreme overbought (RSI > 80) at resistance
- Extreme oversold (RSI < 20) in strong downtrend
- Price at upper BB with declining volume
- Death Cross forming with increasing volume
- Very high P/E (> 50) with slowing growth

---

### 📊 Sample LLM Prompts for Analysis

**Prompt 1: Quick Assessment**
```
Analyze this stock data from StockPulse API: [paste JSON]

Provide a 3-sentence summary:
1. Current trend and momentum state
2. Key risk factors
3. Recommended action with rationale
```

**Prompt 2: Detailed Analysis**
```
Using the StockPulse analysis framework, provide a comprehensive
assessment of [TICKER]: [paste JSON]

Include:
- Trend analysis across timeframes
- Momentum and oscillator interpretation
- Volume confirmation analysis
- Risk/reward assessment
- Trade setup or reasons to avoid
```

**Prompt 3: Comparative Analysis**
```
Compare these stocks from the batch API: [paste JSON]

Rank them by:
1. Trend strength
2. Risk/reward ratio
3. Volume confirmation
4. Overall attractiveness

Recommend top 2 for further research.
```

**Prompt 4: Risk-Focused Analysis**
```
Analyze the risk profile of this stock: [paste JSON]

Focus on:
- What could go wrong?
- How much could I lose?
- What's the probability of hitting stop-loss?
- Alternative scenarios
```

---

### 🔄 Continuous Learning

As an LLM analyzing stock data:

1. **Track patterns** - Note which signal combinations led to accurate predictions
2. **Learn from errors** - When analysis was wrong, identify what was missed
3. **Adapt to markets** - Bull markets favor different patterns than bear markets
4. **Combine signals** - Single indicators lie, combinations reveal truth
5. **Respect uncertainty** - Markets are probabilistic, not deterministic

---

## ⚡ Performance & Caching

- **Global CDN**: Deployed on 300+ Cloudflare edge locations
- **Response Time**: < 50ms with cache hit, < 500ms without
- **Rate Limits**: None (Cloudflare auto-scales)
- **Cache TTL**: 5 minutes (configurable in `utils.ts`)
- **Data Freshness**: Real-time from Yahoo Finance API

---

## 🛠️ Technology Stack

- **Runtime**: Cloudflare Workers (Edge computing)
- **Framework**: Hono (Ultrafast web framework)
- **Data Source**: Yahoo Finance API (custom client)
- **Language**: TypeScript
- **Caching**: Cloudflare KV
- **Deployment**: Wrangler CLI

---

## 🔧 Configuration

### Environment Variables

Edit `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"  # or "development"
```

### Analysis Parameters

Edit `src/index.ts`:

```typescript
// Change MA windows (default: 50, 200)
const analyzer = new StockAnalyzer(50, 200);
```

### Cache TTL

Edit `src/utils.ts`:

```typescript
// Change cache duration (default: 300 seconds)
constructor(cache?: KVNamespace, ttl: number = 300)
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" errors from Yahoo Finance
**Solution**: The API uses custom headers. If blocked, try different User-Agent strings in `src/yahooFinance.ts`

### Issue: Missing fundamental data
**Solution**: Not all stocks have complete fundamental data. The API gracefully handles missing fields.

### Issue: MACD showing null values
**Solution**: Stock may not have enough historical data (needs 26+ days). Check `historical.length`

### Issue: Slow responses
**Solution**:
1. Enable KV caching
2. Reduce the MA windows (50/200 → 20/50)
3. Check Cloudflare Workers dashboard for limits

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## ⚠️ Disclaimer

**IMPORTANT**: This API is for **educational and informational purposes only**.

- ❌ **NOT financial advice** - Do not make investment decisions based solely on this data
- ❌ **NOT a guarantee** - Past performance doesn't predict future results
- ❌ **NOT professional guidance** - Consult a licensed financial advisor
- ✅ **Use for learning** - Understand technical analysis concepts
- ✅ **Use for research** - Combine with other analysis tools
- ✅ **Use responsibly** - Always do your own due diligence

**Trading involves substantial risk of loss. Only invest what you can afford to lose.**

---

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/stockpulse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/stockpulse/discussions)
- **Documentation**: [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

---

## 🗺️ Roadmap

- [x] Dynamic ticker selection with market movers
- [x] Multi-API support with fallback mechanisms
- [ ] WebSocket support for real-time streaming
- [ ] Multiple timeframe analysis (1h, 4h, 1d, 1w)
- [ ] Machine learning price predictions
- [ ] Sector and market correlation analysis
- [ ] Options Greeks calculator
- [ ] Portfolio backtesting
- [ ] Discord/Telegram bot integration

---

**Built with ❤️ using Cloudflare Workers & TypeScript**

*Last Updated: October 2025*
