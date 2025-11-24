import { html } from 'hono/html'
import { getStyles } from './styles/dashboard.css'
import { Header, SearchForm, RecommendationBadge, MetricCard, ChartContainer } from './components/dashboard.components'

// Main dashboard template
export const dashboardTemplate = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StockPulse - Stock Analysis</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    ${getStyles()}
</head>
<body>
    <div class="container">
        ${Header()}
        ${SearchForm()}
        <div id="results"></div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        let currentCharts = {};

        // Helper functions to generate component HTML
        function RecommendationBadge(recommendation) {
            const recommendationClass = recommendation.toLowerCase()
                .replace(/\\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            return \`<span class="recommendation \${recommendationClass}">\${recommendation}</span>\`;
        }

        function MetricCard(label, value, className) {
            return \`<div class="metric">
                <div class="metric-label">\${label}</div>
                <div class="metric-value \${className || ''}">\${value}</div>
            </div>\`;
        }

        function ChartContainer(title, canvasId) {
            return \`<div class="chart-container">
                <div class="chart-title">\${title}</div>
                <div class="chart-canvas">
                    <canvas id="\${canvasId}"></canvas>
                </div>
            </div>\`;
        }

        // Core functions
        function handleKeyPress(e) {
            if (e.key === 'Enter') analyzeStocks();
        }

        async function analyzeStocks() {
            const input = document.getElementById('ticker-input').value.trim().toUpperCase();
            if (!input) {
                showError('Enter ticker symbols');
                return;
            }

            const tickers = input.split(',').map(t => t.trim()).filter(t => t);
            if (tickers.length === 0) {
                showError('Enter valid tickers');
                return;
            }

            if (tickers.length === 1) {
                await analyzeSingle(tickers[0]);
            } else {
                await analyzeMultiple(tickers);
            }
        }

        async function analyzeSingle(ticker) {
            showLoading();
            try {
                const res = await fetch(\`\${API_BASE}/api/analyze/\${ticker}\`);
                const data = await res.json();
                data.success ? displaySingleResult(data.data, data.cached) : showError(data.error);
            } catch (e) {
                showError('Network error: ' + e.message);
            }
        }

        async function analyzeMultiple(tickers) {
            if (tickers.length > 50) {
                showError('Max 50 tickers');
                return;
            }

            showLoading();
            try {
                const res = await fetch(\`\${API_BASE}/api/scanner\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tickers })
                });
                const data = await res.json();
                data.success ? displayScannerResults(data.data, false) : showError(data.error);
            } catch (e) {
                showError('Network error: ' + e.message);
            }
        }

        async function loadTopOpportunities(limit = 20) {
            showLoading();
            try {
                const strategy = document.getElementById('strategy-selector')?.value || 'most_active';
                const res = await fetch(\`\${API_BASE}/api/scanner?limit=\${limit}&strategy=\${strategy}\`);
                const data = await res.json();
                if (data.success) {
                    displayScannerResults(data.data, true);
                    updateStrategyInfo(data.strategy, data.total);
                } else {
                    showError(data.error);
                }
            } catch (e) {
                showError('Network error: ' + e.message);
            }
        }

        function updateStrategyInfo(strategy, total) {
            const names = {
                'most_active': 'Most Active',
                'gainers': 'Top Gainers',
                'losers': 'Top Losers',
                'mixed': 'Mixed Strategy',
                'static': 'Popular Stocks'
            };
            document.getElementById('strategy-info').textContent = \`Showing \${total} \${names[strategy] || strategy}\`;
        }

        function showStockDetail(ticker) {
            document.getElementById('ticker-input').value = ticker;
            analyzeStocks();
        }

        function goBack() {
            const input = document.getElementById('ticker-input').value;
            input ? analyzeStocks() : (document.getElementById('results').innerHTML = '');
        }

        function showLoading() {
            document.getElementById('results').innerHTML = \`
                <div class="card">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Analyzing...</p>
                    </div>
                </div>
            \`;
        }

        function showError(message) {
            document.getElementById('results').innerHTML = \`
                <div class="card">
                    <div class="error">\${message}</div>
                </div>
            \`;
        }

        function destroyCharts() {
            Object.values(currentCharts).forEach(chart => chart?.destroy());
            currentCharts = {};
        }

        // Chart rendering functions
        function createChart(elementId, config) {
            const ctx = document.getElementById(elementId);
            if (!ctx) return null;
            
            if (currentCharts[elementId]) {
                currentCharts[elementId].destroy();
            }

            const chart = new Chart(ctx, {
                type: config.type,
                data: config.data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: 'rgba(255,255,255,0.8)', padding: 12 } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(99,102,241,0.5)',
                            borderWidth: 1,
                            padding: 10
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: 'rgba(255,255,255,0.6)' }
                        },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: 'rgba(255,255,255,0.6)' }
                        }
                    }
                }
            });

            currentCharts[elementId] = chart;
            return chart;
        }

        function renderPriceChart(data, ticker) {
            const dates = data.dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            createChart('priceChart', {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        { label: 'Price', data: data.prices, borderColor: '#6366f1', borderWidth: 2, tension: 0.1 },
                        { label: 'SMA 50', data: data.sma_50_values, borderColor: '#f59e0b', borderWidth: 2, tension: 0.1 },
                        { label: 'SMA 200', data: data.sma_200_values, borderColor: '#ef4444', borderWidth: 2, tension: 0.1 }
                    ]
                }
            });
        }

        function renderRSIChart(data) {
            const dates = data.dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            const chart = createChart('rsiChart', {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        { label: 'RSI', data: data.rsi_values, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 2, fill: true, tension: 0.1 }
                    ]
                }
            });

            // Add RSI zones plugin
            if (chart) {
                chart.options.plugins.afterDraw = function(chart) {
                    const ctx = chart.ctx;
                    const yScale = chart.scales.y;
                    const chartArea = chart.chartArea;
                    
                    // Overbought zone (70-100)
                    const y70 = yScale.getPixelForValue(70);
                    ctx.fillStyle = 'rgba(239,68,68,0.1)';
                    ctx.fillRect(chartArea.left, 0, chartArea.right - chartArea.left, y70);
                    
                    // Oversold zone (0-30)
                    const y30 = yScale.getPixelForValue(30);
                    ctx.fillStyle = 'rgba(16,185,129,0.1)';
                    ctx.fillRect(chartArea.left, y30, chartArea.right - chartArea.left, chartArea.bottom - y30);
                };
            }
        }

        // Display functions using template literals for consistency
        function displaySingleResult(stock, cached) {
            destroyCharts();
            
            const backButton = document.getElementById('ticker-input').value.includes(',') ? 
                \`<button class="btn btn-secondary mb-16" onclick="goBack()">← Back</button>\` : '';

            const reasons = stock.reasons.map(reason => {
                const type = reason.includes('✓') ? 'positive' : reason.includes('✗') ? 'negative' : 'neutral';
                return \`<div style="padding: 8px; margin: 4px 0; border-radius: 6px; background: rgba(255,255,255,0.05); border-left: 3px solid \${type === 'positive' ? 'var(--success)' : type === 'negative' ? 'var(--danger)' : 'var(--warning)'}">\${reason}</div>\`;
            }).join('');

            const metrics = \`
                <div class="grid grid-3 mb-16">
                    \${MetricCard('Target', stock.target_price, 'positive')}
                    \${MetricCard('Stop Loss', stock.stop_loss)}
                    \${MetricCard('Potential', \`\${stock.potential_gain >= 0 ? '+' : ''}\${stock.potential_gain}%\`, stock.potential_gain >= 0 ? 'positive' : 'negative')}
                </div>
            \`;

            const technical = stock.metrics ? \`
                <div style="margin: 16px 0; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                    <h3 style="margin-bottom: 12px; color: var(--text);">Key Metrics</h3>
                    <div class="grid grid-2">
                        \${stock.metrics.sma_50 ? \`<div><span style="color: var(--text-muted);">SMA 50:</span> \${stock.metrics.sma_50.toFixed(2)}</div>\` : ''}
                        \${stock.metrics.rsi ? \`<div><span style="color: var(--text-muted);">RSI:</span> \${stock.metrics.rsi.toFixed(2)}</div>\` : ''}
                        \${stock.metrics.macd !== null ? \`<div><span style="color: var(--text-muted);">MACD:</span> \${stock.metrics.macd.toFixed(2)}</div>\` : ''}
                        \${stock.metrics.bb_position ? \`<div><span style="color: var(--text-muted);">BB %:</span> \${(stock.metrics.bb_position * 100).toFixed(1)}%</div>\` : ''}
                    </div>
                </div>
            \` : '';

            const charts = stock.chartData ? \`
                <div class="grid">
                    \${ChartContainer('📈 Price & Moving Averages', 'priceChart')}
                    \${ChartContainer('⚡ RSI', 'rsiChart')}
                </div>
            \` : '';

            document.getElementById('results').innerHTML = \`
                <div class="card">
                    \${backButton}
                    <div class="flex" style="margin-bottom: 16px;">
                        <div>
                            <h2 style="font-size: 2rem; margin-bottom: 8px;">\${stock.ticker}</h2>
                            \${RecommendationBadge(stock.recommendation)}
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">\${stock.price}</div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">Current Price</div>
                        </div>
                    </div>

                    \${metrics}

                    <div style="margin: 16px 0;">
                        <h3 style="margin-bottom: 12px;">Analysis</h3>
                        \${reasons}
                    </div>

                    \${technical}

                    \${charts}

                    <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 16px;">
                        \${cached ? '📦 Cached • ' : ''}\${new Date(stock.timestamp).toLocaleString()}
                    </div>
                </div>
            \`;

            if (stock.chartData) {
                setTimeout(() => {
                    renderPriceChart(stock.chartData);
                    renderRSIChart(stock.chartData);
                }, 100);
            }
        }

        function displayBatchResults(stocks) {
            const stocksHTML = stocks.map(stock => {
                if (stock.error) {
                    return \`
                        <div class="card">
                            <h3>\${stock.ticker}</h3>
                            <div class="error">\${stock.error}</div>
                        </div>
                    \`;
                }

                const recommendationClass = stock.recommendation.toLowerCase().replace(' ', '-');
                return \`
                    <div class="card" onclick="showStockDetail('\${stock.ticker}')" style="cursor: pointer; transition: transform 0.2s;">
                        <div class="flex" style="margin-bottom: 12px;">
                            <h3 style="margin: 0;">\${stock.ticker}</h3>
                            <div style="font-weight: 600; color: var(--primary);">\${stock.price}</div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            \${RecommendationBadge(stock.recommendation)}
                        </div>
                        <div class="grid grid-2">
                            <div>
                                <div class="metric-label">Potential</div>
                                <div class="metric-value \${stock.potential_gain >= 0 ? 'positive' : 'negative'}">\${stock.potential_gain >= 0 ? '+' : ''}\${stock.potential_gain}%</div>
                            </div>
                            <div>
                                <div class="metric-label">Confidence</div>
                                <div class="metric-value">\${stock.confidence}%</div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');

            document.getElementById('results').innerHTML = \`
                <div class="card">
                    <h2 style="margin-bottom: 20px;">Batch Results</h2>
                    <div class="grid grid-cards">
                        \${stocksHTML}
                    </div>
                </div>
            \`;
        }

        function displayScannerResults(stocks, isTopOpportunities = false) {
            const stocksHTML = stocks.map(stock => {
                const recommendationClass = stock.recommendation.toLowerCase().replace(' ', '-');
                return \`
                    <div class="card" onclick="showStockDetail('\${stock.ticker}')" style="cursor: pointer;">
                        <div class="flex" style="margin-bottom: 12px;">
                            <h3 style="margin: 0;">\${stock.ticker}</h3>
                            <div style="font-weight: 600; color: var(--primary);">\${stock.price}</div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            \${RecommendationBadge(stock.recommendation)}
                        </div>
                        <div class="grid grid-2">
                            <div>
                                <div class="metric-label">Gain</div>
                                <div class="metric-value \${stock.potential_gain >= 0 ? 'positive' : 'negative'}">\${stock.potential_gain >= 0 ? '+' : ''}\${stock.potential_gain}%</div>
                            </div>
                            <div>
                                <div class="metric-label">R/R</div>
                                <div class="metric-value">\${stock.risk_reward_ratio}:1</div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');

            const title = isTopOpportunities ? '🔥 Top Opportunities' : \`📊 Results (\${stocks.length} stocks)\`;

            document.getElementById('results').innerHTML = \`
                <div class="card">
                    <h2 style="margin-bottom: 20px;">\${title}</h2>
                    <div class="grid grid-cards">
                        \${stocksHTML}
                    </div>
                </div>
            \`;
        }

        // Initialize
        window.addEventListener('DOMContentLoaded', () => {
            loadTopOpportunities(20);
        });
    </script>
</body>
</html>
`

// Export the template function for use in Hono handlers
export default dashboardTemplate
