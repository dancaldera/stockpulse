import { html } from 'hono/html'

// CSS Constants
export const CSS = {
  COLORS: {
    PRIMARY: '#6366f1',
    PRIMARY_DARK: '#4f46e5',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
    TEXT: '#ffffff',
    TEXT_MUTED: 'rgba(255, 255, 255, 0.7)',
    BG_CARD: 'rgba(255, 255, 255, 0.05)',
    BG_CARD_HOVER: 'rgba(255, 255, 255, 0.08)',
    BORDER: 'rgba(255, 255, 255, 0.1)',
    SHADOW_PRIMARY: 'rgba(99, 102, 241, 0.4)',
  },
}

// CSS Styles as a function for better maintainability
export const getStyles = () => html`
<style>
  :root {
    --primary: ${CSS.COLORS.PRIMARY};
    --primary-dark: ${CSS.COLORS.PRIMARY_DARK};
    --success: ${CSS.COLORS.SUCCESS};
    --warning: ${CSS.COLORS.WARNING};
    --danger: ${CSS.COLORS.DANGER};
    --text: ${CSS.COLORS.TEXT};
    --text-muted: ${CSS.COLORS.TEXT_MUTED};
    --bg-card: ${CSS.COLORS.BG_CARD};
    --bg-card-hover: ${CSS.COLORS.BG_CARD_HOVER};
    --border: ${CSS.COLORS.BORDER};
    --shadow-primary: ${CSS.COLORS.SHADOW_PRIMARY};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #0f0f1e;
    color: var(--text);
    line-height: 1.5;
    padding: 20px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 32px;
  }

  .header h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--primary), #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header p {
    color: var(--text-muted);
    font-size: 1rem;
  }

  .card {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .input-group input,
  .input-group select {
    flex: 1;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 1rem;
  }

  .input-group input:focus,
  .input-group select:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--bg-card-hover);
  }

  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--shadow-primary);
  }

  .btn-secondary {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text);
  }

  .btn-secondary:hover {
    background: var(--bg-card-hover);
  }

  .grid {
    display: grid;
    gap: 16px;
  }

  .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .grid-cards {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .metric {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }

  .metric-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .metric-value {
    font-size: 1.2rem;
    font-weight: 700;
  }

  .metric-value.positive {
    color: var(--success);
  }

  .metric-value.negative {
    color: var(--danger);
  }

  .recommendation {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
  }

  .recommendation.buy,
  .recommendation.strong-buy {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
  }

  .recommendation.hold {
    background: linear-gradient(135deg, var(--warning), #d97706);
    color: white;
  }

  .recommendation.sell,
  .recommendation.strong-sell {
    background: linear-gradient(135deg, var(--danger), #dc2626);
    color: white;
  }

  .chart-container {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .chart-title {
    color: var(--text);
    font-weight: 600;
    margin-bottom: 12px;
    font-size: 1rem;
  }

  .chart-canvas {
    height: 280px;
  }

  .loading {
    text-align: center;
    padding: 40px 0;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .mt-16 {
    margin-top: 16px;
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .container {
      padding: 0 12px;
    }

    .header h1 {
      font-size: 2rem;
    }

    .input-group {
      flex-direction: column;
    }

    .grid-2,
    .grid-3 {
      grid-template-columns: 1fr;
    }

    .grid-cards {
      grid-template-columns: 1fr;
    }

    .chart-canvas {
      height: 240px;
    }
  }
</style>
`
