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
