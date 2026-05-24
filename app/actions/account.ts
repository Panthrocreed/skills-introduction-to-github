'use server';

import { cookies } from 'next/headers';
import { getAccounts, getAccountBalance } from '@/lib/schwab-auth';

export async function fetchAccountData() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('schwab_access_token')?.value;

    if (!accessToken) {
      return { error: 'No access token found. Please log in.' };
    }

    // Fetch accounts
    const accounts = await getAccounts(accessToken);

    if (!accounts || accounts.length === 0) {
      return { error: 'No accounts found' };
    }

    // For MVP, just get the first account's balance
    const primaryAccount = accounts[0];
    const balance = await getAccountBalance(accessToken, primaryAccount.accountNumber);

    return {
      account: primaryAccount,
      balance,
      error: null,
    };
  } catch (error) {
    console.error('Failed to fetch account data:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch account data',
    };
  }
}
