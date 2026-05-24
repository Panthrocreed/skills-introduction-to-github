'use server';

import {
  getAccounts,
  getOrders,
  type SchwabAccount,
  type SchwabOrder,
} from '@/lib/schwab-auth';
import { getValidAccessToken } from '@/lib/schwab-session';

export interface OrdersResult {
  account: SchwabAccount | null;
  orders: SchwabOrder[];
  error: string | null;
}

export async function fetchOrders(): Promise<OrdersResult> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { account: null, orders: [], error: 'Not authenticated' };
    }

    const accounts = await getAccounts(accessToken);
    if (accounts.length === 0) {
      return { account: null, orders: [], error: 'No accounts found' };
    }

    const primary = accounts[0];
    // default to last 30 days
    const toEnteredTime = new Date().toISOString();
    const fromEnteredTime = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const orders = await getOrders(accessToken, primary.accountHash, {
      fromEnteredTime,
      toEnteredTime,
      maxResults: 100,
    });

    return { account: primary, orders, error: null };
  } catch (err) {
    console.error('fetchOrders failed:', err);
    return {
      account: null,
      orders: [],
      error: err instanceof Error ? err.message : 'Failed to fetch orders',
    };
  }
}
