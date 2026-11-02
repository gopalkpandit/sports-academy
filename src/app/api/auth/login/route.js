import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.js';
import User from '@/lib/models/User.js';
import { signToken, toSessionUser, cookieOptions, COOKIE_NAME } from '@/lib/auth.js';
import { route, badRequest } from '@/lib/http.js';
import { homeForRole } from '@/lib/rbac.js';
import { assertConfigured, withDatabase } from '@/lib/env.js';

export const dynamic = 'force-dynamic';

export const POST = route(async (request) => {
  // Say exactly what is missing instead of a generic server error.
  assertConfigured();

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    throw badRequest('Email and password are required.', 'CREDENTIALS_REQUIRED');
  }

  const user = await withDatabase(async () => {
    await connectDB();

    const total = await User.estimatedDocumentCount();
    if (total === 0) {
      throw badRequest(
        'There are no accounts yet. Create an account to get started.',
        'NO_ACCOUNTS'
      );
    }

    return User.findOne({ email });
  });

  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    throw badRequest(
      'Incorrect email or password.',
      'INVALID_CREDENTIALS'
    );
  }

  const token = signToken(user);
  const response = NextResponse.json({
    ok: true,
    data: {
      user: toSessionUser(user),
      redirectTo: homeForRole(user.role),
    },
  });
  response.cookies.set(COOKIE_NAME, token, cookieOptions);
  return response;
});
