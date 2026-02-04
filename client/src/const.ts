export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns OAuth portal login URL if configured; otherwise null.
 * Safe for local dev when env vars are missing.
 */
export const getLoginUrl = (): string | null => {
  if (typeof window === "undefined") return null;

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;

  if (!oauthPortalUrl || !appId) return null;

  try {
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch {
    return null;
  }
};
