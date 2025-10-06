import { YahooFinance } from './yahooFinance';
import { StockSignal, StockMetrics } from './types';
import { TechnicalIndicators } from './utils';

export class StockAnalyzer {
  private shortWindow: number;
  private longWindow: number;

  constructor(shortWindow: number = 50, longWindow: number = 200) {
    this.shortWindow = shortWindow;
    this.longWindow = longWindow;
  }

  async analyze(ticker: string): Promise<StockSignal> {
    try {
      // Fetch historical data
      const queryOptions = {
        period1: new Date(Date.now() - (this.longWindow + 50) * 24 * 60 * 60 * 1000),
        period2: new Date(),
      };

      const historical = await YahooFinance.historical(ticker, queryOptions);

      if (historical.length < this.shortWindow) {
        throw new Error(`Insufficient data for ${ticker}`);
      }

      // Fetch quote for real-time data
      const quote = await YahooFinance.quote(ticker);

      // Extract price arrays
      const closes = historical.map(d => d.close);
      const highs = historical.map(d => d.high);
      const lows = historical.map(d => d.low);
      const volumes = historical.map(d => d.volume);

      // Calculate metrics
      const metrics = this.calculateMetrics(closes, highs, lows, volumes, quote);

      // Calculate score
      const { score, reasons } = this.calculateScore(metrics);

      // Get recommendation
      const recommendation = this.getRecommendation(score);

      // Calculate targets
      const currentPrice = closes[closes.length - 1];
      const { target, stopLoss } = this.calculateTargets(currentPrice, metrics, recommendation);

      return {
        ticker: ticker.toUpperCase(),
        recommendation,
        confidence: Math.min(Math.abs(score), 100),
        price: parseFloat(currentPrice.toFixed(2)),
        target_price: parseFloat(target.toFixed(2)),
        stop_loss: parseFloat(stopLoss.toFixed(2)),
        potential_gain: parseFloat((((target - currentPrice) / currentPrice) * 100).toFixed(2)),
        risk: parseFloat((((currentPrice - stopLoss) / currentPrice) * 100).toFixed(2)),
        risk_reward_ratio: parseFloat(((target - currentPrice) / (currentPrice - stopLoss)).toFixed(2)),
        reasons,
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Analysis failed for ${ticker}: ${error.message}`);
    }
  }

  private calculateMetrics(
    closes: number[],
    highs: number[],
    lows: number[],
    volumes: number[],
    quote: any
  ): StockMetrics {
    // Moving averages
    const sma50 = TechnicalIndicators.sma(closes, this.shortWindow);
    const sma200 = TechnicalIndicators.sma(closes, this.longWindow);
    const ema20 = TechnicalIndicators.ema(closes, 20);

    // RSI
    const rsi = TechnicalIndicators.rsi(closes, 14);

    // MACD
    const { macd, signal, histogram } = TechnicalIndicators.macd(closes);

    // Bollinger Bands
    const bb = TechnicalIndicators.bollingerBands(closes);
    const currentPrice = closes[closes.length - 1];
    const bbPosition = (currentPrice - bb.lower) / (bb.upper - bb.lower);

    // Volume
    const volumeSma = TechnicalIndicators.sma(volumes, 20);
    const volumeRatio = volumes[volumes.length - 1] / volumeSma[volumeSma.length - 1];

    // ATR
    const atr = TechnicalIndicators.atr(highs, lows, closes, 14);

    // Trend strength
    const trendStrength = TechnicalIndicators.trendStrength(closes.slice(-this.shortWindow));

    // Price change
    const priceChange50d = ((currentPrice - closes[closes.length - this.shortWindow]) /
                            closes[closes.length - this.shortWindow]) * 100;

    return {
      current_price: currentPrice,
      sma_50: sma50[sma50.length - 1],
      sma_200: sma200[sma200.length - 1],
      ema_20: ema20[ema20.length - 1],
      rsi,
      macd,
      macd_signal: signal,
      macd_histogram: histogram,
      bb_position: bbPosition,
      volume_ratio: volumeRatio,
      atr,
      trend_strength: trendStrength,
      pe_ratio: quote.trailingPE,
      forward_pe: quote.forwardPE,
      peg_ratio: quote.trailingPegRatio,
      profit_margin: quote.profitMargins ? quote.profitMargins * 100 : undefined,
      debt_to_equity: quote.debtToEquity,
      price_change_50d: priceChange50d
    };
  }

  private calculateScore(metrics: StockMetrics): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Golden Cross / Death Cross
    if (metrics.sma_50 > metrics.sma_200) {
      score += 20;
      reasons.push('✓ Golden Cross: 50-day MA above 200-day MA (bullish)');
    } else {
      score -= 20;
      reasons.push('✗ Death Cross: 50-day MA below 200-day MA (bearish)');
    }

    // 2. RSI
    if (metrics.rsi < 30) {
      score += 15;
      reasons.push(`✓ RSI oversold at ${metrics.rsi.toFixed(1)} (potential bounce)`);
    } else if (metrics.rsi > 70) {
      score -= 15;
      reasons.push(`✗ RSI overbought at ${metrics.rsi.toFixed(1)} (potential pullback)`);
    } else if (metrics.rsi >= 40 && metrics.rsi <= 60) {
      score += 5;
      reasons.push(`✓ RSI neutral at ${metrics.rsi.toFixed(1)} (healthy)`);
    }

    // 3. MACD
    if (metrics.macd > metrics.macd_signal && metrics.macd_histogram > 0) {
      score += 15;
      reasons.push('✓ MACD bullish crossover');
    } else if (metrics.macd < metrics.macd_signal && metrics.macd_histogram < 0) {
      score -= 15;
      reasons.push('✗ MACD bearish crossover');
    }

    // 4. Price vs EMA
    if (metrics.current_price > metrics.ema_20) {
      score += 10;
      reasons.push('✓ Price above 20-day EMA (short-term uptrend)');
    } else {
      score -= 10;
      reasons.push('✗ Price below 20-day EMA (short-term downtrend)');
    }

    // 5. Bollinger Bands
    if (metrics.bb_position < 0.2) {
      score += 10;
      reasons.push('✓ Near lower Bollinger Band (oversold)');
    } else if (metrics.bb_position > 0.8) {
      score -= 10;
      reasons.push('✗ Near upper Bollinger Band (overbought)');
    }

    // 6. Volume
    if (metrics.volume_ratio > 1.5) {
      score += 10;
      reasons.push(`✓ High volume (${metrics.volume_ratio.toFixed(1)}x average)`);
    } else if (metrics.volume_ratio < 0.5) {
      score -= 5;
      reasons.push(`⚠ Low volume (${metrics.volume_ratio.toFixed(1)}x average)`);
    }

    // 7. Trend Strength
    if (metrics.trend_strength > 0.7) {
      score += 10;
      reasons.push(`✓ Strong uptrend (strength: ${metrics.trend_strength.toFixed(2)})`);
    } else if (metrics.trend_strength < -0.7) {
      score -= 10;
      reasons.push(`✗ Strong downtrend (strength: ${metrics.trend_strength.toFixed(2)})`);
    }

    // 8. Fundamentals
    if (metrics.pe_ratio && metrics.forward_pe) {
      if (metrics.forward_pe < 15 && metrics.pe_ratio < 25) {
        score += 10;
        reasons.push(`✓ Attractive valuation (P/E: ${metrics.pe_ratio.toFixed(1)})`);
      } else if (metrics.pe_ratio > 40) {
        score -= 5;
        reasons.push(`⚠ High valuation (P/E: ${metrics.pe_ratio.toFixed(1)})`);
      }
    }

    if (metrics.peg_ratio && metrics.peg_ratio < 1) {
      score += 5;
      reasons.push(`✓ Excellent PEG ratio: ${metrics.peg_ratio.toFixed(2)}`);
    }

    return { score, reasons };
  }

  private getRecommendation(score: number): 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL' {
    if (score >= 50) return 'STRONG BUY';
    if (score >= 25) return 'BUY';
    if (score >= -25) return 'HOLD';
    if (score >= -50) return 'SELL';
    return 'STRONG SELL';
  }

  private calculateTargets(
    currentPrice: number,
    metrics: StockMetrics,
    recommendation: string
  ): { target: number; stopLoss: number } {
    const atr = metrics.atr;

    if (recommendation === 'STRONG BUY' || recommendation === 'BUY') {
      return {
        target: currentPrice + (2 * atr),
        stopLoss: currentPrice - (1.5 * atr)
      };
    } else if (recommendation === 'STRONG SELL' || recommendation === 'SELL') {
      return {
        target: currentPrice - (2 * atr),
        stopLoss: currentPrice + (1.5 * atr)
      };
    } else {
      return {
        target: currentPrice + (1 * atr),
        stopLoss: currentPrice - (1 * atr)
      };
    }
  }
}
