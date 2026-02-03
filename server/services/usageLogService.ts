/**
 * Usage log service – MongoDB-backed logs.
 * The usageLogs collection is the source of truth for billing/quota (do not rely on Stripe for usage).
 * 1 request = 1 credit. Soft limit (no block). Do not touch Stripe/payment logic.
 * Log failures must not break the API (try/catch, never throw).
 */

import type { Document } from "mongodb";
import { getCollection } from "../db/mongo";

export type UsageLogDocument = {
  projectId: number;
  apiKeyId: number | null;
  success: boolean;
  errorMessage: string | null;
  responseTimeMs: number;
  creditsUsed: number;
  billingMonth: string;
  createdAt: Date;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
};

const COLLECTION = "usageLogs";
let indexEnsured = false;

/** Helper: compute billing month YYYY-MM from date (UTC). */
export function getBillingMonth(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}

async function usageLogsCollection() {
  return getCollection<UsageLogDocument & Document>(COLLECTION);
}

/** Indexes for queries by project and billing month. */
export async function ensureUsageLogsIndexes(): Promise<void> {
  if (indexEnsured) return;
  const col = await usageLogsCollection();
  await col.createIndex({ projectId: 1 });
  await col.createIndex({ billingMonth: 1 });
  await col.createIndex({ projectId: 1, billingMonth: 1 });
  indexEnsured = true;
}

export type LogUsageInput = {
  projectId: number;
  apiKeyId?: number | null;
  success: boolean;
  errorMessage?: string | null;
  responseTimeMs: number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cost?: number | null;
  createdAt?: Date;
};

/**
 * Log one usage event. creditsUsed = 1. billingMonth from current time.
 * Never throws: log failure is caught and only logged to console.
 */
export async function logUsage(input: LogUsageInput): Promise<void> {
  try {
    await ensureUsageLogsIndexes();
    const col = await usageLogsCollection();
    const createdAt = input.createdAt ?? new Date();
    const doc: UsageLogDocument = {
      projectId: input.projectId,
      apiKeyId: input.apiKeyId ?? null,
      success: input.success,
      errorMessage: input.errorMessage ?? null,
      responseTimeMs: input.responseTimeMs ?? 0,
      creditsUsed: 1,
      billingMonth: getBillingMonth(createdAt),
      createdAt,
      endpoint: input.endpoint,
      method: input.method,
      statusCode: input.statusCode,
      inputTokens: input.inputTokens ?? 0,
      outputTokens: input.outputTokens ?? 0,
      cost: input.cost ?? 0,
    };
    await col.insertOne(doc as (UsageLogDocument & Document));
  } catch (e) {
    console.error("[UsageLogService] log failed (request unchanged)", e);
  }
}
