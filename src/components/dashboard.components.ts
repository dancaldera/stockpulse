import { html } from 'hono/html'

// Component functions for better maintainability
export const Header = () => html`
  <div class="header">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1>StockPulse</h1>
        <p>Real-time Stock Analysis</p>
      </div>
      <a href="/signals" style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #60a5fa; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">📊 Signal History</a>
    </div>
  </div>
`

export const SearchForm = () => html`
  <div class="card">
    <div class="input-group">
      <input 
        type="text" 
        id="ticker-input" 
        placeholder="Enter tickers (AAPL or AAPL, MSFT, GOOGL)"
        onkeypress="handleKeyPress(event)"
      >
      <button class="btn btn-primary" onclick="analyzeStocks()">Search</button>
    </div>
    
    <div class="flex mt-16">
      <div>
        <label style="color: var(--text-muted); font-size: 0.9rem;">
          Market Scanner:
        </label>
        <select id="strategy-selector" onchange="loadTopOpportunities()" style="margin-left: 8px; background: rgba(255,255,255,0.08); border: 1px solid var(--border); border-radius: 4px; padding: 4px 8px; color: var(--text);">
          <option value="most_active">🔥 Most Active</option>
          <option value="gainers">📈 Top Gainers</option>
          <option value="losers">📉 Top Losers</option>
          <option value="mixed">🎯 Mixed</option>
          <option value="static">⭐ Popular</option>
        </select>
      </div>
      <div>
        <button class="btn btn-secondary" onclick="loadTopOpportunities()">🔄 Refresh</button>
        <span id="strategy-info" style="margin-left: 8px; color: var(--text-muted); font-size: 0.8rem;"></span>
      </div>
    </div>
  </div>
`

export const LoadingComponent = () => html`
  <div class="card">
    <div class="loading">
      <div class="spinner"></div>
      <p>Analyzing...</p>
    </div>
  </div>
`

export const ErrorComponent = (message: string) => html`
  <div class="card">
    <div class="error">${message}</div>
  </div>
`

export const RecommendationBadge = (recommendation: string) => {
  const recommendationClass = recommendation.toLowerCase()
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '');  // Remove any special characters
  
  return html`<span class="recommendation ${recommendationClass}">${recommendation}</span>`
}

export const MetricCard = (label: string, value: string, className?: string) => html`
  <div class="metric">
    <div class="metric-label">${label}</div>
    <div class="metric-value ${className || ''}">${value}</div>
  </div>
`

export const ChartContainer = (title: string, canvasId: string) => html`
  <div class="chart-container">
    <div class="chart-title">${title}</div>
    <div class="chart-canvas">
      <canvas id="${canvasId}"></canvas>
    </div>
  </div>
`

export const Footer = () => html`
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-status">
        <span class="status-dot"></span>
        <span>Always Online</span>
      </div>
      <div class="footer-info">
        <span>© 2025 StockPulse</span>
        <span class="footer-separator">•</span>
        <a href="https://github.com/dancaldera" target="_blank" rel="noopener">Open Source</a>
        <span class="footer-separator">•</span>
        <span>Powered by Yahoo Finance</span>
      </div>
      <div class="footer-credits">
        Built with ❤️ by <a href="https://github.com/dancaldera" target="_blank" rel="noopener">@dancaldera</a>
      </div>
    </div>
  </footer>
`