import { NextResponse } from 'next/server';

export function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));

  // Clear auth cookies
  response.cookies.delete('schwab_access_token');
  response.cookies.delete('schwab_refresh_token');

  return response;
}
