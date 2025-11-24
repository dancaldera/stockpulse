import type { StockSignal, StockMetrics, AnalysisConfig, ChartData } from './types'
import { sma, ema, rsi, macd, bollingerBands, atr, trendStrength, executeWithRetry } from './utils'
import type { HistoricalData, QuoteData } from './yahooFinance'
import { YahooFinanceAdapter, type YahooDataSource } from './data-sources/yahoo-adapter'

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  shortMovingAverage: 50,
  longMovingAverage: 200,
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
  cacheTtl: 300,
  maxRetryAttempts: 3,
  retryDelay: 1000,
  maxRetryDelay: 5000,
}

/**
 * Stock analysis engine with configurable parameters for technical indicators
 * Provides comprehensive stock analysis using multiple technical indicators
 */
export class StockAnalyzer {
  private config: AnalysisConfig
  private dataSource: YahooDataSource

  /**
   * Creates a new stock analyzer with optional configuration
   * @param config Optional configuration for analysis parameters
   */
  constructor(config?: Partial<AnalysisConfig>, dataSource: YahooDataSource = new YahooFinanceAdapter()) {
    this.config = { ...DEFAULT_ANALYSIS_CONFIG, ...config }
    this.dataSource = dataSource
  }

  /**
   * Returns a copy of the current analysis configuration
   * @returns Current analysis configuration
   */
  getConfig(): AnalysisConfig {
    return { ...this.config }
  }

