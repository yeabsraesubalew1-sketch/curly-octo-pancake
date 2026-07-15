/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const TOKEN_KEY = "edusched_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("load failed")
  );
}

function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // In dev, Vite proxy can briefly reset/refuse while server restarts.
  // Retry only read requests to avoid duplicating writes.
  const canRetry = method === "GET";
  const maxAttempts = canRetry ? 3 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(`/api${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // no JSON body (e.g. 204)
      }

      if (!res.ok) {
        if (canRetry && isRetryableStatus(res.status) && attempt < maxAttempts) {
          await sleep(200 * attempt);
          continue;
        }

        const message = data?.error || `Request failed with status ${res.status}`;
        throw new ApiError(message, res.status);
      }

      return data as T;
    } catch (err) {
      if (canRetry && isTransientNetworkError(err) && attempt < maxAttempts) {
        await sleep(200 * attempt);
        continue;
      }

      throw err;
    }
  }

  throw new ApiError("Request failed after retrying.", 0);
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>("GET", path, undefined, auth),
  post: <T>(path: string, body?: unknown, auth = true) => request<T>("POST", path, body, auth),
  put: <T>(path: string, body?: unknown, auth = true) => request<T>("PUT", path, body, auth),
  delete: <T>(path: string, auth = true) => request<T>("DELETE", path, undefined, auth)
};
