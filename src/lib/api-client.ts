/**
 * Typed fetch wrapper with 429 rate-limit detection.
 * Returns a structured result instead of throwing on non-2xx responses.
 */

import type { ApiResult } from "@/types/api";

export type { ApiResult } from "@/types/api";

/**
 * Wrapper around fetch() that detects 429 rate-limited responses
 * and parses Retry-After headers automatically.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, options);

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
      const json = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: json.error ?? "Trop de requêtes",
        status: 429,
        rateLimited: { retryAfterSeconds: isNaN(retryAfter) ? 60 : retryAfter },
      };
    }

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: json.error ?? `Erreur ${res.status}`,
        status: res.status,
      };
    }

    const json = await res.json().catch(() => ({}));
    return {
      ok: true,
      data: (json.data ?? json) as T,
      status: res.status,
    };
  } catch {
    return {
      ok: false,
      error: "Erreur réseau",
      status: 0,
    };
  }
}
