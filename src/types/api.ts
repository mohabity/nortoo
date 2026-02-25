// ── API utility types ──

/** Structured result from apiFetch() wrapper */
export interface ApiResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
  rateLimited?: {
    retryAfterSeconds: number;
  };
}
