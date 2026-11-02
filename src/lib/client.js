'use client';

/** Small fetch wrapper used by the client forms. Throws readable errors. */
export async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.ok === false) {
    const message = payload?.error?.message || `Request failed (${response.status}).`;
    const error = new Error(message);
    error.code = payload?.error?.code || 'REQUEST_FAILED';
    throw error;
  }

  return payload.data;
}