  /**
   * Updates the analysis configuration with new parameters
   * @param newConfig Partial configuration to merge with existing config
   */
  updateConfig(newConfig: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Analyzes a stock ticker and returns comprehensive technical analysis
   * @param ticker Stock ticker symbol to analyze
   * @returns Promise resolving to analysis results with recommendation, confidence, and technical indicators
   * @throws Error if ticker is invalid or data fetching fails
   */
  async analyze(ticker: string): Promise<StockSignal> {
    try {
      // Fetch historical data with retry logic
      // Request more calendar days to ensure we get enough trading days
      // Yahoo Finance only returns trading days (Mon-Fri excluding holidays)
      // To get ~250 trading days, we need ~365 calendar days
      const daysToRequest = Math.ceil((this.config.longMovingAverage + 50) * 1.5) // ~375 days
      const queryOptions = {
        period1: new Date(Date.now() - daysToRequest * 24 * 60 * 60 * 1000),
        period2: new Date(),
      }

      let historical: HistoricalData[]
      try {
        historical = await executeWithRetry(
          () => this.dataSource.getHistorical(ticker, queryOptions),
          this.config.maxRetryAttempts,
          this.config.retryDelay,
          this.config.maxRetryDelay,
        )
      } catch (error) {
        throw new Error(
          `Failed to fetch historical data after retries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }

      if (historical.length < this.config.shortMovingAverage) {
        throw new Error(
          `Insufficient data for ${ticker}: need at least ${this.config.shortMovingAverage} data points, got ${historical.length}`,
        )
      }

      // Fetch quote for real-time data with retry logic
      let quote: QuoteData
      try {
        quote = await executeWithRetry(
          () => this.dataSource.getQuote(ticker),
          this.config.maxRetryAttempts,
          this.config.retryDelay,
          this.config.maxRetryDelay,
        )
      } catch (error) {
        throw new Error(
          `Failed to fetch quote data after retries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }

      // Extract price arrays
      const closes = historical.map((d) => d.close)
      const highs = historical.map((d) => d.high)
      const lows = historical.map((d) => d.low)
      const volumes = historical.map((d) => d.volume)
      const dates = historical.map((d) => new Date(d.date).toISOString())

      // Calculate metrics
      const metrics = this.calculateMetrics(closes, highs, lows, volumes, quote)

      // Generate chart data
      const chartData = this.generateChartData(closes, highs, lows, volumes, dates)

      // Calculate score
      const { score, reasons, bullishCount, bearishCount } = this.calculateScore(metrics)

      // Get recommendation
      const recommendation = this.getRecommendation(score)

      // Calculate weighted confidence score with fallback
      let confidence: number
      try {
        confidence = this.calculateConfidenceScore(metrics, bullishCount, bearishCount, score)
        console.log(`[DEBUG] Confidence calculated: ${confidence}, bullish: ${bullishCount}, bearish: ${bearishCount}`)
      } catch (error) {
        console.error(`[ERROR] Confidence calculation failed:`, error)
        // Fallback to absolute score if confidence calculation fails
        confidence = Math.min(Math.abs(score), 100)
      }

      // Calculate targets
      const currentPrice = closes[closes.length - 1]
      const { target, stopLoss } = this.calculateTargets(currentPrice, metrics, recommendation)

      return {
        ticker: ticker.toUpperCase(),
        recommendation,
        confidence: Number.isNaN(confidence) ? 50 : parseFloat(confidence.toFixed(1)),
        price: parseFloat(currentPrice.toFixed(2)),
        target_price: parseFloat(target.toFixed(2)),
        stop_loss: parseFloat(stopLoss.toFixed(2)),
        potential_gain: parseFloat((((target - currentPrice) / currentPrice) * 100).toFixed(2)),
        risk: parseFloat((((currentPrice - stopLoss) / currentPrice) * 100).toFixed(2)),
        risk_reward_ratio: parseFloat(((target - currentPrice) / (currentPrice - stopLoss)).toFixed(2)),
        reasons,
        metrics,
        chartData,
        timestamp: new Date().toISOString(),
        signal_summary: {
          bullish: bullishCount,
          bearish: bearishCount,
          total: 7,
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(`Analysis failed for ${ticker}: ${message}`)
    }
  }

  private calculateMetrics(
    closes: number[],
    highs: number[],
    lows: number[],
    volumes: number[],
    quote: QuoteData,
  ): StockMetrics {
    // Moving averages
    const sma50 = sma(closes, this.config.shortMovingAverage)
    const sma200 = sma(closes, this.config.longMovingAverage)
    const ema20 = ema(closes, 20)

    // RSI
    const rsiValue = rsi(closes, this.config.rsiPeriod)

    // MACD
    const {
      macd: macdValue,
      signal,
      histogram,
    } = macd(closes, this.config.macdFast, this.config.macdSlow, this.config.macdSignal)

    // Bollinger Bands
    const bb = bollingerBands(closes, this.config.bollingerPeriod, this.config.bollingerStdDev)
    const currentPrice = closes[closes.length - 1]
    const bbPosition = (currentPrice - bb.lower) / (bb.upper - bb.lower)

    // Volume
    const volumeSma = sma(volumes, this.config.volumePeriod)
    const volumeRatio = volumes[volumes.length - 1] / volumeSma[volumeSma.length - 1]

    // ATR
    const atrValue = atr(highs, lows, closes, this.config.atrPeriod)

    // Trend strength
    const trendStrengthValue = trendStrength(closes.slice(-this.config.shortMovingAverage))

    // Price change
    const priceChange50d =
      ((currentPrice - closes[closes.length - this.config.shortMovingAverage]) /
        closes[closes.length - this.config.shortMovingAverage]) *
      100

    return {
      current_price: currentPrice,
      sma_50: sma50[sma50.length - 1],
      sma_200: sma200[sma200.length - 1],
      ema_20: ema20[ema20.length - 1],
      rsi: rsiValue,
      macd: macdValue,
      macd_signal: signal,
      macd_histogram: histogram,
      bb_position: bbPosition,
      volume_ratio: volumeRatio,
      atr: atrValue,
      trend_strength: trendStrengthValue,
      pe_ratio: quote.trailingPE,
      forward_pe: quote.forwardPE,
      peg_ratio: quote.trailingPegRatio,
      profit_margin: quote.profitMargins ? quote.profitMargins * 100 : undefined,
      debt_to_equity: quote.debtToEquity,
      price_change_50d: priceChange50d,
    }
  }

  private calculateScore(metrics: StockMetrics): {
    score: number
    reasons: string[]
    bullishCount: number
    bearishCount: number
  } {
    let score = 0
    const reasons: string[] = []
    const warnings: string[] = []

    // Track bullish/bearish indicators for confirmation
    let bullishCount = 0
    let bearishCount = 0

    // 1. Golden Cross / Death Cross (REDUCED weight from 20 to 15)
    if (metrics.sma_50 > metrics.sma_200) {
      score += 15
      bullishCount++
      reasons.push('✓ Golden Cross: 50-day MA above 200-day MA (bullish)')
    } else {
      score -= 15
      bearishCount++
      reasons.push('✗ Death Cross: 50-day MA below 200-day MA (bearish)')
    }

    // 2. RSI - Balanced scoring with trend consideration
    const isStrongUptrend = metrics.trend_strength > 0.7
    const isStrongDowntrend = metrics.trend_strength < -0.7

    if (metrics.rsi < this.config.rsiOversold) {
      // Oversold in downtrend is less bullish (could keep falling)
      const rsiScore = isStrongDowntrend ? 8 : 12
      score += rsiScore
      bullishCount++
      reasons.push(`✓ RSI oversold at ${metrics.rsi.toFixed(1)} (potential bounce)`)
      if (metrics.rsi < 25) {
        score += 3
        warnings.push(`⚠ EXTREME oversold (RSI: ${metrics.rsi.toFixed(1)}) - high risk/reward`)
      }
    } else if (metrics.rsi > this.config.rsiOverbought) {
      // Overbought in strong uptrend is less bearish (momentum)
      const rsiPenalty = isStrongUptrend ? 6 : 12
      score -= rsiPenalty
      if (!isStrongUptrend) bearishCount++
      reasons.push(`✗ RSI overbought at ${metrics.rsi.toFixed(1)} (potential pullback)`)
      if (metrics.rsi > 75) {
        const extremePenalty = isStrongUptrend ? 0 : 3
        score -= extremePenalty
        warnings.push(`⚠ ${isStrongUptrend ? 'Overbought but in strong uptrend' : 'EXTREME overbought'} (RSI: ${metrics.rsi.toFixed(1)})`)
      }
    } else if (metrics.rsi >= 45 && metrics.rsi <= 65) {
      score += 3
      reasons.push(`✓ RSI healthy at ${metrics.rsi.toFixed(1)} (neutral to bullish)`)
    } else if (metrics.rsi >= 35 && metrics.rsi < 45) {
      reasons.push(`○ RSI slightly weak at ${metrics.rsi.toFixed(1)}`)
    } else if (metrics.rsi > 65 && metrics.rsi <= 70) {
      reasons.push(`○ RSI slightly strong at ${metrics.rsi.toFixed(1)}`)
    }

    // 3. MACD (INCREASED weight from 15 to 20 when BOTH line and histogram confirm)
    const hasMacdData = metrics.macd_signal !== null && metrics.macd_histogram !== null

    if (hasMacdData) {
      if (metrics.macd > metrics.macd_signal && metrics.macd_histogram > 0) {
        score += 20
        bullishCount++
        reasons.push('✓ MACD bullish crossover (strong momentum)')
      } else if (metrics.macd < metrics.macd_signal && metrics.macd_histogram < 0) {
        score -= 20
        bearishCount++
        reasons.push('✗ MACD bearish crossover (weak momentum)')
      } else if (metrics.macd > metrics.macd_signal) {
        // Line above signal but histogram not positive yet
        score += 8
        reasons.push('✓ MACD line above signal (building momentum)')
      } else if (metrics.macd < metrics.macd_signal) {
        score -= 8
        reasons.push('✗ MACD line below signal (losing momentum)')
      }
    } else {
      // No MACD data available - use a simpler momentum indicator
      if (metrics.price_change_50d > 10) {
        score += 8
        reasons.push(`✓ Strong 50-day price momentum (+${metrics.price_change_50d.toFixed(1)}%)`)
      } else if (metrics.price_change_50d < -10) {
        score -= 8
        reasons.push(`✗ Weak 50-day price momentum (${metrics.price_change_50d.toFixed(1)}%)`)
      }
    }

    // 4. Price vs EMA (INCREASED from 10 to 12)
    if (metrics.current_price > metrics.ema_20) {
      score += 12
      bullishCount++
      reasons.push('✓ Price above 20-day EMA (short-term uptrend)')
    } else {
      score -= 12
      bearishCount++
      reasons.push('✗ Price below 20-day EMA (short-term downtrend)')
    }

    // 5. Bollinger Bands - More sophisticated analysis
    if (metrics.bb_position < 0.2) {
      score += 10
      bullishCount++
      reasons.push('✓ Near lower Bollinger Band (oversold)')
      // Extra boost if VERY close to lower band
      if (metrics.bb_position < 0.05) {
        score += 5
        warnings.push('⚠ Touching lower Bollinger Band (extreme oversold)')
      }
    } else if (metrics.bb_position > 0.8) {
      score -= 10
      bearishCount++
      reasons.push('✗ Near upper Bollinger Band (overbought)')
      // Extra penalty if VERY close to upper band
      if (metrics.bb_position > 0.95) {
        score -= 5
        warnings.push('⚠ Touching upper Bollinger Band (extreme overbought)')
      }
    }

    // 6. Volume (Supporting indicator - not blocking)
    if (metrics.volume_ratio > 1.5) {
      score += 10
      reasons.push(`✓ High volume (${metrics.volume_ratio.toFixed(1)}x average) - strong interest`)
      // Very high volume is even more significant
      if (metrics.volume_ratio > 2.5) {
        score += 5
        warnings.push(`⚠ VERY high volume (${metrics.volume_ratio.toFixed(1)}x) - major move`)
      }
    } else if (metrics.volume_ratio < 0.5) {
      score -= 5 // Reduced penalty - volume is supporting, not core
      reasons.push(`✗ Low volume (${metrics.volume_ratio.toFixed(1)}x average) - weak conviction`)
      // Extremely low volume warning only, no additional penalty
      if (metrics.volume_ratio < 0.3) {
        warnings.push(`⚠ EXTREMELY low volume (${metrics.volume_ratio.toFixed(1)}x) - no interest`)
      }
    }

    // 7. Trend Strength (INCREASED from 10 to 15)
    const strongTrendThreshold = 0.7
    if (metrics.trend_strength > strongTrendThreshold) {
      score += 15
      bullishCount++
      reasons.push(`✓ Strong uptrend (strength: ${metrics.trend_strength.toFixed(2)})`)
    } else if (metrics.trend_strength < -strongTrendThreshold) {
      score -= 15
      bearishCount++
      reasons.push(`✗ Strong downtrend (strength: ${metrics.trend_strength.toFixed(2)})`)
    } else if (Math.abs(metrics.trend_strength) < 0.3) {
      // Ranging market - neutral, no penalty (ranging markets are normal)
      warnings.push('⚠ Weak/ranging market - choppy conditions')
    }

    // 8. Extended Move Detection - Reduced penalty
    const distanceFromSma200 = ((metrics.current_price - metrics.sma_200) / metrics.sma_200) * 100
    if (distanceFromSma200 > 30) {
      score -= 5 // Reduced from -10, and only triggers at 30% (was 25%)
      warnings.push(`⚠ Extended above SMA200 (+${distanceFromSma200.toFixed(1)}%) - overheated`)
    } else if (distanceFromSma200 < -30) {
      score += 5 // More conservative bullish bonus
      warnings.push(`⚠ Extended below SMA200 (${distanceFromSma200.toFixed(1)}%) - oversold`)
    }

    // 9. Fundamentals (with null safety)
    if (metrics.pe_ratio != null && metrics.pe_ratio > 0 && metrics.forward_pe != null && metrics.forward_pe > 0) {
      if (metrics.forward_pe < 15 && metrics.pe_ratio < 25) {
        score += 10
        reasons.push(`✓ Attractive valuation (P/E: ${metrics.pe_ratio.toFixed(1)}, Fwd P/E: ${metrics.forward_pe.toFixed(1)})`)
      } else if (metrics.pe_ratio > 40) {
        score -= 5
        reasons.push(`⚠ High valuation (P/E: ${metrics.pe_ratio.toFixed(1)})`)
      }
    }

    if (metrics.peg_ratio != null && metrics.peg_ratio > 0 && metrics.peg_ratio < 1) {
      score += 5
      reasons.push(`✓ Excellent PEG ratio: ${metrics.peg_ratio.toFixed(2)}`)
    }

    // 10. VETO CONDITIONS - Reduced impact
    let vetoReason: string | null = null

    // Cannot BUY if both RSI > 75 AND Bollinger > 0.9 (extreme overbought)
    if (metrics.rsi > 75 && metrics.bb_position > 0.9) {
      if (score > 0) {
        const reduction = Math.min(score, 15) // Reduced from 25
        score -= reduction
        vetoReason = `🛑 VETO: Extreme overbought (RSI: ${metrics.rsi.toFixed(1)}, BB: ${(metrics.bb_position * 100).toFixed(0)}%) - reduced score by ${reduction}`
      }
    }

    // Cannot SELL if both RSI < 25 AND Bollinger < 0.1 (extreme oversold)
    if (metrics.rsi < 25 && metrics.bb_position < 0.1) {
      if (score < 0) {
        const reduction = Math.min(Math.abs(score), 15) // Reduced from 25
        score += reduction
        vetoReason = `🛑 VETO: Extreme oversold (RSI: ${metrics.rsi.toFixed(1)}, BB: ${(metrics.bb_position * 100).toFixed(0)}%) - reduced bearish score by ${reduction}`
      }
    }

    // 11. MULTI-INDICATOR CONFIRMATION - Reduced penalty
    // For BUY: need at least 4 of 7 key indicators bullish
    // For SELL: need at least 4 of 7 key indicators bearish
    if (score > 30 && bullishCount < 4) {
      score -= 5
      warnings.push(`⚠ Bullish score lacks confirmation (${bullishCount}/7 bullish indicators)`)
    }
    if (score < -30 && bearishCount < 4) {
      score += 5
      warnings.push(`⚠ Bearish score lacks confirmation (${bearishCount}/7 bearish indicators)`)
    }

    // Combine all reasons and warnings
    const allReasons = [...reasons, ...warnings]
    if (vetoReason) {
      allReasons.unshift(vetoReason) // Add veto at the beginning
    }

    return { score, reasons: allReasons, bullishCount, bearishCount }
  }

  private getRecommendation(score: number): 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL' {
    // Adjusted thresholds to match realistic score distribution
    // Typical bullish stocks score 20-35, bearish score -20 to -35
    if (score >= 35) return 'STRONG BUY'
    if (score >= 20) return 'BUY'
    if (score >= -20) return 'HOLD'
    if (score >= -35) return 'SELL'
    return 'STRONG SELL'
  }

  /**
   * Calculate weighted confidence score based on indicator strength
   * Returns a percentage (0-100) representing how confident we are in the signal
   */
  private calculateConfidenceScore(_metrics: StockMetrics, bullishCount: number, bearishCount: number, score: number): number {
    const total = bullishCount + bearishCount
    if (total === 0) return 50

    // Calculate agreement ratio - how many indicators align with the direction
    const dominant = Math.max(bullishCount, bearishCount)
    const agreementRatio = dominant / total

    // Base confidence from agreement (50-80 range)
    let confidence = 50 + agreementRatio * 30

    // Boost confidence if score is decisive (strong signal)
    const absScore = Math.abs(score)
    if (absScore >= 35) {
      confidence += 15 // Strong Buy/Sell
    } else if (absScore >= 20) {
      confidence += 8 // Buy/Sell
    }

    // Penalize conflicting signals
    const conflictPenalty = Math.min(bullishCount, bearishCount) * 3
    confidence -= conflictPenalty

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, Math.round(confidence)))
  }

  private calculateTargets(
    currentPrice: number,
    metrics: StockMetrics,
    recommendation: string,
  ): { target: number; stopLoss: number } {
    // Use ATR or fallback to 2% of price if ATR is invalid
    const atr = metrics.atr && metrics.atr > 0 ? metrics.atr : currentPrice * 0.02

    if (recommendation === 'STRONG BUY' || recommendation === 'BUY') {
      return {
        target: currentPrice + 2 * atr,
        stopLoss: currentPrice - 1.5 * atr,
      }
    } else if (recommendation === 'STRONG SELL' || recommendation === 'SELL') {
      return {
        target: currentPrice - 2 * atr,
        stopLoss: currentPrice + 1.5 * atr,
      }
    } else {
      return {
        target: currentPrice + 1 * atr,
        stopLoss: currentPrice - 1 * atr,
      }
    }
  }

  private generateChartData(
    closes: number[],
    _highs: number[],
    _lows: number[],
    volumes: number[],
    dates: string[],
  ): ChartData {
    // Calculate full arrays for all indicators
    const sma50Array = sma(closes, this.config.shortMovingAverage)
    const sma200Array = sma(closes, this.config.longMovingAverage)
    const ema20Array = ema(closes, 20)

    // Calculate RSI values for all data points
    const rsiValues: number[] = []
    for (let i = this.config.rsiPeriod; i < closes.length; i++) {
      const rsiValue = rsi(closes.slice(0, i + 1), this.config.rsiPeriod)
      rsiValues.push(rsiValue)
    }

    // Calculate MACD arrays
    // MACD line is the difference between 12-period EMA and 26-period EMA
    const emaFast = ema(closes, this.config.macdFast) // 12-period
    const emaSlow = ema(closes, this.config.macdSlow) // 26-period

    // Both EMAs should have the same length as they're calculated on the same data
    // MACD values start when we have both EMAs available
    const macdValues: number[] = []
    const _macdStartIndex = this.config.macdSlow - 1 // MACD starts at index 25 (needs 26 data points)

    // Calculate MACD line for each point where both EMAs are available
    for (let i = 0; i < emaSlow.length; i++) {
      macdValues.push(emaFast[emaFast.length - emaSlow.length + i] - emaSlow[i])
    }

    // Signal line is 9-period EMA of MACD line
    const macdSignalValues = ema(macdValues, this.config.macdSignal)

    // Histogram is MACD line minus Signal line
    // Both arrays need to be aligned since signal is shorter
    const macdHistogramValues: number[] = []
    const signalOffset = macdValues.length - macdSignalValues.length
    for (let i = 0; i < macdSignalValues.length; i++) {
      macdHistogramValues.push(macdValues[i + signalOffset] - macdSignalValues[i])
    }

    // Calculate Bollinger Bands arrays
    const bbUpper: number[] = []
    const bbMiddle: number[] = []
    const bbLower: number[] = []

    for (let i = this.config.bollingerPeriod - 1; i < closes.length; i++) {
      // Calculate SMA for this point
      const windowStart = Math.max(0, i - this.config.bollingerPeriod + 1)
      const priceWindow = closes.slice(windowStart, i + 1)

      // Calculate SMA (middle band)
      const smaValue = priceWindow.reduce((sum, p) => sum + p, 0) / priceWindow.length

      // Calculate standard deviation
      const squaredDiffs = priceWindow.map((p) => (p - smaValue) ** 2)
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / priceWindow.length
      const std = Math.sqrt(variance)

      // Calculate bands
      bbMiddle.push(smaValue)
      bbUpper.push(smaValue + this.config.bollingerStdDev * std)
      bbLower.push(smaValue - this.config.bollingerStdDev * std)
    }

    // Calculate volume SMA
    const volumeSmaArray = sma(volumes, this.config.volumePeriod)

    // Show the last 250 days of data (roughly 1 year of trading days)
    // But ensure we have at least SMA 200 calculated
    const minStartIndex = this.config.longMovingAverage - 1 // Index 199
    const desiredChartLength = 250
    const chartStartIndex = Math.max(minStartIndex, closes.length - desiredChartLength)

    // Ensure we have enough data
    if (closes.length <= chartStartIndex) {
      throw new Error(
        `Insufficient historical data for chart generation: have ${closes.length} points, need more than ${chartStartIndex}`,
      )
    }

    // Each indicator array starts at a different position in the original data
    // We need to align them all to start at chartStartIndex

    // Helper function to align indicator arrays with the chart start
    const alignArray = (indicatorArray: number[], indicatorStartsAtIndex: number): number[] => {
      // How many data points into the full dataset does this indicator start?
      // e.g., SMA 50 starts at index 49 (needs 50 points)
      // e.g., SMA 200 starts at index 199 (needs 200 points)

      if (indicatorStartsAtIndex < chartStartIndex) {
        // Indicator has data before the chart starts
        // We need to skip the early data
        const skipCount = chartStartIndex - indicatorStartsAtIndex
        return indicatorArray.slice(skipCount)
      } else if (indicatorStartsAtIndex === chartStartIndex) {
        // Indicator starts exactly where chart starts
        return indicatorArray
      } else {
        // Indicator starts after chart (shouldn't happen with our setup)
        const nullPadding = indicatorStartsAtIndex - chartStartIndex
        return [...Array(nullPadding).fill(null), ...indicatorArray]
      }
    }

    // Calculate where each MACD component starts in the original dataset
    // MACD line starts at index 25 (needs 26 points for slow EMA)
    const macdLineStartIndex = this.config.macdSlow - 1
    // Signal line needs 9 more periods on top of MACD, so index 25 + 8 = 33
    const macdSignalStartIndex = this.config.macdSlow + this.config.macdSignal - 2
    // Histogram starts same time as signal line
    const macdHistogramStartIndex = macdSignalStartIndex

    const chartDataResult = {
      dates: dates.slice(chartStartIndex),
      prices: closes.slice(chartStartIndex),
      // SMA arrays already start at their period-1 index
      sma_50_values: alignArray(sma50Array, this.config.shortMovingAverage - 1),
      sma_200_values: alignArray(sma200Array, this.config.longMovingAverage - 1),
      ema_20_values: alignArray(ema20Array, 19),
      rsi_values: alignArray(rsiValues, this.config.rsiPeriod),
      macd_values: alignArray(macdValues, macdLineStartIndex),
      macd_signal_values: alignArray(macdSignalValues, macdSignalStartIndex),
      macd_histogram_values: alignArray(macdHistogramValues, macdHistogramStartIndex),
      bb_upper: alignArray(bbUpper, this.config.bollingerPeriod - 1),
      bb_middle: alignArray(bbMiddle, this.config.bollingerPeriod - 1),
      bb_lower: alignArray(bbLower, this.config.bollingerPeriod - 1),
      volumes: volumes.slice(chartStartIndex),
      volume_sma: alignArray(volumeSmaArray, this.config.volumePeriod - 1),
    }

    return chartDataResult
  }
}
