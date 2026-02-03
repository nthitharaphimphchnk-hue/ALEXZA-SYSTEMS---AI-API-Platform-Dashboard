// 🚧 OAuth TEMPORARILY DISABLED – no getLoginUrl() / new URL() to avoid invalid URL crash
export type AuthStatus = "disabled" | "authenticated" | "unauthenticated";

export const MOCK_USER = {
  id: 1,
  openId: "mock-dev-user",
  name: "Dev User",
  email: "dev@localhost",
  loginMethod: "mock",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export function useAuth() {
  return {
    user: null,
    loading: false,
    status: "disabled" as AuthStatus,
    error: null,
    isAuthenticated: false,
    login: () => {
      console.warn("OAuth disabled");
    },
    logout: () => {},
    refresh: () => {},
  };
}
