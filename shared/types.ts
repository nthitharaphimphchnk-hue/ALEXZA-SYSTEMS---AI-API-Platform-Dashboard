/**
 * Unified type exports
 * Import shared types from this single entry point.
 *
 * Note: Drizzle/SQL types have been removed in favour of MongoDB-backed
 * domain types defined in server/db.ts. This file now only re-exports
 * shared error types.
 */

export * from "./_core/errors";
