import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const unauthorized = (message = 'Please log in to continue.') =>
  new HttpError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'You do not have access to this resource.') =>
  new HttpError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Not found.') => new HttpError(404, 'NOT_FOUND', message);

export const badRequest = (message, code = 'BAD_REQUEST') => new HttpError(400, code, message);

export function ok(data, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(status, code, message) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

/** Wrap a route handler so thrown HttpErrors become clean JSON responses. */
export function route(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return fail(error.status, error.code, error.message);
      }
      console.error('[api]', error);
      return fail(500, 'SERVER_ERROR', 'Something went wrong on the server.');
    }
  };
}
