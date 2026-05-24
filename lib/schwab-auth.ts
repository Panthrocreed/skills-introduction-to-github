// Schwab OAuth2 and API utilities
//
// Schwab API base URLs:
//   - OAuth:       https://api.schwabapi.com/v1/oauth
//   - Trader API:  https://api.schwabapi.com/trader/v1
//   - Market Data: https://api.schwabapi.com/marketdata/v1
//
// Account number flow: GET /trader/v1/accounts/accountNumbers returns
// pairs of { accountNumber, hashValue }. The hashValue is what subsequent
// trader endpoints expect (Schwab does not accept raw account numbers).

import 'server-only';
import {
  isMockMode,
  mockTokenResponse,
  mockAccounts,
  mockAccountBalance,
  mockPositions,
  mockQuotes,
  mockPriceHistory,
  MOCK_AUTH_CODE,
} from '@/lib/schwab-mock';

const SCHWAB_OAUTH_BASE = 'https://api.schwabapi.com/v1/oauth';
const SCHWAB_TRADER_BASE = 'https://api.schwabapi.com/trader/v1';
const SCHWAB_MARKETDATA_BASE = 'https://api.schwabapi.com/marketdata/v1';

// ---------- OAuth ----------

export interface SchwabTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // seconds (typically 1800 = 30 min)
  scope?: string;
  id_token?: string;
}

export const getSchwabAuthUrl = (): string => {
  if (isMockMode()) {
    // Skip the round-trip to Schwab and go straight to the callback
    const redirectUri =
      process.env.NEXT_PUBLIC_SCHWAB_REDIRECT_URI ??
      'http://localhost:3000/auth/callback';
    return `${redirectUri}?code=${MOCK_AUTH_CODE}`;
  }

  const clientId = process.env.SCHWAB_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SCHWAB_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Missing Schwab OAuth credentials');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'readonly',
  });

  return `${SCHWAB_OAUTH_BASE}/authorize?${params.toString()}`;
};

const basicAuthHeader = (): string => {
  const clientId = process.env.SCHWAB_CLIENT_ID;
  const clientSecret = process.env.SCHWAB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing Schwab OAuth credentials');
  }
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${encoded}`;
};

export const exchangeCodeForToken = async (
  code: string
): Promise<SchwabTokenResponse> => {
  if (isMockMode()) return mockTokenResponse();

  const redirectUri = process.env.NEXT_PUBLIC_SCHWAB_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error('Missing NEXT_PUBLIC_SCHWAB_REDIRECT_URI');
  }

  const response = await fetch(`${SCHWAB_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Schwab token exchange failed (${response.status}): ${text}`);
  }

  return response.json();
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<SchwabTokenResponse> => {
  if (isMockMode()) return mockTokenResponse();

  const response = await fetch(`${SCHWAB_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Schwab token refresh failed (${response.status}): ${text}`);
  }

  return response.json();
};

// ---------- Accounts ----------

export interface SchwabAccount {
  accountNumber: string;
  accountHash: string;
  accountType?: string;
}

export interface SchwabAccountBalance {
  accountNumber: string;
  accountBalance: number;
  buyingPower: number;
  cashAvailable: number;
}

interface RawAccountNumberPair {
  accountNumber: string;
  hashValue: string;
}

interface RawSecuritiesAccount {
  type?: string;
  accountNumber?: string;
  currentBalances?: {
    liquidationValue?: number;
    cashBalance?: number;
    buyingPower?: number;
    cashAvailableForTrading?: number;
    cashAvailableForWithdrawal?: number;
    equity?: number;
  };
  positions?: RawPosition[];
}

interface RawAccountResponse {
  securitiesAccount?: RawSecuritiesAccount;
  aggregatedBalance?: {
    currentLiquidationValue?: number;
    liquidationValue?: number;
  };
}

const authHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: 'application/json',
});

export const getAccountNumbers = async (
  accessToken: string
): Promise<RawAccountNumberPair[]> => {
  const response = await fetch(`${SCHWAB_TRADER_BASE}/accounts/accountNumbers`, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch account numbers: ${response.statusText}`);
  }

  return response.json();
};

export const getAccounts = async (accessToken: string): Promise<SchwabAccount[]> => {
  if (isMockMode()) return mockAccounts();

  const [numbers, accountsRaw] = await Promise.all([
    getAccountNumbers(accessToken),
    fetch(`${SCHWAB_TRADER_BASE}/accounts`, {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    }).then(async (r): Promise<RawAccountResponse[]> => {
      if (!r.ok) throw new Error(`Failed to fetch accounts: ${r.statusText}`);
      return r.json();
    }),
  ]);

  const hashByNumber = new Map(numbers.map((n) => [n.accountNumber, n.hashValue]));

  return accountsRaw
    .map((entry) => entry.securitiesAccount)
    .filter((sa): sa is RawSecuritiesAccount => Boolean(sa?.accountNumber))
    .map((sa) => ({
      accountNumber: sa.accountNumber!,
      accountHash: hashByNumber.get(sa.accountNumber!) ?? sa.accountNumber!,
      accountType: sa.type,
    }));
};

