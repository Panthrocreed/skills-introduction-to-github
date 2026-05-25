'use server';

import {
  SchwabApiError,
  getAccountNumbers,
  getAccounts,
  getAccountBalance,
  getPositions,
  getOrders,
  getQuotes,
  getPriceHistory,
} from '@/lib/schwab-auth';
import { getValidAccessToken } from '@/lib/schwab-session';
import { isMockMode } from '@/lib/schwab-mock';

export interface ApiCheckEntry {
  name: string;
  endpoint: string;
  ok: boolean;
  durationMs: number;
  status: number | null;
  correlId: string | null;
  message: string;
  body: string | null;
  result: unknown;
}

export interface ApiCheckResult {
  mock: boolean;
  authenticated: boolean;
  checks: ApiCheckEntry[];
  fatal: string | null;
}

async function runCheck<T>(
  name: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<ApiCheckEntry> {
  const start = performance.now();
  try {
    const result = await fn();
    return {
      name,
      endpoint,
      ok: true,
      durationMs: Math.round(performance.now() - start),
      status: 200,
      correlId: null,
      message: 'ok',
      body: null,
      result,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    if (err instanceof SchwabApiError) {
      return {
        name,
        endpoint,
        ok: false,
        durationMs,
        status: err.status,
        correlId: err.correlId,
        message: err.message,
        body: err.body,
        result: null,
      };
    }
    return {
      name,
      endpoint,
      ok: false,
      durationMs,
      status: null,
      correlId: null,
      message: err instanceof Error ? err.message : String(err),
      body: null,
      result: null,
    };
  }
}

export async function runApiCheck(): Promise<ApiCheckResult> {
  const mock = isMockMode();
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    return {
      mock,
      authenticated: false,
      checks: [],
      fatal: 'Not authenticated. Connect a Schwab account first.',
    };
  }

  const checks: ApiCheckEntry[] = [];

  const accountNumbersEntry = await runCheck(
    'Account numbers',
    'GET /trader/v1/accounts/accountNumbers',
    () => getAccountNumbers(accessToken)
  );
  checks.push(accountNumbersEntry);

  const accountsEntry = await runCheck(
    'Accounts',
    'GET /trader/v1/accounts',
    () => getAccounts(accessToken)
  );
  checks.push(accountsEntry);

  const accounts = (accountsEntry.result as Awaited<ReturnType<typeof getAccounts>>) ?? [];
  const primaryHash = accounts[0]?.accountHash;

  if (primaryHash) {
    checks.push(
      await runCheck(
        'Account balance',
        `GET /trader/v1/accounts/${shortHash(primaryHash)}`,
        () => getAccountBalance(accessToken, primaryHash)
      )
    );
    checks.push(
      await runCheck(
        'Positions',
        `GET /trader/v1/accounts/${shortHash(primaryHash)}?fields=positions`,
        () => getPositions(accessToken, primaryHash)
      )
    );
    checks.push(
      await runCheck(
        'Orders (last 30d)',
        `GET /trader/v1/accounts/${shortHash(primaryHash)}/orders`,
        () =>
          getOrders(accessToken, primaryHash, {
            fromEnteredTime: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            toEnteredTime: new Date().toISOString(),
            maxResults: 25,
          })
      )
    );
  } else {
    checks.push({
      name: 'Account-scoped calls',
      endpoint: '—',
      ok: false,
      durationMs: 0,
      status: null,
      correlId: null,
      message: 'Skipped: no account hash available',
      body: null,
      result: null,
    });
  }

  checks.push(
    await runCheck(
      'Quotes (SPY, AAPL)',
      'GET /marketdata/v1/quotes?symbols=SPY,AAPL',
      () => getQuotes(accessToken, ['SPY', 'AAPL'])
    )
  );

  checks.push(
    await runCheck(
      'Price history (SPY)',
      'GET /marketdata/v1/pricehistory?symbol=SPY',
      () =>
        getPriceHistory(accessToken, 'SPY', {
          periodType: 'day',
          period: 5,
          frequencyType: 'minute',
          frequency: 30,
        })
    )
  );

  return { mock, authenticated: true, checks, fatal: null };
}

function shortHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
