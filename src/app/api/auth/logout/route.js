import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ ok: true, data: { signedOut: true } });
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}
