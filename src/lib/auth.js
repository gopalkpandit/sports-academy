import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'academy_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('JWT_SECRET is not set. Copy .env.example to .env and add a secret.');
  }
  return value;
}

/** Build the JWT payload for a logged in user. */
export function toSessionUser(user) {
  return {
    sub: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    playerId: user.playerId ? String(user.playerId) : null,
  };
}

export function signToken(user) {
  return jwt.sign(toSessionUser(user), secret(), { expiresIn: SESSION_MAX_AGE });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, secret());
    return {
      userId: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      playerId: payload.playerId || null,
    };
  } catch {
    return null;
  }
}

/** Read the current user from the httpOnly cookie. Returns null when signed out. */
export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE,
};
