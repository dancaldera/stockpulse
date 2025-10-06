export const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StockPulse - Stock Analysis Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0f0f1e;
            background-image:
                radial-gradient(at 20% 30%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
                radial-gradient(at 80% 70%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
                radial-gradient(at 50% 50%, rgba(34, 211, 238, 0.1) 0px, transparent 50%);
            min-height: 100vh;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
        }

        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(99,102,241,0.05)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
            pointer-events: none;
            z-index: 0;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
            animation: fadeInDown 0.6s ease-out;
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .header h1 {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
        }

        .header h1::before {
            content: '📊';
            font-size: 3.5rem;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header p {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 400;
        }

        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .input-section {
            display: flex;
            gap: 12px;
            margin-bottom: 15px;
        }

        input[type="text"], select {
            flex: 1;
            padding: 14px 18px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            font-size: 16px;
            color: white;
            transition: all 0.3s ease;
        }

        input[type="text"]::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        input[type="text"]:focus, select:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.12);
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        select {
            cursor: pointer;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 600;
        }

        select option {
            background: #1a1a2e;
            color: white;
        }

        button {
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }

        button:hover::before {
            left: 100%;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }

        button:active {
            transform: translateY(0);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }

        .tab {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.6);
            transition: all 0.3s ease;
        }

        .tab:hover {
            background: rgba(255, 255, 255, 0.08);
            color: white;
        }

        .tab.active {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border-color: transparent;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }

        .loading {
            text-align: center;
            padding: 60px;
            color: white;
        }

        .spinner {
            width: 50px;
            height: 50px;
            margin: 0 auto 20px;
            position: relative;
        }

        .spinner::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 4px solid rgba(99, 102, 241, 0.2);
            border-top-color: #6366f1;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .stock-result {
            margin-bottom: 20px;
        }

        .stock-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ticker {
            font-size: 2.5rem;
            font-weight: 800;
            color: white;
            letter-spacing: -0.02em;
        }

        .price {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .recommendation {
            display: inline-block;
            padding: 10px 24px;
            border-radius: 24px;
            font-weight: 700;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .recommendation.strong-buy {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }

        .recommendation.buy {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
        }

        .recommendation.hold {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
        }

        .recommendation.sell {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
        }

        .recommendation.strong-sell {
            background: linear-gradient(135deg, #dc2626, #991b1b);
            color: white;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .metric {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }

        .metric:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
            border-color: rgba(99, 102, 241, 0.3);
        }

        .metric-label {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: white;
        }

        .metric-value.positive {
            color: #10b981;
            text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }

        .metric-value.negative {
            color: #ef4444;
            text-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }

        .reasons {
            margin-top: 24px;
        }

        .reasons h3 {
            margin-bottom: 16px;
            color: white;
            font-size: 1.3rem;
            font-weight: 700;
        }

        .reason {
            padding: 14px 18px;
            margin-bottom: 10px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-left: 4px solid;
            color: rgba(255, 255, 255, 0.9);
            transition: all 0.3s ease;
        }

        .reason:hover {
            transform: translateX(4px);
            background: rgba(255, 255, 255, 0.08);
        }

        .reason.bullish {
            border-left-color: #10b981;
        }

        .reason.bearish {
            border-left-color: #ef4444;
        }

        .reason.neutral {
            border-left-color: #f59e0b;
        }

        .technical-details {
            margin-top: 24px;
            padding: 24px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .technical-details h3 {
            margin-bottom: 20px;
            color: white;
            font-size: 1.3rem;
            font-weight: 700;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            transition: background 0.2s ease;
        }

        .detail-row:hover {
            background: rgba(255, 255, 255, 0.03);
            padding-left: 8px;
            padding-right: 8px;
            border-radius: 8px;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            color: rgba(255, 255, 255, 0.6);
            font-weight: 500;
        }

        .detail-value {
            font-weight: 700;
            color: white;
        }

        .batch-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
        }

        .batch-item {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 24px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .batch-item:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 32px rgba(99, 102, 241, 0.3);
            border-color: rgba(99, 102, 241, 0.5);
        }

        .batch-item h3 {
            color: white;
            font-size: 1.5rem;
        }

        .scanner-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
        }

        .scanner-item {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .scanner-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 28px rgba(99, 102, 241, 0.3);
            border-color: rgba(99, 102, 241, 0.5);
        }

        .scanner-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .scanner-ticker {
            font-size: 1.4rem;
            font-weight: 800;
            color: white;
        }

        .scanner-price {
            font-size: 1.2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .scanner-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 12px;
        }

        .scanner-metric {
            font-size: 0.85rem;
        }

        .error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 16px;
            backdrop-filter: blur(10px);
        }

        .timestamp {
            text-align: center;
            color: rgba(255, 255, 255, 0.4);
            font-size: 0.85rem;
            margin-top: 24px;
            font-weight: 500;
        }

        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.08);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            margin-bottom: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
        }

        .back-button:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateX(-4px);
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2.5rem;
            }

            .metrics-grid {
                grid-template-columns: 1fr;
            }

            .batch-grid, .scanner-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>StockPulse</h1>
            <p>Real-time Stock Analysis Dashboard</p>
        </div>

        <div class="card">
            <div class="tabs">
                <button class="tab active" onclick="switchTab('single')">Single Stock</button>
                <button class="tab" onclick="switchTab('batch')">Batch Analysis</button>
                <button class="tab" onclick="switchTab('scanner')">Market Scanner</button>
            </div>

            <div id="single-tab">
                <div class="input-section">
                    <input type="text" id="ticker-input" placeholder="Enter ticker symbol (e.g., AAPL)" onkeypress="handleKeyPress(event, 'single')">
                    <button onclick="analyzeSingle()">Analyze</button>
                </div>
            </div>

            <div id="batch-tab" style="display: none;">
                <div class="input-section">
                    <input type="text" id="batch-input" placeholder="Enter tickers separated by commas (e.g., AAPL, MSFT, GOOGL)" onkeypress="handleKeyPress(event, 'batch')">
                    <button onclick="analyzeBatch()">Analyze Batch</button>
                </div>
                <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">Max 10 tickers per request</p>
            </div>

            <div id="scanner-tab" style="display: none;">
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
                    <button onclick="loadScanner()" style="flex: 1;">🔄 Load Top Opportunities</button>
                    <select id="scanner-limit" style="padding: 12px; border-radius: 8px; border: 2px solid #e0e0e0;">
                        <option value="10">Top 10</option>
                        <option value="20" selected>Top 20</option>
                        <option value="30">Top 30</option>
                        <option value="50">Top 50</option>
                    </select>
                </div>
                <p style="color: #666; font-size: 0.9rem;">Click on any stock to view detailed analysis</p>
            </div>
        </div>

        <div id="results"></div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        let currentDetailTicker = null;

        function switchTab(tab) {
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');

            document.getElementById('single-tab').style.display = tab === 'single' ? 'block' : 'none';
            document.getElementById('batch-tab').style.display = tab === 'batch' ? 'block' : 'none';
            document.getElementById('scanner-tab').style.display = tab === 'scanner' ? 'block' : 'none';
            document.getElementById('results').innerHTML = '';

            if (tab === 'scanner') {
                loadScanner();
            }
        }

        function handleKeyPress(event, type) {
            if (event.key === 'Enter') {
                type === 'single' ? analyzeSingle() : analyzeBatch();
            }
        }

        async function analyzeSingle() {
            const ticker = document.getElementById('ticker-input').value.trim().toUpperCase();
            if (!ticker) {
                showError('Please enter a ticker symbol');
                return;
            }

            showLoading();

            try {
                const response = await fetch(\`\${API_BASE}/api/analyze/\${ticker}\`);
                const data = await response.json();

                if (data.success) {
                    displaySingleResult(data.data, data.cached);
                } else {
                    showError(data.error || 'Failed to analyze stock');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            }
        }

        async function analyzeBatch() {
            const input = document.getElementById('batch-input').value.trim();
            if (!input) {
                showError('Please enter ticker symbols');
                return;
            }

            const tickers = input.split(',').map(t => t.trim().toUpperCase()).filter(t => t);

            if (tickers.length === 0) {
                showError('Please enter valid ticker symbols');
                return;
            }

            if (tickers.length > 10) {
                showError('Maximum 10 tickers allowed');
                return;
            }

            showLoading();

            try {
                const response = await fetch(\`\${API_BASE}/api/batch\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tickers })
                });
                const data = await response.json();

                if (data.success) {
                    displayBatchResults(data.data);
                } else {
                    showError(data.error || 'Failed to analyze stocks');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            }
        }

        async function loadScanner() {
            const limit = document.getElementById('scanner-limit').value;
            showLoading();

            try {
                const response = await fetch(\`\${API_BASE}/api/scanner?limit=\${limit}\`);
                const data = await response.json();

                if (data.success) {
                    displayScannerResults(data.data);
                } else {
                    showError(data.error || 'Failed to load scanner');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            }
        }

        async function showStockDetail(ticker) {
            currentDetailTicker = ticker;
            showLoading();

            try {
                const response = await fetch(\`\${API_BASE}/api/analyze/\${ticker}\`);
                const data = await response.json();

                if (data.success) {
                    displaySingleResult(data.data, data.cached, true);
                } else {
                    showError(data.error || 'Failed to analyze stock');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            }
        }

        function showLoading() {
            document.getElementById('results').innerHTML = \`
                <div class="card loading">
                    <div class="spinner"></div>
                    <p>Analyzing stock data...</p>
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

        function displaySingleResult(stock, cached, showBackButton = false) {
            const recommendationClass = stock.recommendation.toLowerCase().replace(' ', '-');

            const backButtonHTML = showBackButton ? \`
                <button class="back-button" onclick="loadScanner()">
                    ← Back to Scanner
                </button>
            \` : '';

            const reasonsHTML = stock.reasons.map(reason => {
                let type = 'neutral';
                if (reason.includes('✓')) type = 'bullish';
                if (reason.includes('✗')) type = 'bearish';
                return \`<div class="reason \${type}">\${reason}</div>\`;
            }).join('');

            const metricsHTML = \`
                <div class="metrics-grid">
                    <div class="metric">
                        <div class="metric-label">Target Price</div>
                        <div class="metric-value positive">$\${stock.target_price}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Stop Loss</div>
                        <div class="metric-value negative">$\${stock.stop_loss}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Potential Gain</div>
                        <div class="metric-value \${stock.potential_gain >= 0 ? 'positive' : 'negative'}">
                            \${stock.potential_gain >= 0 ? '+' : ''}\${stock.potential_gain}%
                        </div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Risk</div>
                        <div class="metric-value">\${stock.risk}%</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Risk/Reward</div>
                        <div class="metric-value">\${stock.risk_reward_ratio}:1</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Confidence</div>
                        <div class="metric-value">\${stock.confidence}%</div>
                    </div>
                </div>
            \`;

            const technicalHTML = stock.metrics ? \`
                <div class="technical-details">
                    <h3>Technical Indicators</h3>
                    \${stock.metrics.sma_50 ? \`<div class="detail-row"><span class="detail-label">SMA 50</span><span class="detail-value">\${stock.metrics.sma_50.toFixed(2)}</span></div>\` : ''}
                    \${stock.metrics.sma_200 ? \`<div class="detail-row"><span class="detail-label">SMA 200</span><span class="detail-value">\${stock.metrics.sma_200.toFixed(2)}</span></div>\` : ''}
                    \${stock.metrics.ema_20 ? \`<div class="detail-row"><span class="detail-label">EMA 20</span><span class="detail-value">\${stock.metrics.ema_20.toFixed(2)}</span></div>\` : ''}
                    \${stock.metrics.rsi ? \`<div class="detail-row"><span class="detail-label">RSI (14)</span><span class="detail-value">\${stock.metrics.rsi.toFixed(2)}</span></div>\` : ''}
                    \${stock.metrics.macd !== null ? \`<div class="detail-row"><span class="detail-label">MACD</span><span class="detail-value">\${stock.metrics.macd.toFixed(2)}</span></div>\` : ''}
                    \${stock.metrics.bb_position ? \`<div class="detail-row"><span class="detail-label">Bollinger Position</span><span class="detail-value">\${(stock.metrics.bb_position * 100).toFixed(1)}%</span></div>\` : ''}
                    \${stock.metrics.volume_ratio ? \`<div class="detail-row"><span class="detail-label">Volume Ratio</span><span class="detail-value">\${stock.metrics.volume_ratio.toFixed(2)}x</span></div>\` : ''}
                    \${stock.metrics.atr ? \`<div class="detail-row"><span class="detail-label">ATR</span><span class="detail-value">\${stock.metrics.atr.toFixed(2)}</span></div>\` : ''}
                    \${stock.metrics.trend_strength ? \`<div class="detail-row"><span class="detail-label">Trend Strength</span><span class="detail-value">\${stock.metrics.trend_strength.toFixed(2)}</span></div>\` : ''}
                    \${stock.metrics.pe_ratio ? \`<div class="detail-row"><span class="detail-label">P/E Ratio</span><span class="detail-value">\${stock.metrics.pe_ratio.toFixed(2)}</span></div>\` : ''}
                    \${stock.metrics.peg_ratio ? \`<div class="detail-row"><span class="detail-label">PEG Ratio</span><span class="detail-value">\${stock.metrics.peg_ratio.toFixed(2)}</span></div>\` : ''}
                </div>
            \` : '';

            document.getElementById('results').innerHTML = \`
                <div class="card stock-result">
                    \${backButtonHTML}
                    <div class="stock-header">
                        <div>
                            <div class="ticker">\${stock.ticker}</div>
                            <span class="recommendation \${recommendationClass}">\${stock.recommendation}</span>
                        </div>
                        <div class="price">$\${stock.price}</div>
                    </div>

                    \${metricsHTML}

                    <div class="reasons">
                        <h3>Analysis Summary</h3>
                        \${reasonsHTML}
                    </div>

                    \${technicalHTML}

                    <div class="timestamp">
                        \${cached ? '📦 Cached result • ' : ''}
                        \${new Date(stock.timestamp).toLocaleString()}
                    </div>
                </div>
            \`;
        }

        function displayBatchResults(stocks) {
            const stocksHTML = stocks.map(stock => {
                if (stock.error) {
                    return \`
                        <div class="batch-item">
                            <h3 style="margin-bottom: 10px;">\${stock.ticker}</h3>
                            <div class="error">\${stock.error}</div>
                        </div>
                    \`;
                }

                const recommendationClass = stock.recommendation.toLowerCase().replace(' ', '-');
                return \`
                    <div class="batch-item" onclick="showStockDetail('\${stock.ticker}')">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3>\${stock.ticker}</h3>
                            <span class="price" style="font-size: 1.2rem;">$\${stock.price}</span>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <span class="recommendation \${recommendationClass}">\${stock.recommendation}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                            <div>
                                <div class="metric-label">Potential Gain</div>
                                <div class="metric-value \${stock.potential_gain >= 0 ? 'positive' : 'negative'}" style="font-size: 1.1rem;">
                                    \${stock.potential_gain >= 0 ? '+' : ''}\${stock.potential_gain}%
                                </div>
                            </div>
                            <div>
                                <div class="metric-label">Confidence</div>
                                <div class="metric-value" style="font-size: 1.1rem;">\${stock.confidence}%</div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');

            document.getElementById('results').innerHTML = \`
                <div class="card">
                    <h2 style="margin-bottom: 20px; color: white; font-weight: 700;">Batch Analysis Results</h2>
                    <div class="batch-grid">
                        \${stocksHTML}
                    </div>
                </div>
            \`;
        }

        function displayScannerResults(stocks) {
            const stocksHTML = stocks.map(stock => {
                const recommendationClass = stock.recommendation.toLowerCase().replace(' ', '-');
                return \`
                    <div class="scanner-item" onclick="showStockDetail('\${stock.ticker}')">
                        <div class="scanner-header">
                            <div class="scanner-ticker">\${stock.ticker}</div>
                            <div class="scanner-price">$\${stock.price}</div>
                        </div>
                        <div style="margin: 10px 0;">
                            <span class="recommendation \${recommendationClass}">\${stock.recommendation}</span>
                        </div>
                        <div class="scanner-metrics">
                            <div>
                                <div class="metric-label">Gain</div>
                                <div class="metric-value \${stock.potential_gain >= 0 ? 'positive' : 'negative'}">
                                    \${stock.potential_gain >= 0 ? '+' : ''}\${stock.potential_gain}%
                                </div>
                            </div>
                            <div>
                                <div class="metric-label">R/R</div>
                                <div class="metric-value">\${stock.risk_reward_ratio}:1</div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');

            document.getElementById('results').innerHTML = \`
                <div class="card">
                    <h2 style="margin-bottom: 20px; color: white; font-weight: 700;">Top Investment Opportunities (Sorted by Potential Gain)</h2>
                    <div class="scanner-grid">
                        \${stocksHTML}
                    </div>
                </div>
            \`;
        }
    </script>
</body>
</html>`;
