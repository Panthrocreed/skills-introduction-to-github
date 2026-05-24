// Token session management — read/write Schwab tokens stored in cookies
// and handle proactive refresh.
//
// Cookies:
//   schwab_access_token        httpOnly  access token bearer
//   schwab_refresh_token       httpOnly  long-lived refresh token (~7 days)
//   schwab_token_expires_at    httpOnly  ms timestamp of access token expiry
//
// cookies().set() is only valid from Server Actions or Route Handlers; the
// `setSchwabTokens` helper assumes it is being called from one of those.

import 'server-only';
import { cookies } from 'next/headers';
import {
  refreshAccessToken,
  type SchwabTokenResponse,
} from '@/lib/schwab-auth';

const ACCESS_COOKIE = 'schwab_access_token';
const REFRESH_COOKIE = 'schwab_refresh_token';
const EXPIRES_COOKIE = 'schwab_token_expires_at';

// Refresh slightly before the token actually expires so an in-flight request
// is never rejected mid-flight.
const REFRESH_BUFFER_MS = 60_000;

const isProd = process.env.NODE_ENV === 'production';

export interface SchwabSession {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

export async function setSchwabTokens(token: SchwabTokenResponse): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + token.expires_in * 1000;

  cookieStore.set(ACCESS_COOKIE, token.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: token.expires_in,
  });

  cookieStore.set(EXPIRES_COOKIE, String(expiresAt), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: token.expires_in,
  });

  if (token.refresh_token) {
    cookieStore.set(REFRESH_COOKIE, token.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      // Schwab refresh tokens last 7 days
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}

export async function clearSchwabTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(EXPIRES_COOKIE);
}

export async function readSchwabSession(): Promise<SchwabSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value ?? null;
  const expiresAtRaw = cookieStore.get(EXPIRES_COOKIE)?.value;
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;

  return { accessToken, refreshToken, expiresAt };
}

// Returns a valid access token, refreshing if needed. Call only from
// Server Actions or Route Handlers — `setSchwabTokens` writes cookies.
export async function getValidAccessToken(): Promise<string | null> {
  const session = await readSchwabSession();
  if (!session) return null;

  const needsRefresh =
    !session.expiresAt || session.expiresAt - REFRESH_BUFFER_MS < Date.now();

  if (!needsRefresh) return session.accessToken;

  if (!session.refreshToken) {
    await clearSchwabTokens();
    return null;
  }

  try {
    const refreshed = await refreshAccessToken(session.refreshToken);
    await setSchwabTokens(refreshed);
    return refreshed.access_token;
  } catch (err) {
    console.error('Token refresh failed:', err);
    await clearSchwabTokens();
    return null;
  }
}
