// Mock implementations of the Schwab API surface for local development
// without real OAuth credentials.
//
// Activated when SCHWAB_CLIENT_ID is missing or set to "mock". The mock
// callback URL is /auth/callback?code=mock-code, so the existing OAuth
// flow stays intact end-to-end.

import 'server-only';
import type {
  SchwabTokenResponse,
  SchwabAccount,
  SchwabAccountBalance,
  SchwabPosition,
  SchwabQuote,
  SchwabCandle,
  SchwabOrder,
  PriceHistoryParams,
} from '@/lib/schwab-auth';

export const MOCK_AUTH_CODE = 'mock-code';

export function isMockMode(): boolean {
  const id = process.env.SCHWAB_CLIENT_ID;
  return !id || id === 'mock';
}

export function mockTokenResponse(): SchwabTokenResponse {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'Bearer',
    expires_in: 1800,
    scope: 'readonly',
  };
}

const MOCK_ACCOUNT: SchwabAccount = {
  accountNumber: 'XXXX1234',
  accountHash: 'mock-account-hash',
  accountType: 'MARGIN',
};

export function mockAccounts(): SchwabAccount[] {
  return [MOCK_ACCOUNT];
}

export function mockAccountBalance(): SchwabAccountBalance {
  return {
    accountNumber: MOCK_ACCOUNT.accountNumber,
    accountBalance: 142_587.42,
    buyingPower: 38_421.18,
    cashAvailable: 19_210.59,
  };
}

const MOCK_POSITIONS: SchwabPosition[] = [
  {
    symbol: 'AAPL',
    description: 'Apple Inc',
    assetType: 'EQUITY',
    quantity: 50,
    averagePrice: 182.15,
    marketValue: 11_823.5,
    dayChange: 142.3,
    dayChangePercent: 1.22,
    totalGainLoss: 2_716.0,
  },
  {
    symbol: 'NVDA',
    description: 'NVIDIA Corp',
    assetType: 'EQUITY',
    quantity: 25,
    averagePrice: 480.0,
    marketValue: 21_750.0,
    dayChange: -312.5,
    dayChangePercent: -1.42,
    totalGainLoss: 9_750.0,
  },
  {
    symbol: 'MSFT',
    description: 'Microsoft Corp',
    assetType: 'EQUITY',
    quantity: 30,
    averagePrice: 405.2,
    marketValue: 13_410.0,
    dayChange: 84.6,
    dayChangePercent: 0.63,
    totalGainLoss: 1_254.0,
  },
  {
    symbol: 'SPY',
    description: 'SPDR S&P 500 ETF',
    assetType: 'ETF',
    quantity: 40,
    averagePrice: 540.8,
    marketValue: 22_460.0,
    dayChange: 218.0,
    dayChangePercent: 0.98,
    totalGainLoss: 828.0,
  },
];

export function mockPositions(): SchwabPosition[] {
  return MOCK_POSITIONS;
}

const MOCK_QUOTES: Record<string, SchwabQuote> = {
  SPY: {
    symbol: 'SPY',
    description: 'SPDR S&P 500 ETF',
    lastPrice: 561.5,
    bid: 561.48,
    ask: 561.52,
    netChange: 5.45,
    netPercentChange: 0.98,
    volume: 48_213_400,
    high: 562.1,
    low: 555.3,
    open: 556.0,
    previousClose: 556.05,
  },
  QQQ: {
    symbol: 'QQQ',
    description: 'Invesco QQQ Trust',
    lastPrice: 478.22,
    bid: 478.2,
    ask: 478.25,
    netChange: 3.18,
    netPercentChange: 0.67,
    volume: 32_104_200,
    high: 479.5,
    low: 474.1,
    open: 475.5,
    previousClose: 475.04,
  },
  AAPL: {
    symbol: 'AAPL',
    description: 'Apple Inc',
    lastPrice: 236.47,
    bid: 236.45,
    ask: 236.49,
    netChange: 2.84,
    netPercentChange: 1.22,
    volume: 51_872_100,
    high: 237.2,
    low: 233.5,
    open: 234.0,
    previousClose: 233.63,
  },
  MSFT: {
    symbol: 'MSFT',
    description: 'Microsoft Corp',
    lastPrice: 447.0,
    bid: 446.95,
    ask: 447.05,
    netChange: 2.82,
    netPercentChange: 0.63,
    volume: 18_412_300,
    high: 448.5,
    low: 443.2,
    open: 444.5,
    previousClose: 444.18,
  },
  NVDA: {
    symbol: 'NVDA',
    description: 'NVIDIA Corp',
    lastPrice: 870.0,
    bid: 869.92,
    ask: 870.08,
    netChange: -12.5,
    netPercentChange: -1.42,
    volume: 92_318_500,
    high: 885.0,
    low: 866.3,
    open: 882.5,
    previousClose: 882.5,
  },
};

