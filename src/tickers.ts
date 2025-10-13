/**
 * Popular stock tickers for market scanner
 */

export const POPULAR_TICKERS = [
  // Tech Giants (FAANG+)
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'NVDA',
  'TSLA',

  // Other Major Tech
  'NFLX',
  'AMD',
  'INTC',
  'ORCL',
  'ADBE',
  'CRM',
  'CSCO',

  // Finance
  'JPM',
  'BAC',
  'WFC',
  'GS',
  'MS',
  'V',
  'MA',

  // Healthcare
  'JNJ',
  'UNH',
  'PFE',
  'ABBV',
  'MRK',
  'TMO',
  'LLY',

  // Consumer
  'WMT',
  'HD',
  'DIS',
  'NKE',
  'MCD',
  'SBUX',
  'COST',

  // Industrial
  'BA',
  'CAT',
  'GE',
  'MMM',
  'HON',
  'UPS',
  'RTX',

  // Energy
  'XOM',
  'CVX',
  'COP',
  'SLB',
  'EOG',

  // Telecom
  'T',
  'VZ',
  'TMUS',

  // Popular Growth
  'PLTR',
  'COIN',
  'RBLX',
  'SNOW',
  'DKNG',
  'SQ',
  'SHOP',
]

/**
 * Popular cryptocurrency tickers on Yahoo Finance
 * Format: {SYMBOL}-USD (e.g., BTC-USD)
 */
export const CRYPTO_TICKERS = [
  // Major cryptocurrencies by market cap
  'BTC-USD', // Bitcoin
  'ETH-USD', // Ethereum
  'USDT-USD', // Tether
  'BNB-USD', // Binance Coin
  'SOL-USD', // Solana
  'XRP-USD', // Ripple
  'USDC-USD', // USD Coin
  'ADA-USD', // Cardano
  'DOGE-USD', // Dogecoin
  'TRX-USD', // TRON
  'AVAX-USD', // Avalanche
  'DOT-USD', // Polkadot
  'MATIC-USD', // Polygon
  'LINK-USD', // Chainlink
  'SHIB-USD', // Shiba Inu
  'UNI-USD', // Uniswap
  'LTC-USD', // Litecoin
  'ATOM-USD', // Cosmos
  'XLM-USD', // Stellar
  'ALGO-USD', // Algorand
]

export const TICKER_CATEGORIES = {
  'Tech Giants': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'],
  Tech: ['NFLX', 'AMD', 'INTC', 'ORCL', 'ADBE', 'CRM', 'CSCO'],
  Finance: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA'],
  Healthcare: ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'TMO', 'LLY'],
  Consumer: ['WMT', 'HD', 'DIS', 'NKE', 'MCD', 'SBUX', 'COST'],
  Industrial: ['BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'RTX'],
  Energy: ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
  Telecom: ['T', 'VZ', 'TMUS'],
  Growth: ['PLTR', 'COIN', 'RBLX', 'SNOW', 'DKNG', 'SQ', 'SHOP'],
  Crypto: [
    'BTC-USD',
    'ETH-USD',
    'SOL-USD',
    'XRP-USD',
    'ADA-USD',
    'DOGE-USD',
    'AVAX-USD',
    'DOT-USD',
    'MATIC-USD',
    'LINK-USD',
  ],
}