export const getAccountBalance = async (
  accessToken: string,
  accountHash: string
): Promise<SchwabAccountBalance> => {
  if (isMockMode()) return mockAccountBalance();

  const response = await fetch(`${SCHWAB_TRADER_BASE}/accounts/${accountHash}`, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch account balance: ${response.statusText}`);
  }

  const data: RawAccountResponse = await response.json();
  const securities = data.securitiesAccount ?? {};
  const balances = securities.currentBalances ?? {};

  return {
    accountNumber: securities.accountNumber ?? '',
    accountBalance:
      data.aggregatedBalance?.currentLiquidationValue ??
      balances.liquidationValue ??
      balances.equity ??
      balances.cashBalance ??
      0,
    buyingPower: balances.buyingPower ?? 0,
    cashAvailable:
      balances.cashAvailableForTrading ?? balances.cashBalance ?? 0,
  };
};

// ---------- Positions ----------

interface RawPosition {
  shortQuantity?: number;
  longQuantity?: number;
  averagePrice?: number;
  marketValue?: number;
  currentDayProfitLoss?: number;
  currentDayProfitLossPercentage?: number;
  longOpenProfitLoss?: number;
  instrument?: {
    symbol?: string;
    description?: string;
    assetType?: string;
    cusip?: string;
  };
}

export interface SchwabPosition {
  symbol: string;
  description: string;
  assetType: string;
  quantity: number;
  averagePrice: number;
  marketValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGainLoss: number;
}

export const getPositions = async (
  accessToken: string,
  accountHash: string
): Promise<SchwabPosition[]> => {
  if (isMockMode()) return mockPositions();

  const response = await fetch(
    `${SCHWAB_TRADER_BASE}/accounts/${accountHash}?fields=positions`,
    {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.statusText}`);
  }

  const data: RawAccountResponse = await response.json();
  const raw = data.securitiesAccount?.positions ?? [];

  return raw
    .filter((p) => p.instrument?.symbol)
    .map((p) => {
      const quantity = (p.longQuantity ?? 0) - (p.shortQuantity ?? 0);
      return {
        symbol: p.instrument!.symbol!,
        description: p.instrument!.description ?? '',
        assetType: p.instrument!.assetType ?? 'UNKNOWN',
        quantity,
        averagePrice: p.averagePrice ?? 0,
        marketValue: p.marketValue ?? 0,
        dayChange: p.currentDayProfitLoss ?? 0,
        dayChangePercent: p.currentDayProfitLossPercentage ?? 0,
        totalGainLoss: p.longOpenProfitLoss ?? 0,
      };
    });
};

// ---------- Market Data ----------

interface RawQuoteEntry {
  symbol?: string;
  quote?: {
    lastPrice?: number;
    bidPrice?: number;
    askPrice?: number;
    netChange?: number;
    netPercentChange?: number;
    totalVolume?: number;
    highPrice?: number;
    lowPrice?: number;
    openPrice?: number;
    closePrice?: number;
  };
  reference?: {
    description?: string;
  };
}

export interface SchwabQuote {
  symbol: string;
  description: string;
  lastPrice: number;
  bid: number;
  ask: number;
  netChange: number;
  netPercentChange: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

// ---------- Price History ----------

export interface SchwabCandle {
  datetime: number; // ms epoch
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface RawPriceHistoryResponse {
  candles?: SchwabCandle[];
  symbol?: string;
  empty?: boolean;
}

export interface PriceHistoryParams {
  periodType?: 'day' | 'month' | 'year' | 'ytd';
  period?: number;
  frequencyType?: 'minute' | 'daily' | 'weekly' | 'monthly';
  frequency?: number;
}

export const getPriceHistory = async (
  accessToken: string,
  symbol: string,
  params: PriceHistoryParams = {}
): Promise<SchwabCandle[]> => {
  if (isMockMode()) return mockPriceHistory(symbol, params);

  const query = new URLSearchParams({
    symbol,
    periodType: params.periodType ?? 'day',
    period: String(params.period ?? 10),
    frequencyType: params.frequencyType ?? 'minute',
    frequency: String(params.frequency ?? 5),
  });

  const response = await fetch(
    `${SCHWAB_MARKETDATA_BASE}/pricehistory?${query.toString()}`,
    {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch price history: ${response.statusText}`);
  }

  const data: RawPriceHistoryResponse = await response.json();
  return data.candles ?? [];
};

export const getQuotes = async (
  accessToken: string,
  symbols: string[]
): Promise<SchwabQuote[]> => {
  if (symbols.length === 0) return [];
  if (isMockMode()) return mockQuotes(symbols);

  const params = new URLSearchParams({
    symbols: symbols.join(','),
    fields: 'quote,reference',
  });

  const response = await fetch(
    `${SCHWAB_MARKETDATA_BASE}/quotes?${params.toString()}`,
    {
      headers: authHeaders(accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch quotes: ${response.statusText}`);
  }

  const data: Record<string, RawQuoteEntry> = await response.json();

  return symbols
    .map((sym) => {
      const entry = data[sym];
      if (!entry) return null;
      const q = entry.quote ?? {};
      return {
        symbol: entry.symbol ?? sym,
        description: entry.reference?.description ?? '',
        lastPrice: q.lastPrice ?? 0,
        bid: q.bidPrice ?? 0,
        ask: q.askPrice ?? 0,
        netChange: q.netChange ?? 0,
        netPercentChange: q.netPercentChange ?? 0,
        volume: q.totalVolume ?? 0,
        high: q.highPrice ?? 0,
        low: q.lowPrice ?? 0,
        open: q.openPrice ?? 0,
        previousClose: q.closePrice ?? 0,
      };
    })
    .filter((q): q is SchwabQuote => q !== null);
};
