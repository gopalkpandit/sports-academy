import { HttpError } from './http.js';

/**
 * Configuration check.
 *
 * The most common reason a fresh install shows "Something went wrong on the
 * server" is a missing environment variable. Instead of a generic 500 we say
 * exactly what is missing and how to fix it.
 */
export function configProblems() {
  const problems = [];

  if (!process.env.MONGODB_URI) {
    problems.push(
      'MONGODB_URI is not set. Copy .env.example to .env and paste your MongoDB Atlas connection string.'
    );
  }
  if (!process.env.JWT_SECRET) {
    problems.push('JWT_SECRET is not set. Add a long random string to .env.');
  }

  return problems;
}

export function assertConfigured() {
  const problems = configProblems();
  if (problems.length > 0) {
    throw new HttpError(500, 'CONFIG_MISSING', problems.join(' '));
  }
}

/** Wrap a database call so connection failures read as a clear 503. */
export async function withDatabase(action) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof HttpError) throw error;

    const message = String(error?.message || error);
    const isConnectionProblem =
      /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|server selection|Could not connect|authentication failed|bad auth|getaddrinfo/i.test(
        message
      );

    if (isConnectionProblem) {
      throw new HttpError(
        503,
        'DATABASE_UNAVAILABLE',
        'Cannot reach the database. Check that MONGODB_URI in .env is correct and that MongoDB Atlas allows connections from this machine (Network Access → 0.0.0.0/0). Details: ' +
          message
      );
    }
    throw error;
  }
}
