import { getLoginUrl } from "@/const";

/**
 * Mock Mode is enabled only in local development when OAuth isn't configured.
 * - DEV only (never in production builds)
 * - OAuth not configured (getLoginUrl() returns null)
 */
export function isMockMode(): boolean {
  return import.meta.env.DEV && getLoginUrl() === null;
}

