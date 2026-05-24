'use server';

import {
  getAccounts,
  getAccountBalance,
  getPositions,
  type SchwabAccount,
  type SchwabAccountBalance,
  type SchwabPosition,
} from '@/lib/schwab-auth';
import { getValidAccessToken } from '@/lib/schwab-session';

export interface AccountDataResult {
  account: SchwabAccount | null;
  balance: SchwabAccountBalance | null;
  error: string | null;
}

export async function fetchAccountData(): Promise<AccountDataResult> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { account: null, balance: null, error: 'Not authenticated' };
    }

    const accounts = await getAccounts(accessToken);
    if (accounts.length === 0) {
      return { account: null, balance: null, error: 'No accounts found' };
    }

    const primary = accounts[0];
    const balance = await getAccountBalance(accessToken, primary.accountHash);

    return { account: primary, balance, error: null };
  } catch (err) {
    console.error('fetchAccountData failed:', err);
    return {
      account: null,
      balance: null,
      error: err instanceof Error ? err.message : 'Failed to fetch account data',
    };
  }
}

export interface PositionsResult {
  account: SchwabAccount | null;
  positions: SchwabPosition[];
  error: string | null;
}

export async function fetchPositions(): Promise<PositionsResult> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { account: null, positions: [], error: 'Not authenticated' };
    }

    const accounts = await getAccounts(accessToken);
    if (accounts.length === 0) {
      return { account: null, positions: [], error: 'No accounts found' };
    }

    const primary = accounts[0];
    const positions = await getPositions(accessToken, primary.accountHash);

    return { account: primary, positions, error: null };
  } catch (err) {
    console.error('fetchPositions failed:', err);
    return {
      account: null,
      positions: [],
      error: err instanceof Error ? err.message : 'Failed to fetch positions',
    };
  }
}
