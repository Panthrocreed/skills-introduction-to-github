'use server';

import {
  getQuotes,
  getPriceHistory,
  type SchwabQuote,
  type SchwabCandle,
  type PriceHistoryParams,
} from '@/lib/schwab-auth';
import { getValidAccessToken } from '@/lib/schwab-session';

export interface QuotesResult {
  quotes: SchwabQuote[];
  error: string | null;
}

export interface PriceHistoryResult {
  candles: SchwabCandle[];
  error: string | null;
}

export async function fetchPriceHistory(
  symbol: string,
  params: PriceHistoryParams = {}
): Promise<PriceHistoryResult> {
  try {
    const cleaned = symbol.trim().toUpperCase();
    if (!cleaned) return { candles: [], error: 'Symbol required' };

    const accessToken = await getValidAccessToken();
    if (!accessToken) return { candles: [], error: 'Not authenticated' };

    const candles = await getPriceHistory(accessToken, cleaned, params);
    return { candles, error: null };
  } catch (err) {
    console.error('fetchPriceHistory failed:', err);
    return {
      candles: [],
      error: err instanceof Error ? err.message : 'Failed to fetch price history',
    };
  }
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
