'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const WATCHLIST_COOKIE = 'nova_watchlist';
const DEFAULT_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA'];

export async function getWatchlist(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WATCHLIST_COOKIE)?.value;
  if (!raw) return DEFAULT_SYMBOLS;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((s): s is string => typeof s === 'string');
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_SYMBOLS;
}

async function writeWatchlist(symbols: string[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WATCHLIST_COOKIE, JSON.stringify(symbols), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function addToWatchlist(formData: FormData): Promise<void> {
  const symbol = String(formData.get('symbol') ?? '').trim().toUpperCase();
  if (!symbol) return;

  const current = await getWatchlist();
  if (current.includes(symbol)) {
    revalidatePath('/dashboard/quotes');
    return;
  }

  await writeWatchlist([...current, symbol]);
  revalidatePath('/dashboard/quotes');
}

export async function removeFromWatchlist(formData: FormData): Promise<void> {
  const symbol = String(formData.get('symbol') ?? '').trim().toUpperCase();
  if (!symbol) return;

  const current = await getWatchlist();
  await writeWatchlist(current.filter((s) => s !== symbol));
  revalidatePath('/dashboard/quotes');
}
