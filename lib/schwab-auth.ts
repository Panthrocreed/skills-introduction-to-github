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
  mockOrders,
  MOCK_AUTH_CODE,
} from '@/lib/schwab-mock';

const SCHWAB_OAUTH_BASE = 'https://api.schwabapi.com/v1/oauth';
const SCHWAB_TRADER_BASE = 'https://api.schwabapi.com/trader/v1';
const SCHWAB_MARKETDATA_BASE = 'https://api.schwabapi.com/marketdata/v1';

// ---------- Shared fetch + errors ----------

export class SchwabApiError extends Error {
  status: number;
  body: string;
  url: string;
  correlId: string;

  constructor(opts: {
    message: string;
    status: number;
    body: string;
    url: string;
    correlId: string;
  }) {
    super(opts.message);
    this.name = 'SchwabApiError';
    this.status = opts.status;
    this.body = opts.body;
    this.url = opts.url;
    this.correlId = opts.correlId;
  }
}

function randomCorrelId(): string {
  // RFC 4122-ish; cryptographic uniqueness not required, just traceability
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function schwabFetch(
  url: string,
  init: RequestInit & { label: string }
): Promise<Response> {
  const correlId = randomCorrelId();
  const headers = new Headers(init.headers);
  headers.set('Schwab-Client-CorrelId', correlId);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new SchwabApiError({
      message: `${init.label} failed (${response.status} ${response.statusText})`,
      status: response.status,
      body,
      url,
      correlId,
    });
  }

  return response;
}

const authHeaders = (accessToken: string): Record<string, string> => ({
  Authorization: `Bearer ${accessToken}`,
});

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

  const response = await schwabFetch(`${SCHWAB_OAUTH_BASE}/token`, {
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
    label: 'exchangeCodeForToken',
  });

  return response.json();
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<SchwabTokenResponse> => {
  if (isMockMode()) return mockTokenResponse();

  const response = await schwabFetch(`${SCHWAB_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
    label: 'refreshAccessToken',
  });

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

export const getAccountNumbers = async (
  accessToken: string
): Promise<RawAccountNumberPair[]> => {
  if (isMockMode()) {
    return mockAccounts().map((a) => ({
      accountNumber: a.accountNumber,
      hashValue: a.accountHash,
    }));
  }

  const response = await schwabFetch(`${SCHWAB_TRADER_BASE}/accounts/accountNumbers`, {
    headers: authHeaders(accessToken),
    label: 'getAccountNumbers',
  });
  return response.json();
};

export const getAccounts = async (accessToken: string): Promise<SchwabAccount[]> => {
  if (isMockMode()) return mockAccounts();

  const [numbers, accountsRaw] = await Promise.all([
    getAccountNumbers(accessToken),
    schwabFetch(`${SCHWAB_TRADER_BASE}/accounts`, {
      headers: authHeaders(accessToken),
      label: 'getAccounts',
    }).then((r) => r.json() as Promise<RawAccountResponse[]>),
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

  const response = await schwabFetch(`${SCHWAB_TRADER_BASE}/accounts/${accountHash}`, {
    headers: authHeaders(accessToken),
    label: 'getAccountBalance',
  });

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

  const response = await schwabFetch(
    `${SCHWAB_TRADER_BASE}/accounts/${accountHash}?fields=positions`,
    {
      headers: authHeaders(accessToken),
      label: 'getPositions',
    }
  );

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

// ---------- Orders ----------

export type OrderStatus =
  | 'AWAITING_PARENT_ORDER'
  | 'AWAITING_CONDITION'
  | 'AWAITING_STOP_CONDITION'
  | 'AWAITING_MANUAL_REVIEW'
  | 'ACCEPTED'
  | 'AWAITING_UR_OUT'
  | 'PENDING_ACTIVATION'
  | 'QUEUED'
  | 'WORKING'
  | 'REJECTED'
  | 'PENDING_CANCEL'
  | 'CANCELED'
  | 'PENDING_REPLACE'
  | 'REPLACED'
  | 'FILLED'
  | 'EXPIRED'
  | 'NEW';

export interface SchwabOrder {
  orderId: string;
  symbol: string;
  instruction: 'BUY' | 'SELL' | 'BUY_TO_OPEN' | 'SELL_TO_CLOSE' | string;
  orderType: string;
  status: OrderStatus | string;
  quantity: number;
  filledQuantity: number;
  price: number | null;
  enteredTime: string;
  closeTime: string | null;
}

interface RawOrder {
  orderId?: number | string;
  status?: string;
  orderType?: string;
  quantity?: number;
  filledQuantity?: number;
  price?: number;
  enteredTime?: string;
  closeTime?: string;
  orderLegCollection?: Array<{
    instruction?: string;
    instrument?: { symbol?: string };
  }>;
}

export interface OrdersQuery {
  fromEnteredTime?: string; // ISO
  toEnteredTime?: string; // ISO
  maxResults?: number;
  status?: OrderStatus;
}

export const getOrders = async (
  accessToken: string,
  accountHash: string,
  query: OrdersQuery = {}
): Promise<SchwabOrder[]> => {
  if (isMockMode()) return mockOrders();

  const params = new URLSearchParams();
  if (query.fromEnteredTime) params.set('fromEnteredTime', query.fromEnteredTime);
  if (query.toEnteredTime) params.set('toEnteredTime', query.toEnteredTime);
  if (query.maxResults) params.set('maxResults', String(query.maxResults));
  if (query.status) params.set('status', query.status);

  const url = `${SCHWAB_TRADER_BASE}/accounts/${accountHash}/orders${
    params.toString() ? '?' + params.toString() : ''
  }`;

  const response = await schwabFetch(url, {
    headers: authHeaders(accessToken),
    label: 'getOrders',
  });

  const data: RawOrder[] = await response.json();
  return data.map((o) => {
    const leg = o.orderLegCollection?.[0];
    return {
      orderId: String(o.orderId ?? ''),
      symbol: leg?.instrument?.symbol ?? '',
      instruction: leg?.instruction ?? '',
      orderType: o.orderType ?? '',
      status: (o.status as OrderStatus) ?? 'NEW',
      quantity: o.quantity ?? 0,
      filledQuantity: o.filledQuantity ?? 0,
      price: o.price ?? null,
      enteredTime: o.enteredTime ?? '',
      closeTime: o.closeTime ?? null,
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

  const response = await schwabFetch(
    `${SCHWAB_MARKETDATA_BASE}/pricehistory?${query.toString()}`,
    {
      headers: authHeaders(accessToken),
      label: 'getPriceHistory',
    }
  );

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

  const response = await schwabFetch(
    `${SCHWAB_MARKETDATA_BASE}/quotes?${params.toString()}`,
    {
      headers: authHeaders(accessToken),
      label: 'getQuotes',
    }
  );

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
