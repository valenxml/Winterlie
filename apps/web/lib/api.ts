export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Temporary dev identity until real auth exists. Matches the API's
 * AUTH_DEV_BYPASS mode. Never set this in a production build.
 */
const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? "";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-dev-user-id": DEV_USER_ID,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(body || `Request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}
