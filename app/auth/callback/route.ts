import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/schwab-auth';
import { setSchwabTokens } from '@/lib/schwab-session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', request.url)
    );
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    await setSchwabTokens(tokenData);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err) {
    console.error('Token exchange failed:', err);
    return NextResponse.redirect(
      new URL('/login?error=token_exchange_failed', request.url)
    );
  }
}
