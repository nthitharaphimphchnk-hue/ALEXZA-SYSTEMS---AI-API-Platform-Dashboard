/**
 * Middleware index – auth vs API key (clearly separated).
 *
 * Auth (session):
 *   - createContext (context.ts) resolves session → user.
 *   - protectedProcedure / adminProcedure (_core/trpc.ts) require ctx.user / admin role.
 *   - Used for /api/trpc (tRPC) only.
 *
 * API key:
 *   - withApiKeyAuth: parse Bearer token, resolve to projectId + apiKeyId, set req.apiKeyAuth.
 *   - requireApiKey: send 401 if req.apiKeyAuth not set.
 *   - Use on Express routes that accept API key (e.g. external HTTP API).
 *
 * Rate limit: see _core/rateLimit.ts (per-key, used inside procedures; does not block quota).
 * Request logging: see _core/requestLogger.ts (error + slow request).
 */

export { withApiKeyAuth, requireApiKey } from "../apiKeyAuth";
export type { ApiKeyAuthContext } from "../apiKeyAuth";
