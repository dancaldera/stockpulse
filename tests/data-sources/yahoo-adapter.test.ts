import { describe, expect, mock, test, afterEach } from 'bun:test'
import { YahooFinanceAdapter } from '../../src/data-sources/yahoo-adapter'
import { DataSourceError } from '../../src/errors'
import type { HistoricalData, QuoteData } from '../../src/yahooFinance'

const trendingMock = mock(async (_count: number) => ['AAPL', 'msft', '^DJI', ''])
const gainersMock = mock(async (_count: number) => ['TSLA', ' TSLA ', 'N/A'])
const losersMock = mock(async (_count: number) => ['T', 'VZ'])
const historicalMock = mock(
  async (_ticker: string, _options: { period1: Date; period2: Date }) => [] as HistoricalData[],
)
const quoteMock = mock(
  async (_ticker: string) =>
    ({
      symbol: 'AAPL',
      regularMarketPrice: 150,
      regularMarketVolume: 1_000_000,
    }) as QuoteData,
)

mock.module('../../src/yahooFinance', () => ({
  trending: trendingMock,
  screener: (type: 'gainers' | 'losers', count: number) =>
    type === 'gainers' ? gainersMock(count) : losersMock(count),
  historical: historicalMock,
  quote: quoteMock,
}))

afterEach(() => {
  trendingMock.mockReset()
  gainersMock.mockReset()
  losersMock.mockReset()
  historicalMock.mockReset()
  quoteMock.mockReset()
})

describe('YahooFinanceAdapter', () => {
  const adapter = new YahooFinanceAdapter()

  test('sanitizes and deduplicates trending tickers', async () => {
    trendingMock.mockResolvedValueOnce(['AAPL', 'msft', '^DJI', ''])

    const tickers = await adapter.getTrendingTickers(5)

    expect(tickers).toEqual(['AAPL', 'MSFT'])
  })

  test('throws DataSourceError when no valid trending tickers returned', async () => {
    trendingMock.mockResolvedValueOnce(['', '^DJI'])

    await expect(adapter.getTrendingTickers()).rejects.toBeInstanceOf(DataSourceError)
  })

  test('fetches and validates gainers tickers', async () => {
    gainersMock.mockResolvedValueOnce(['TSLA', ' TSLA ', 'N/A', 'META'])

    const tickers = await adapter.getGainers(3)

    expect(tickers).toEqual(['TSLA', 'META'])
  })

  test('validates historical data and sorts chronologically', async () => {
    historicalMock.mockResolvedValueOnce([
      {
        date: new Date('2024-01-03'),
        open: 102,
        high: 105,
        low: 101,
        close: 104,
        volume: 1_500_000,
        adjClose: 104,
      },
      {
        date: new Date('2024-01-01'),
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 1_200_000,
        adjClose: 101,
      },
    ])

    const data = await adapter.getHistorical('AAPL', {
      period1: new Date('2024-01-01'),
      period2: new Date('2024-01-10'),
    })

    expect(data[0].date.toISOString()).toBe('2024-01-01T00:00:00.000Z')
    expect(data[1].date.toISOString()).toBe('2024-01-03T00:00:00.000Z')
  })

  test('throws DataSourceError when historical data missing price info', async () => {
    historicalMock.mockResolvedValueOnce([
      {
        date: new Date('2024-01-01'),
        open: 100,
        high: 102,
        low: 99,
        close: Number.NaN,
        volume: 1_200_000,
        adjClose: 101,
      },
    ])

    await expect(
      adapter.getHistorical('AAPL', {
        period1: new Date('2024-01-01'),
        period2: new Date('2024-01-10'),
      }),
    ).rejects.toBeInstanceOf(DataSourceError)
  })

  test('validates quote data', async () => {
    quoteMock.mockResolvedValueOnce({
      symbol: 'AAPL',
      regularMarketPrice: 150.25,
      regularMarketVolume: 1_000_000,
    } as QuoteData)

    const quote = await adapter.getQuote('AAPL')

    expect(quote.regularMarketPrice).toBe(150.25)
  })

  test('throws DataSourceError when quote missing price', async () => {
    quoteMock.mockResolvedValueOnce({
      symbol: 'AAPL',
      regularMarketPrice: Number.NaN,
      regularMarketVolume: 1_000_000,
    } as QuoteData)

    await expect(adapter.getQuote('AAPL')).rejects.toBeInstanceOf(DataSourceError)
  })
})
