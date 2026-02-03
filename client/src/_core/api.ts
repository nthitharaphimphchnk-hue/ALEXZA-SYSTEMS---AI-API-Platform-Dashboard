/**
 * API base URL for backend (tRPC).
 * - Local dev: fallback http://localhost:3000 (backend default port).
 * - Production (e.g. front on Render/CDN, backend on Render): set VITE_API_BASE_URL to backend URL.
 * Do not hardcode backend URL in repo.
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:3000";
