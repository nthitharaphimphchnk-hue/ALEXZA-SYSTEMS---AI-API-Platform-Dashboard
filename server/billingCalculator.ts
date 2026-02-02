/**
 * Billing calculator - credit-based model, configurable in code.
 * Source of truth: usage_logs. 1 API request = 1 credit (initial rule).
 */

import type { UsageLog } from "../drizzle/schema";
import * as db from "./db";

// ---------------------------------------------------------------------------
// Config (change here, not in DB)
// ---------------------------------------------------------------------------

export const BILLING_CONFIG = {
  /** Credits per API request (initial rule). */
  CREDITS_PER_REQUEST: 1,
  /** Free trial credits per project per month (default plan). */
  FREE_TRIAL_CREDITS: 1000,
  /** Threshold (0–1): above this ratio of used/quota = "nearing_limit". */
  NEARING_LIMIT_THRESHOLD: 0.8,
} as const;

// ---------------------------------------------------------------------------
// Pure credit logic (easy to change later)
// ---------------------------------------------------------------------------

/**
 * Calculate total credits from usage logs.
 * Isolated so pricing rules can change without touching DB or routers.
 */
export function calculateCreditsFromUsage(usageLogs: UsageLog[]): number {
  return usageLogs.length * BILLING_CONFIG.CREDITS_PER_REQUEST;
}

// ---------------------------------------------------------------------------
// Project usage & quota (async, use DB)
// ---------------------------------------------------------------------------

export type UsageSummary = {
  creditsUsed: number;
  periodStart: Date;
  periodEnd: Date;
  quota: number;
  planName: string;
};

/**
 * Get usage summary for a project in its current billing period.
 * Uses usage_logs as source of truth.
 */
export async function getProjectUsageSummary(projectId: number): Promise<UsageSummary | null> {
  const pb = await db.getOrCreateProjectBilling(projectId);
  if (!pb) return null;

  const plan = await db.getBillingPlanById(pb.planId);
  if (!plan) return null;

  const logs = await db.getUsageLogsForProjectInPeriod(
    projectId,
    new Date(pb.currentPeriodStart),
    new Date(pb.currentPeriodEnd)
  );
  const creditsUsed = calculateCreditsFromUsage(logs);

  return {
    creditsUsed,
    periodStart: new Date(pb.currentPeriodStart),
    periodEnd: new Date(pb.currentPeriodEnd),
    quota: plan.monthlyCreditQuota,
    planName: plan.name,
  };
}

export type QuotaStatus = "normal" | "nearing_limit" | "over_quota";

/**
 * Get quota status for a project (soft limit: allow usage when over_quota).
 */
export async function getQuotaStatus(projectId: number): Promise<{
  status: QuotaStatus;
  creditsUsed: number;
  quota: number;
  periodStart: Date;
  periodEnd: Date;
  planName: string;
} | null> {
  const summary = await getProjectUsageSummary(projectId);
  if (!summary) return null;

  const { creditsUsed, quota, periodStart, periodEnd, planName } = summary;
  let status: QuotaStatus = "normal";
  if (creditsUsed >= quota) {
    status = "over_quota";
  } else if (quota > 0 && creditsUsed >= quota * BILLING_CONFIG.NEARING_LIMIT_THRESHOLD) {
    status = "nearing_limit";
  }

  return {
    status,
    creditsUsed,
    quota,
    periodStart,
    periodEnd,
    planName,
  };
}

export type BillingPreview = {
  creditsUsed: number;
  creditsRemaining: number;
  quota: number;
  status: QuotaStatus;
  periodStart: Date;
  periodEnd: Date;
  planName: string;
};

/**
 * Get billing preview for a project (usage + quota in one).
 */
export async function getBillingPreview(projectId: number): Promise<BillingPreview | null> {
  const quotaStatus = await getQuotaStatus(projectId);
  if (!quotaStatus) return null;

  const creditsRemaining = Math.max(0, quotaStatus.quota - quotaStatus.creditsUsed);

  return {
    creditsUsed: quotaStatus.creditsUsed,
    creditsRemaining,
    quota: quotaStatus.quota,
    status: quotaStatus.status,
    periodStart: quotaStatus.periodStart,
    periodEnd: quotaStatus.periodEnd,
    planName: quotaStatus.planName,
  };
}
