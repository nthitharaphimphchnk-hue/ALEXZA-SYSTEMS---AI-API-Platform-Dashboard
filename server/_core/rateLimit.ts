/**
 * Simple in-memory rate limit per key (e.g. per API key or project).
 * Used for API-key–scoped limits (e.g. 60 req/min). Does not block quota/usage (soft limit only).
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

type WindowState = { count: number; windowStart: number };

const store = new Map<string, WindowState>();

function getKey(id: number): string {
  return String(id);
}

/**
 * Check and consume one request for the given key (e.g. apiKeyId or projectId).
 * Returns true if under limit (request allowed), false if over limit (should return 429).
 */
export function checkRateLimit(keyId: number): boolean {
  const key = getKey(keyId);
  const now = Date.now();
  let state = store.get(key);

  if (!state) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (now - state.windowStart >= WINDOW_MS) {
    state = { count: 1, windowStart: now };
    store.set(key, state);
    return true;
  }

  if (state.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  state.count += 1;
  return true;
}

export const RATE_LIMIT_MAX_PER_MINUTE = MAX_REQUESTS_PER_WINDOW;
