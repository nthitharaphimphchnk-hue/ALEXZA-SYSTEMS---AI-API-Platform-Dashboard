/**
 * Request logging: log errors (5xx) and slow requests.
 * Attach early in the pipeline; does not block.
 */

import type { Request, Response, NextFunction } from "express";

/** Requests slower than this (ms) are logged as slow. */
const SLOW_MS = 5000;

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    if (status >= 500) {
      console.error(
        `[ERROR] ${req.method} ${req.path} ${status} ${duration}ms`
      );
    } else if (duration >= SLOW_MS) {
      console.warn(
        `[SLOW] ${req.method} ${req.path} ${status} ${duration}ms`
      );
    }
  });

  next();
}
