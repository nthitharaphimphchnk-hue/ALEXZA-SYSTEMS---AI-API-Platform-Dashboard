import { API_BASE_URL } from "@/_core/api";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { LanguageProvider } from "./contexts/LanguageContext";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  const loginUrl = getLoginUrl();
  if (loginUrl) window.location.href = loginUrl;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// Umami analytics fully disabled to fix invalid URL (no code calls new URL from VITE_ANALYTICS_*)
// const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
// const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
// if (typeof analyticsEndpoint === "string" && analyticsEndpoint && typeof analyticsWebsiteId === "string" && analyticsWebsiteId) {
//   const script = document.createElement("script");
//   script.src = `${analyticsEndpoint}/umami`;
//   script.dataset.websiteId = analyticsWebsiteId;
//   script.defer = true;
//   document.head.appendChild(script);
// }

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
