import { getSessionUser } from './auth.js';
import { unauthorized, forbidden } from './http.js';
import { ROLES } from './rbac.js';
import { assertConfigured } from './env.js';

/**
 * Server side gate for API routes. Hiding a button in the UI is never enough:
 * every protected route calls this before touching data.
 */
export async function requireUser(roles) {
  // A missing MONGODB_URI or JWT_SECRET should read as a config problem,
  // not as "something went wrong on the server".
  assertConfigured();

  const user = await getSessionUser();
  if (!user) throw unauthorized('Please log in to continue.');
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    throw forbidden(`This action is only available to: ${roles.join(', ')}.`);
  }
  return user;
}

export const requireCoach = () => requireUser([ROLES.COACH]);
export const requireCoachOrScout = () => requireUser([ROLES.COACH, ROLES.SCOUT]);
