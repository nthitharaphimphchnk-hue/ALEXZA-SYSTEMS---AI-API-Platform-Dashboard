/**
 * API Key auth: read Authorization: Bearer <key>, validate against apiKeys, attach projectId/apiKeyId.
 * Use on routes that accept API key. Invalid or missing key → 401. Never log the key.
 */

import type { Request, Response, NextFunction } from "express";
import * as apiKeyService from "../services/apiKeyService";

export type ApiKeyAuthContext = {
  projectId: number;
  apiKeyId: number;
};

declare global {
  namespace Express {
    interface Request {
      apiKeyAuth?: ApiKeyAuthContext;
    }
  }
}

/**
 * Middleware: parse Bearer token, resolve to projectId + apiKeyId, set req.apiKeyAuth.
 * If Authorization header present but key invalid or revoked → 401.
 * If no Authorization header → next() (so routes can combine with session auth).
 */
export function withApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    next();
    return;
  }

  apiKeyService.findProjectIdByKey(token).then(
    (resolved) => {
      if (!resolved) {
        res.status(401).json({ error: "Invalid or revoked API key" });
        return;
      }
      req.apiKeyAuth = { projectId: resolved.projectId, apiKeyId: resolved.apiKeyId };
      next();
    },
    (err) => {
      console.error("[ApiKeyAuth]", err);
      res.status(500).json({ error: "Authentication error" });
    }
  );
}

/**
 * Require API key: if req.apiKeyAuth not set (e.g. no Bearer or invalid), send 401.
 * Call after withApiKeyAuth when the route must have a valid API key.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (!req.apiKeyAuth) {
    res.status(401).json({ error: "Missing or invalid API key" });
    return;
  }
  next();
}
