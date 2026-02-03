/**
 * Billing calculator - credit-based model, configurable in code.
 * Source of truth: MongoDB usageLogs. 1 API request = 1 credit (initial rule).
 */

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
export function calculateCreditsFromUsage(usageCount: number): number {
  return usageCount * BILLING_CONFIG.CREDITS_PER_REQUEST;
}

// ---------------------------------------------------------------------------
// Project usage & quota (async, usageLogs as source of truth)
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
 * Uses usageLogs as source of truth and a simple free plan (no Stripe).
 */
export async function getProjectUsageSummary(
  projectId: number
): Promise<UsageSummary | null> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const logs = await db.getUsageLogsForProjectInPeriod(
    projectId,
    periodStart,
    periodEnd
  );
  const creditsUsed = calculateCreditsFromUsage(logs.length);

  return {
    creditsUsed,
    periodStart,
    periodEnd,
    quota: BILLING_CONFIG.FREE_TRIAL_CREDITS,
    planName: "free",
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
  } else if (
    quota > 0 &&
    creditsUsed >= quota * BILLING_CONFIG.NEARING_LIMIT_THRESHOLD
  ) {
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
export async function getBillingPreview(
  projectId: number
): Promise<BillingPreview | null> {
  const quotaStatus = await getQuotaStatus(projectId);
  if (!quotaStatus) return null;

  const creditsRemaining = Math.max(
    0,
    quotaStatus.quota - quotaStatus.creditsUsed
  );

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
