export function signalsDashboardTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StockPulse - Signal History</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #333;
    }
    h1 { font-size: 24px; color: #fff; }
    .nav-link {
      color: #60a5fa;
      text-decoration: none;
      font-size: 14px;
    }
    .nav-link:hover { text-decoration: underline; }
    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .filter-btn {
      padding: 8px 16px;
      border: 1px solid #444;
      background: #1a1a1a;
      color: #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    .filter-btn:hover { background: #2a2a2a; border-color: #666; }
    .filter-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #1a1a1a;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #333;
    }
    .stat-label { font-size: 12px; color: #888; margin-bottom: 4px; }
    .stat-value { font-size: 20px; font-weight: 600; }
    .stat-value.green { color: #22c55e; }
    .stat-value.red { color: #ef4444; }
    .stat-value.yellow { color: #eab308; }
    .signals-table {
      width: 100%;
      border-collapse: collapse;
      background: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
    }
    .signals-table th,
    .signals-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #333;
    }
    .signals-table th {
      background: #2a2a2a;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #888;
    }
    .signals-table tr:hover { background: #2a2a2a; }
    .ticker { font-weight: 600; color: #60a5fa; }
    .rec {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .rec.strong-buy { background: #14532d; color: #22c55e; }
    .rec.buy { background: #1e3a1e; color: #86efac; }
    .rec.hold { background: #3d3d00; color: #fef08a; }
    .rec.sell { background: #3d1e1e; color: #fca5a5; }
    .rec.strong-sell { background: #450a0a; color: #ef4444; }
    .positive { color: #22c55e; }
    .negative { color: #ef4444; }
    .loading {
      text-align: center;
      padding: 40px;
      color: #888;
    }
    .error {
      background: #450a0a;
      color: #fca5a5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .runs-section { margin-top: 40px; }
    .runs-section h2 {
      font-size: 18px;
      margin-bottom: 16px;
      color: #fff;
    }
    .run-item {
      background: #1a1a1a;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .run-status {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    .run-status.success { background: #14532d; color: #22c55e; }
    .run-status.partial { background: #3d3d00; color: #fef08a; }
    .run-status.failed { background: #450a0a; color: #ef4444; }
    @media (max-width: 768px) {
      .signals-table { font-size: 12px; }
      .signals-table th, .signals-table td { padding: 8px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Signal History</h1>
      <a href="/" class="nav-link">← Back to Dashboard</a>
    </header>

    <div class="filters">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="STRONG BUY">Strong Buy</button>
      <button class="filter-btn" data-filter="BUY">Buy</button>
      <button class="filter-btn" data-filter="HOLD">Hold</button>
      <button class="filter-btn" data-filter="SELL">Sell</button>
      <button class="filter-btn" data-filter="STRONG SELL">Strong Sell</button>
    </div>

    <div class="stats" id="stats">
      <div class="stat-card">
        <div class="stat-label">Total Signals</div>
        <div class="stat-value" id="total-signals">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Strong Buy</div>
        <div class="stat-value green" id="strong-buy-count">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Buy</div>
        <div class="stat-value green" id="buy-count">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Hold</div>
        <div class="stat-value yellow" id="hold-count">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sell</div>
        <div class="stat-value red" id="sell-count">-</div>
      </div>
    </div>

    <div id="signals-container">
      <div class="loading">Loading signals...</div>
    </div>

    <div class="runs-section">
      <h2>Recent Cron Runs</h2>
      <div id="runs-container">
        <div class="loading">Loading runs...</div>
      </div>
    </div>
  </div>

  <script>
    let allSignals = [];
    let currentFilter = 'all';

    async function loadSignals() {
      try {
        const response = await fetch('/api/signals/latest?limit=100');
        const data = await response.json();

        if (data.error) {
          document.getElementById('signals-container').innerHTML =
            '<div class="error">' + data.error + '</div>';
          return;
        }

        allSignals = data.signals || [];
        updateStats();
        renderSignals();
      } catch (error) {
        document.getElementById('signals-container').innerHTML =
          '<div class="error">Failed to load signals: ' + error.message + '</div>';
      }
    }

    async function loadRuns() {
      try {
        const response = await fetch('/api/signals/runs?limit=10');
        const data = await response.json();

        if (data.error) {
          document.getElementById('runs-container').innerHTML =
            '<div class="error">' + data.error + '</div>';
          return;
        }

        const runs = data.runs || [];
        if (runs.length === 0) {
          document.getElementById('runs-container').innerHTML =
            '<div class="loading">No runs yet</div>';
          return;
        }

        const html = runs.map(run => {
          const date = new Date(run.run_timestamp).toLocaleString();
          return '<div class="run-item">' +
            '<span>' + date + ' - ' + run.tickers_analyzed + ' analyzed, ' + run.signals_saved + ' saved (' + run.duration_ms + 'ms)</span>' +
            '<span class="run-status ' + run.status + '">' + run.status + '</span>' +
          '</div>';
        }).join('');

        document.getElementById('runs-container').innerHTML = html;
      } catch (error) {
        document.getElementById('runs-container').innerHTML =
          '<div class="error">Failed to load runs</div>';
      }
    }

    function updateStats() {
      const counts = {
        'STRONG BUY': 0,
        'BUY': 0,
        'HOLD': 0,
        'SELL': 0,
        'STRONG SELL': 0
      };

      allSignals.forEach(s => {
        if (counts[s.recommendation] !== undefined) {
          counts[s.recommendation]++;
        }
      });

      document.getElementById('total-signals').textContent = allSignals.length;
      document.getElementById('strong-buy-count').textContent = counts['STRONG BUY'];
      document.getElementById('buy-count').textContent = counts['BUY'];
      document.getElementById('hold-count').textContent = counts['HOLD'];
      document.getElementById('sell-count').textContent = counts['SELL'] + counts['STRONG SELL'];
    }

    function renderSignals() {
      const filtered = currentFilter === 'all'
        ? allSignals
        : allSignals.filter(s => s.recommendation === currentFilter);

      if (filtered.length === 0) {
        document.getElementById('signals-container').innerHTML =
          '<div class="loading">No signals found</div>';
        return;
      }

      const recClass = (rec) => {
        return rec.toLowerCase().replace(' ', '-');
      };

      const rows = filtered.map(s => {
        return '<tr>' +
          '<td class="ticker">' + s.ticker + '</td>' +
          '<td><span class="rec ' + recClass(s.recommendation) + '">' + s.recommendation + '</span></td>' +
          '<td>' + s.confidence.toFixed(1) + '%</td>' +
          '<td>$' + s.price.toFixed(2) + '</td>' +
          '<td>$' + s.target_price.toFixed(2) + '</td>' +
          '<td class="' + (s.potential_gain >= 0 ? 'positive' : 'negative') + '">' +
            (s.potential_gain >= 0 ? '+' : '') + s.potential_gain.toFixed(1) + '%</td>' +
          '<td>' + s.risk_reward_ratio.toFixed(2) + '</td>' +
          '<td>' + new Date(s.timestamp).toLocaleDateString() + '</td>' +
        '</tr>';
      }).join('');

      const html = '<table class="signals-table">' +
        '<thead><tr>' +
          '<th>Ticker</th>' +
          '<th>Signal</th>' +
          '<th>Confidence</th>' +
          '<th>Price</th>' +
          '<th>Target</th>' +
          '<th>Potential</th>' +
          '<th>R/R</th>' +
          '<th>Date</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';

      document.getElementById('signals-container').innerHTML = html;
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderSignals();
      });
    });

    loadSignals();
    loadRuns();
  </script>
</body>
</html>`
}