// Deterministic pseudo-random generator so a given symbol always produces
// the same mock chart across renders.
function hashSeed(symbol: string): number {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nextRandom(seed: number): [number, number] {
  // mulberry32
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, t >>> 0];
}

export function mockPriceHistory(
  symbol: string,
  params: PriceHistoryParams = {}
): SchwabCandle[] {
  const upper = symbol.toUpperCase();
  const base = MOCK_QUOTES[upper]?.previousClose ?? 100 + (upper.charCodeAt(0) % 50);
  const count = (params.period ?? 10) * 24; // ~10 days of hourly candles by default
  const stepMs = (params.frequency ?? 60) * 60 * 1000;
  const startMs = Date.now() - count * stepMs;

  let seed = hashSeed(upper);
  let price = base * 0.95;
  const candles: SchwabCandle[] = [];

  for (let i = 0; i < count; i++) {
    const [r1, s1] = nextRandom(seed);
    const [r2, s2] = nextRandom(s1);
    seed = s2;

    const drift = (r1 - 0.48) * (base * 0.01);
    const range = r2 * (base * 0.005) + base * 0.001;

    const open = price;
    const close = Math.max(0.01, price + drift);
    const high = Math.max(open, close) + range;
    const low = Math.min(open, close) - range;

    candles.push({
      datetime: startMs + i * stepMs,
      open,
      high,
      low,
      close,
      volume: Math.round(100_000 + r1 * 900_000),
    });

    price = close;
  }

  return candles;
}

export function mockOrders(): SchwabOrder[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      orderId: '1000000001',
      symbol: 'AAPL',
      instruction: 'BUY',
      orderType: 'LIMIT',
      status: 'FILLED',
      quantity: 10,
      filledQuantity: 10,
      price: 234.5,
      enteredTime: new Date(now - 2 * day).toISOString(),
      closeTime: new Date(now - 2 * day + 30_000).toISOString(),
    },
    {
      orderId: '1000000002',
      symbol: 'NVDA',
      instruction: 'SELL',
      orderType: 'MARKET',
      status: 'FILLED',
      quantity: 5,
      filledQuantity: 5,
      price: null,
      enteredTime: new Date(now - 1 * day).toISOString(),
      closeTime: new Date(now - 1 * day + 15_000).toISOString(),
    },
    {
      orderId: '1000000003',
      symbol: 'MSFT',
      instruction: 'BUY',
      orderType: 'LIMIT',
      status: 'WORKING',
      quantity: 20,
      filledQuantity: 0,
      price: 440.0,
      enteredTime: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      closeTime: null,
    },
    {
      orderId: '1000000004',
      symbol: 'TSLA',
      instruction: 'BUY',
      orderType: 'STOP',
      status: 'CANCELED',
      quantity: 8,
      filledQuantity: 0,
      price: 200.0,
      enteredTime: new Date(now - 4 * day).toISOString(),
      closeTime: new Date(now - 4 * day + 60_000).toISOString(),
    },
  ];
}

export function mockQuotes(symbols: string[]): SchwabQuote[] {
  return symbols
    .map((sym) => {
      const upper = sym.toUpperCase();
      if (MOCK_QUOTES[upper]) return MOCK_QUOTES[upper];
      // generate a placeholder quote for unknown symbols so the watchlist
      // still renders something useful in mock mode
      const base = 100 + (upper.charCodeAt(0) % 50);
      const change = (upper.charCodeAt(1) || 0) % 7 - 3;
      return {
        symbol: upper,
        description: `${upper} (mock)`,
        lastPrice: base + change,
        bid: base + change - 0.05,
        ask: base + change + 0.05,
        netChange: change,
        netPercentChange: (change / base) * 100,
        volume: 1_000_000 + upper.charCodeAt(0) * 1_000,
        high: base + change + 1.5,
        low: base + change - 2.0,
        open: base,
        previousClose: base,
      };
    });
}
