import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/schwab-auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors from Schwab
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Handle missing authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', request.url)
    );
  }

  try {
    // Exchange auth code for access token
    const tokenData = await exchangeCodeForToken(code);

    // Redirect to dashboard and store token in memory (for now)
    // In production, you'd store this securely (database, secure cookies, etc.)
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // Store token in secure httpOnly cookie (optional enhancement)
    response.cookies.set({
      name: 'schwab_access_token',
      value: tokenData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
    });

    if (tokenData.refresh_token) {
      response.cookies.set({
        name: 'schwab_refresh_token',
        value: tokenData.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Token exchange failed:', error);
    return NextResponse.redirect(
      new URL('/login?error=token_exchange_failed', request.url)
    );
  }
}
