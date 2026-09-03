/**
 * Small fetch wrapper for the browser.
 *
 * Every API route answers with `{ ok, data }` or `{ ok:false, error }`, so this
 * unwraps that envelope and turns failures into a thrown Error carrying a
 * message that is already safe and friendly to display.
 */
export async function apiFetch<T>(
  url: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};

  const response = await fetch(url, {
    ...rest,
    headers: json ? { 'Content-Type': 'application/json', ...(rest.headers ?? {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an unexpected response. Please try again.');
  }

  if (!response.ok || !payload?.ok) {
    if (response.status === 401) throw new Error('Your session expired. Please sign in again.');
    throw new Error(payload?.error ?? 'Something went wrong. Please try again.');
  }

  return payload.data as T;
}
