/**
 * Billing service – usage & quota from MongoDB usageLogs.
 * Preview only: no real charges, no Stripe, no invoices, no email. Do not block API.
 * Source of truth: usageLogs collection. Free trial: 1000 credits/month, soft limit.
 */

import type { Document } from "mongodb";
import { getCollection } from "../db/mongo";
import { getBillingMonth } from "./usageLogService";
import * as planService from "./planService";

const COLLECTION = "usageLogs";
const DEFAULT_QUOTA = 1000;
/** When usedCredits / quota >= this, status = nearing_limit (e.g. 0.8 = 80%). */
const NEARING_LIMIT_THRESHOLD = 0.8;

type UsageLogDoc = {
  projectId: number;
  billingMonth: string;
  creditsUsed: number;
  success: boolean;
};

async function usageLogsCol() {
  return getCollection<UsageLogDoc & Document>(COLLECTION);
}

export type MonthlyUsage = {
  billingMonth: string;
  creditsUsed: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
};

/**
 * Get monthly usage for a project from usageLogs (MongoDB aggregation).
 * Used for billing preview only – no real billing/charges.
 */
export async function getMonthlyUsage(params: {
  projectId: number;
  billingMonth: string;
}): Promise<MonthlyUsage> {
  const { projectId, billingMonth } = params;
  const col = await usageLogsCol();

  const [result] = await col
    .aggregate<{
      _id: null;
      creditsUsed: number;
      requestCount: number;
      successCount: number;
      errorCount: number;
    }>([
      { $match: { projectId, billingMonth } },
      {
        $group: {
          _id: null,
          creditsUsed: { $sum: "$creditsUsed" },
          requestCount: { $sum: 1 },
          successCount: { $sum: { $cond: ["$success", 1, 0] } },
          errorCount: { $sum: { $cond: ["$success", 0, 1] } },
        },
      },
    ])
    .toArray();

  if (!result) {
    return {
      billingMonth,
      creditsUsed: 0,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
    };
  }

  return {
    billingMonth,
    creditsUsed: result.creditsUsed,
    requestCount: result.requestCount,
    successCount: result.successCount,
    errorCount: result.errorCount,
  };
}

export type QuotaStatusType = "normal" | "nearing_limit" | "over_quota";

export type QuotaStatusResult = {
  usedCredits: number;
  quota: number;
  percentUsed: number;
  status: QuotaStatusType;
  billingMonth: string;
  periodStart: Date;
  periodEnd: Date;
};

/**
 * Compute quota status from used vs quota (helper for reuse).
 * normal: under 80%; nearing_limit: 80% up to 100%; over_quota: over 100%.
 */
export function computeQuotaStatus(
  usedCredits: number,
  quota: number = DEFAULT_QUOTA
): { percentUsed: number; status: QuotaStatusType } {
  const percentUsed = quota > 0 ? Math.min((usedCredits / quota) * 100, 100) : 0;
  let status: QuotaStatusType = "normal";
  if (usedCredits > quota) {
    status = "over_quota";
  } else if (quota > 0 && usedCredits >= quota * NEARING_LIMIT_THRESHOLD) {
    status = "nearing_limit";
  }
  return { percentUsed, status };
}

/**
 * Get quota status for a project in a billing month.
 * Quota comes from project's plan (billingPlans.monthlyCredits) when planId given; else default.
 * Billing preview only – no real charges; soft limit (no block).
 */
export async function getQuotaStatus(params: {
  projectId: number;
  billingMonth?: string;
  planId?: string | null;
}): Promise<QuotaStatusResult | null> {
  const billingMonth = params.billingMonth ?? getBillingMonth(new Date());
  const usage = await getMonthlyUsage({ projectId: params.projectId, billingMonth });

  let quota = DEFAULT_QUOTA;
  if (params.planId) {
    const plan = await planService.getPlanById(params.planId);
    if (plan && plan.monthlyCredits > 0) {
      quota = plan.monthlyCredits;
    }
  }

  const [y, mo] = billingMonth.split("-").map(Number);
  const periodStart = new Date(Date.UTC(y, mo - 1, 1));
  const periodEnd = new Date(Date.UTC(y, mo, 0, 23, 59, 59, 999));

  const { percentUsed, status } = computeQuotaStatus(usage.creditsUsed, quota);

  return {
    usedCredits: usage.creditsUsed,
    quota,
    percentUsed,
    status,
    billingMonth,
    periodStart,
    periodEnd,
  };
}
