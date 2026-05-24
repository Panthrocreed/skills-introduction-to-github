import { NextResponse } from 'next/server';
import { clearSchwabTokens } from '@/lib/schwab-session';

export async function GET(request: Request) {
  await clearSchwabTokens();
  return NextResponse.redirect(new URL('/login', request.url));
}
