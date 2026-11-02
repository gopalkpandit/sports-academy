import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { route, badRequest, HttpError } from '@/lib/http.js';
import { connectDB } from '@/lib/db.js';
import { assertConfigured, withDatabase } from '@/lib/env.js';
import { signToken, toSessionUser, cookieOptions, COOKIE_NAME } from '@/lib/auth.js';
import { homeForRole, ROLES } from '@/lib/rbac.js';
import User from '@/lib/models/User.js';
import Player from '@/lib/models/Player.js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = route(async (request) => {
  assertConfigured();
  const parsed = await request.json().catch(() => ({}));
  const body = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = String(body.role || '');

  if (!name || name.length > 80) {
    throw badRequest('Enter a name between 1 and 80 characters.', 'INVALID_NAME');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest('Enter a valid email address.', 'INVALID_EMAIL');
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw badRequest('Password must be at least 8 characters and no more than 72 bytes.', 'INVALID_PASSWORD');
  }
  if (![ROLES.COACH, ROLES.PLAYER, ROLES.SCOUT].includes(role)) {
    throw badRequest('Choose a valid account role.', 'INVALID_ROLE');
  }

  let age;
  let sport;
  if (role === ROLES.PLAYER) {
    age = Number(body.age);
    sport = String(body.sport || '').trim();
    if (!Number.isInteger(age) || age < 5 || age > 90) {
      throw badRequest('Age must be a whole number between 5 and 90.', 'INVALID_AGE');
    }
    if (!sport || sport.length > 40) {
      throw badRequest('Enter a sport between 1 and 40 characters.', 'INVALID_SPORT');
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await withDatabase(async () => {
    await connectDB();
    const session = await mongoose.startSession();
    let createdUser;
    try {
      await session.withTransaction(async () => {
        let playerId = null;
        if (role === ROLES.PLAYER) {
          const [player] = await Player.create([{ name, age, sport }], { session });
          playerId = player._id;
        }
        [createdUser] = await User.create(
          [{ name, email, passwordHash, role, playerId }],
          { session }
        );
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new HttpError(409, 'EMAIL_EXISTS', 'An account with this email already exists.');
      }
      throw error;
    } finally {
      await session.endSession();
    }
    return createdUser;
  });

  const response = NextResponse.json(
    { ok: true, data: { user: toSessionUser(user), redirectTo: homeForRole(user.role) } },
    { status: 201 }
  );
  response.cookies.set(COOKIE_NAME, signToken(user), cookieOptions);
  return response;
});
