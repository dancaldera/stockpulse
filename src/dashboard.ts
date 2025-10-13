export const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StockPulse - Stock Analysis Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0f0f1e;
            min-height: 100vh;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
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

        select {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 36px !important;
        }

        select:hover {
            background-color: rgba(99, 102, 241, 0.3);
            border-color: rgba(99, 102, 241, 0.6);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }

        select:focus {
            outline: none;
            border-color: rgba(99, 102, 241, 0.8);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        select option {
            background: #1a1a2e;
            color: white;
            padding: 10px;
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

        .charts-section {
            margin-top: 32px;
        }

        .chart-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 24px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 24px;
            position: relative;
        }

        .chart-title {
            color: white;
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chart-description {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
            margin-bottom: 20px;
            line-height: 1.5;
        }

        .chart-canvas {
            position: relative;
            height: 350px;
            width: 100%;
        }

        .chart-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.85rem;
        }

        .legend-color {
            width: 20px;
            height: 3px;
            border-radius: 2px;
        }

        .chart-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 16px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .chart-control-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chart-control-label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .chart-select {
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            color: white;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .chart-select:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(99, 102, 241, 0.5);
        }

        .chart-select:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .chart-checkbox {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
        }

        .chart-checkbox:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(99, 102, 241, 0.3);
        }

        .chart-checkbox input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: #6366f1;
        }

        .chart-checkbox label {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.85rem;
            cursor: pointer;
            font-weight: 500;
        }

        .chart-checkbox input[type="checkbox"]:checked + label {
            color: white;
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

            .chart-canvas {
                height: 250px;
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
            <div class="input-section">
                <input type="text" id="ticker-input" placeholder="Enter one or multiple tickers (e.g., AAPL or AAPL, MSFT, GOOGL)" onkeypress="handleKeyPress(event)">
                <button onclick="analyzeStocks()">Search</button>
            </div>
            <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin-top: 12px;">Enter a single ticker for detailed analysis, or multiple tickers separated by commas for comparison</p>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <label style="color: rgba(255, 255, 255, 0.8); font-weight: 600; font-size: 0.95rem;">
                        Market Scanner:
                    </label>
                    <select id="strategy-selector" onchange="loadTopOpportunities()" style="
                        background: rgba(99, 102, 241, 0.2);
                        border: 1px solid rgba(99, 102, 241, 0.4);
                        color: white;
                        padding: 10px 16px;
                        border-radius: 12px;
                        font-size: 0.95rem;
                        cursor: pointer;
                        outline: none;
                        transition: all 0.3s ease;
                        font-weight: 500;
                    ">
                        <option value="most_active">🔥 Most Active</option>
                        <option value="gainers">📈 Top Gainers</option>
                        <option value="losers">📉 Top Losers</option>
                        <option value="mixed">🎯 Mixed (Active + Gainers)</option>
                        <option value="static">⭐ Popular Stocks</option>
                    </select>
                    <button onclick="loadTopOpportunities()" style="
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        border: none;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 12px;
                        font-size: 0.95rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    ">
                        🔄 Refresh
                    </button>
                    <span id="strategy-info" style="color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; margin-left: auto;"></span>
                </div>
            </div>
        </div>

        <div id="results"></div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        let currentDetailTicker = null;
        let activeCharts = {};

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                analyzeStocks();
            }
        }

        async function analyzeStocks() {
            const input = document.getElementById('ticker-input').value.trim().toUpperCase();
            if (!input) {
                showError('Please enter one or more ticker symbols');
                return;
            }

            const tickers = input.split(',').map(t => t.trim()).filter(t => t);

            if (tickers.length === 0) {
                showError('Please enter valid ticker symbols');
                return;
            }

            // If single ticker, show detailed analysis
            if (tickers.length === 1) {
                await analyzeSingle(tickers[0]);
            } else {
                // If multiple tickers, show scanner view
                await analyzeMultiple(tickers);
            }
        }

        async function analyzeSingle(ticker) {
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

        async function analyzeMultiple(tickers) {
            if (tickers.length > 50) {
                showError('Maximum 50 tickers allowed');
                return;
            }

            showLoading();

            try {
                const response = await fetch(\`\${API_BASE}/api/scanner\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tickers })
                });
                const data = await response.json();

                if (data.success) {
                    displayScannerResults(data.data, false);
                } else {
                    showError(data.error || 'Failed to analyze stocks');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            }
        }

        async function loadTopOpportunities(limit = 20) {
            showLoading();

            try {
                const strategy = document.getElementById('strategy-selector')?.value || 'most_active';
                const response = await fetch(\`\${API_BASE}/api/scanner?limit=\${limit}&strategy=\${strategy}\`);
                const data = await response.json();

                if (data.success) {
                    displayScannerResults(data.data, true);
                    updateStrategyInfo(data.strategy, data.total);
                } else {
                    showError(data.error || 'Failed to load top opportunities');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            }
        }

        function updateStrategyInfo(strategy, total) {
            const infoElement = document.getElementById('strategy-info');
            if (infoElement) {
                const strategyNames = {
                    'most_active': 'Most Active Stocks',
                    'gainers': 'Top Gainers Today',
                    'losers': 'Top Losers Today',
                    'mixed': 'Mixed Strategy',
                    'static': 'Popular Stocks'
                };
                infoElement.textContent = \`Showing \${total} \${strategyNames[strategy] || strategy}\`;
            }
        }

        // Load top opportunities on page load
        window.addEventListener('DOMContentLoaded', () => {
            loadTopOpportunities(20);
        });

        async function showStockDetail(ticker) {
            currentDetailTicker = ticker;
            await analyzeSingle(ticker);
        }

        function goBack() {
            const input = document.getElementById('ticker-input').value;
            if (input) {
                analyzeStocks();
            } else {
                document.getElementById('results').innerHTML = '';
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

        function destroyActiveCharts() {
            Object.values(activeCharts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            activeCharts = {};
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        function renderBollingerBandsChart(chartData, currentPrice, ticker) {
            const ctx = document.getElementById('bbChart');
            if (!ctx) return;

            const dates = chartData.dates.map(d => formatDate(d));

            activeCharts.bb = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Price',
                        data: chartData.prices,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        spanGaps: false
                    }, {
                        label: 'Upper Band',
                        data: chartData.bb_upper,
                        borderColor: 'rgba(239, 68, 68, 0.6)',
                        borderWidth: 1.5,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        spanGaps: false
                    }, {
                        label: 'Middle Band (SMA 20)',
                        data: chartData.bb_middle,
                        borderColor: 'rgba(168, 85, 247, 0.8)',
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        spanGaps: false
                    }, {
                        label: 'Lower Band',
                        data: chartData.bb_lower,
                        borderColor: 'rgba(16, 185, 129, 0.6)',
                        borderWidth: 1.5,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: '+1',
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        tension: 0.1,
                        spanGaps: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                                usePointStyle: true,
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }

        function renderMovingAveragesChart(chartData) {
            const ctx = document.getElementById('maChart');
            if (!ctx) return;

            const dates = chartData.dates.map(d => formatDate(d));

            // Debug: Check SMA 200 data
            console.log('SMA 200 data points:', chartData.sma_200_values.filter(v => v !== null).length);
            console.log('SMA 200 sample:', chartData.sma_200_values.slice(-10));

            activeCharts.ma = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Price',
                        data: chartData.prices,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2.5,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        spanGaps: false
                    }, {
                        label: 'SMA 50',
                        data: chartData.sma_50_values,
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        spanGaps: true
                    }, {
                        label: 'SMA 200',
                        data: chartData.sma_200_values,
                        borderColor: '#ef4444',
                        borderWidth: 3,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        spanGaps: false,
                        segment: {
                            borderColor: ctx => ctx.p0.parsed.y === null || ctx.p1.parsed.y === null ? 'transparent' : '#ef4444'
                        }
                    }, {
                        label: 'EMA 20',
                        data: chartData.ema_20_values,
                        borderColor: '#10b981',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        spanGaps: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                                usePointStyle: true,
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                            borderWidth: 1,
                            padding: 12
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }

        // Custom plugin to draw RSI zones
        const rsiZonesPlugin = {
            id: 'rsiZones',
            beforeDraw: (chart) => {
                if (chart.canvas.id !== 'rsiChart') return;

                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                const yScale = chart.scales.y;

                // Overbought zone (70-100)
                const y70 = yScale.getPixelForValue(70);
                const yTop = yScale.getPixelForValue(100);
                ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
                ctx.fillRect(chartArea.left, yTop, chartArea.right - chartArea.left, y70 - yTop);

                // Oversold zone (0-30)
                const y30 = yScale.getPixelForValue(30);
                const yBottom = yScale.getPixelForValue(0);
                ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
                ctx.fillRect(chartArea.left, y30, chartArea.right - chartArea.left, yBottom - y30);

                // Draw reference lines
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(chartArea.left, y70);
                ctx.lineTo(chartArea.right, y70);
                ctx.stroke();

                ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
                ctx.beginPath();
                ctx.moveTo(chartArea.left, y30);
                ctx.lineTo(chartArea.right, y30);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw labels
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '12px Inter, sans-serif';
                ctx.fillText('Overbought (70)', chartArea.right - 120, y70 - 5);
                ctx.fillText('Oversold (30)', chartArea.right - 110, y30 + 15);
            }
        };

        // Register the plugin
        if (typeof Chart !== 'undefined') {
            Chart.register(rsiZonesPlugin);
        }

        function renderRSIChart(chartData) {
            const ctx = document.getElementById('rsiChart');
            if (!ctx) return;

            const dates = chartData.dates.map(d => formatDate(d));

            activeCharts.rsi = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'RSI',
                        data: chartData.rsi_values,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                            borderWidth: 1,
                            padding: 12
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: {
                            min: 0,
                            max: 100,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)'
                            }
                        }
                    }
                }
            });
        }

        function renderMACDChart(chartData) {
            const ctx = document.getElementById('macdChart');
            if (!ctx) return;

            const dates = chartData.dates.map(d => formatDate(d));

            activeCharts.macd = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'MACD Histogram',
                        data: chartData.macd_histogram_values,
                        backgroundColor: chartData.macd_histogram_values.map(v =>
                            v === null ? 'transparent' : (v >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)')
                        ),
                        borderColor: chartData.macd_histogram_values.map(v =>
                            v === null ? 'transparent' : (v >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)')
                        ),
                        borderWidth: 1,
                        type: 'bar'
                    }, {
                        label: 'MACD Line',
                        data: chartData.macd_values,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        type: 'line',
                        spanGaps: false
                    }, {
                        label: 'Signal Line',
                        data: chartData.macd_signal_values,
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        type: 'line',
                        spanGaps: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                                usePointStyle: true,
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                            borderWidth: 1,
                            padding: 12
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)'
                            }
                        }
                    }
                }
            });
        }

        // Global variable to store current chart data
        let currentChartData = null;

        function renderVolumeChart(chartData) {
            const ctx = document.getElementById('volumeChart');
            if (!ctx) return;

            const dates = chartData.dates.map(d => formatDate(d));

            activeCharts.volume = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Volume',
                        data: chartData.volumes,
                        backgroundColor: chartData.volumes.map((v, i) =>
                            i > 0 && chartData.prices[i] > chartData.prices[i-1]
                                ? 'rgba(16, 185, 129, 0.6)'
                                : 'rgba(239, 68, 68, 0.6)'
                        ),
                        borderColor: chartData.volumes.map((v, i) =>
                            i > 0 && chartData.prices[i] > chartData.prices[i-1]
                                ? 'rgba(16, 185, 129, 1)'
                                : 'rgba(239, 68, 68, 1)'
                        ),
                        borderWidth: 1
                    }, {
                        label: 'Average Volume',
                        data: chartData.volume_sma,
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1,
                        type: 'line'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                                usePointStyle: true,
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                            borderWidth: 1,
                            padding: 12,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += new Intl.NumberFormat().format(context.parsed.y);
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                callback: function(value) {
                                    return new Intl.NumberFormat('en-US', {
                                        notation: 'compact',
                                        compactDisplay: 'short'
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        }


        function displaySingleResult(stock, cached) {
            destroyActiveCharts();
            currentChartData = stock.chartData;
            const recommendationClass = stock.recommendation.toLowerCase().replace(' ', '-');

            // Show back button if there's input with multiple tickers
            const input = document.getElementById('ticker-input').value;
            const hasMultipleTickers = input && input.includes(',');

            const backButtonHTML = hasMultipleTickers ? \`
                <button class="back-button" onclick="goBack()">
                    ← Back to Results
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

            const chartsHTML = stock.chartData ? \`
                <div class="charts-section">
                    <div class="chart-container">
                        <div class="chart-title">📊 Bollinger Bands Analysis</div>
                        <div class="chart-description">
                            Bollinger Bands show price volatility and potential overbought/oversold conditions.
                            When price touches the upper band, it may indicate overbought conditions.
                            When it touches the lower band, it may indicate oversold conditions.
                        </div>
                        <div class="chart-canvas">
                            <canvas id="bbChart"></canvas>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-title">📈 Price & Moving Averages</div>
                        <div class="chart-description">
                            Moving averages smooth out price data to identify trends.
                            SMA 50 crossing above SMA 200 (Golden Cross) is bullish.
                            SMA 50 crossing below SMA 200 (Death Cross) is bearish.
                            Note: SMA 200 requires 200+ days of data to display fully.
                        </div>
                        <div class="chart-canvas">
                            <canvas id="maChart"></canvas>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-title">⚡ RSI (Relative Strength Index)</div>
                        <div class="chart-description">
                            RSI measures momentum and overbought/oversold conditions.
                            Above 70 indicates overbought (potential sell signal).
                            Below 30 indicates oversold (potential buy signal).
                        </div>
                        <div class="chart-canvas">
                            <canvas id="rsiChart"></canvas>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-title">🎯 MACD (Moving Average Convergence Divergence)</div>
                        <div class="chart-description">
                            MACD shows the relationship between two moving averages.
                            When MACD line crosses above signal line, it's a bullish signal.
                            When it crosses below, it's bearish. Histogram shows momentum strength.
                        </div>
                        <div class="chart-canvas">
                            <canvas id="macdChart"></canvas>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-title">📊 Volume Analysis</div>
                        <div class="chart-description">
                            Volume shows trading activity. Green bars indicate days when price increased,
                            red bars show price decreases. Higher volume during price movements confirms the trend strength.
                        </div>
                        <div class="chart-canvas">
                            <canvas id="volumeChart"></canvas>
                        </div>
                    </div>
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

                    \${chartsHTML}

                    <div class="timestamp">
                        \${cached ? '📦 Cached result • ' : ''}
                        \${new Date(stock.timestamp).toLocaleString()}
                    </div>
                </div>
            \`;

            // Render charts after DOM is updated
            if (stock.chartData) {
                setTimeout(() => {
                    renderBollingerBandsChart(stock.chartData, stock.price, stock.ticker);
                    renderMovingAveragesChart(stock.chartData);
                    renderRSIChart(stock.chartData);
                    renderMACDChart(stock.chartData);
                    renderVolumeChart(stock.chartData);
                }, 100);
            }
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

        function displayScannerResults(stocks, isTopOpportunities = false) {
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

            const title = isTopOpportunities
                ? '🔥 Top Investment Opportunities (Sorted by Potential Gain)'
                : \`📊 Analysis Results (\${stocks.length} stocks)\`;

            document.getElementById('results').innerHTML = \`
                <div class="card">
                    <h2 style="margin-bottom: 20px; color: white; font-weight: 700;">\${title}</h2>
                    <div class="scanner-grid">
                        \${stocksHTML}
                    </div>
                </div>
            \`;
        }
    </script>
</body>
</html>`
