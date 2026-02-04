import { isMockMode } from "@/_core/mock/mockMode";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useMemo } from "react";

export type AuthStatus = "disabled" | "authenticated" | "unauthenticated";

export const MOCK_USER_BASE = {
  id: 1,
  openId: "mock-dev-user",
  email: "dev@local",
  loginMethod: "mock",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export function useAuth() {
  const { t } = useLanguage();
  // Dev-only mock mode: usable UI without OAuth/DB.
  if (isMockMode()) {
    return {
      user: { ...MOCK_USER_BASE, name: t("mock.user.name") },
      loading: false,
      status: "authenticated" as AuthStatus,
      error: null,
      isAuthenticated: true,
      login: () => {
        // no-op in mock mode
      },
      logout: () => {
        // no-op in mock mode
      },
      refresh: () => {
        // no-op in mock mode
      },
    };
  }

  // Normal behavior (production / configured dev): use session from backend.
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const login = useCallback(() => {
    const url = getLoginUrl();
    if (!url) {
                  console.warn("OAuth not configured");
      return;
    }
    window.location.assign(url);
  }, []);

  const logout = useCallback(() => {
    try {
      logoutMutation.mutate();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const user = meQuery.data ?? null;
    const isAuthenticated = Boolean(user);
    const isOauthConfigured = Boolean(getLoginUrl());

    return {
      user,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      status: (isAuthenticated
        ? "authenticated"
        : isOauthConfigured
          ? "unauthenticated"
          : "disabled") as AuthStatus,
      isAuthenticated,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  return {
    ...state,
    login,
    logout,
    refresh: () => utils.auth.me.invalidate(),
  };
}
