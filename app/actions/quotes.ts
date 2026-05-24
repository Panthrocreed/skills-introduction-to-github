'use server';

import { getQuotes, type SchwabQuote } from '@/lib/schwab-auth';
import { getValidAccessToken } from '@/lib/schwab-session';

export interface QuotesResult {
  quotes: SchwabQuote[];
  error: string | null;
}

export async function fetchQuotes(symbols: string[]): Promise<QuotesResult> {
  try {
    const cleaned = symbols
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    if (cleaned.length === 0) {
      return { quotes: [], error: null };
    }

    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return { quotes: [], error: 'Not authenticated' };
    }

    const quotes = await getQuotes(accessToken, cleaned);
    return { quotes, error: null };
  } catch (err) {
    console.error('fetchQuotes failed:', err);
    return {
      quotes: [],
      error: err instanceof Error ? err.message : 'Failed to fetch quotes',
    };
  }
}
