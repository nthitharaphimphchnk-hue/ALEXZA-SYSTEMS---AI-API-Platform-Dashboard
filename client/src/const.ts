export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Returns null when OAuth is not configured or URL is invalid — no throw, no invalid new URL().
export const getLoginUrl = (): string | null => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  if (typeof oauthPortalUrl !== "string" || !oauthPortalUrl.trim()) {
    return null;
  }
  const base = oauthPortalUrl.trim();
  const appId = import.meta.env.VITE_APP_ID ?? "";
  if (typeof window === "undefined") return null;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL("/app-auth", base);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch {
    return null;
  }
};
