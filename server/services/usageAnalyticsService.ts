/**
 * Usage analytics – daily and hourly aggregates from MongoDB usageLogs.
 * For Usage Dashboard only. Do not touch billing / Stripe / payment.
 */

import type { Document } from "mongodb";
import { getCollection } from "../db/mongo";

type UsageLogDoc = {
  projectId: number;
  billingMonth: string;
  creditsUsed: number;
  success: boolean;
  createdAt: Date;
};

const COLLECTION = "usageLogs";

async function usageLogsCol() {
  return getCollection<UsageLogDoc & Document>(COLLECTION);
}

export type DailyUsageRow = {
  date: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  creditsUsed: number;
};

/**
 * Get daily usage for a project in a billing month (MongoDB aggregation).
 * Group by date (YYYY-MM-DD, UTC), return requestCount, successCount, errorCount, creditsUsed.
 */
export async function getDailyUsage(params: {
  projectId: number;
  billingMonth: string;
}): Promise<DailyUsageRow[]> {
  const { projectId, billingMonth } = params;
  const col = await usageLogsCol();

  const [y, mo] = billingMonth.split("-").map(Number);
  const startOfMonth = new Date(Date.UTC(y, mo - 1, 1));
  const endOfMonth = new Date(Date.UTC(y, mo, 0, 23, 59, 59, 999));

  const rows = await col
    .aggregate<DailyUsageRow>([
      {
        $match: {
          projectId,
          billingMonth,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $addFields: {
          dateStr: {
            $dateToString: { date: "$createdAt", format: "%Y-%m-%d" },
          },
        },
      },
      {
        $group: {
          _id: "$dateStr",
          requestCount: { $sum: 1 },
          successCount: { $sum: { $cond: ["$success", 1, 0] } },
          errorCount: { $sum: { $cond: ["$success", 0, 1] } },
          creditsUsed: { $sum: "$creditsUsed" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          requestCount: 1,
          successCount: 1,
          errorCount: 1,
          creditsUsed: 1,
        },
      },
    ])
    .toArray();

  return rows;
}

export type HourlyUsageRow = {
  hour: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
  creditsUsed: number;
};

/**
 * Get hourly usage for a project on a given date (MongoDB aggregation).
 * Group by hour (0–23, UTC). date = YYYY-MM-DD.
 */
export async function getHourlyUsage(params: {
  projectId: number;
  date: string;
}): Promise<HourlyUsageRow[]> {
  const { projectId, date } = params;
  const [y, mo, d] = date.split("-").map(Number);
  const dayStart = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999));

  const col = await usageLogsCol();

  const rows = await col
    .aggregate<{
      hour: number;
      requestCount: number;
      successCount: number;
      errorCount: number;
      creditsUsed: number;
    }>([
      {
        $match: {
          projectId,
          createdAt: { $gte: dayStart, $lte: dayEnd },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          requestCount: { $sum: 1 },
          successCount: { $sum: { $cond: ["$success", 1, 0] } },
          errorCount: { $sum: { $cond: ["$success", 0, 1] } },
          creditsUsed: { $sum: "$creditsUsed" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          requestCount: 1,
          successCount: 1,
          errorCount: 1,
          creditsUsed: 1,
        },
      },
    ])
    .toArray();

  return rows;
}
