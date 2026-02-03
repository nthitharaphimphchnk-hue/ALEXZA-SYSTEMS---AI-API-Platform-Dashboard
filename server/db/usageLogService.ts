import { type WithId } from "mongodb";
import { getCollection } from "./mongo";

export type UsageLogDocument = {
  projectId: number;
  apiKeyId: number | null;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  errorMessage: string | null;
  createdAt: Date;
  /** Derived fields for billing/analytics */
  success: boolean;
  creditsUsed: number;
  /** Billing month in YYYY-MM (e.g. \"2026-02\") */
  billingMonth: string;
};

export type UsageLog = WithId<UsageLogDocument>;

type LogUsageInput = {
  projectId: number;
  apiKeyId?: number | null;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cost?: number | null;
  errorMessage?: string | null;
  createdAt?: Date;
};

function toBillingMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}

export async function insertUsageLog(data: LogUsageInput): Promise<void> {
  const collection = await getCollection<UsageLogDocument>("usageLogs");

  const createdAt = data.createdAt ?? new Date();
  const success = data.statusCode < 400;

  const doc: UsageLogDocument = {
    projectId: data.projectId,
    apiKeyId: data.apiKeyId ?? null,
    endpoint: data.endpoint,
    method: data.method,
    statusCode: data.statusCode,
    responseTimeMs: data.responseTimeMs ?? 0,
    inputTokens: data.inputTokens ?? 0,
    outputTokens: data.outputTokens ?? 0,
    cost: data.cost ?? 0,
    errorMessage: data.errorMessage ?? null,
    createdAt,
    success,
    // 1 request = 1 credit (current billing rule)
    creditsUsed: 1,
    billingMonth: toBillingMonth(createdAt),
  };

  await collection.insertOne(doc);
}

export async function getUsageStats(projectId: number, hours: number) {
  const collection = await getCollection<UsageLogDocument>("usageLogs");
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [stats] = await collection
    .aggregate<{
      totalRequests: number;
      successCount: number;
      avgResponseTime: number;
      totalCost: number;
    }>([
      {
        $match: {
          projectId,
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          successCount: {
            $sum: {
              $cond: [{ $lt: ["$statusCode", 400] }, 1, 0],
            },
          },
          avgResponseTime: { $avg: "$responseTimeMs" },
          totalCost: { $sum: "$cost" },
        },
      },
    ])
    .toArray();

  const totalRequests = stats?.totalRequests ?? 0;
  const successRate = totalRequests
    ? ((stats?.successCount ?? 0) / totalRequests) * 100
    : 0;

  return {
    totalRequests,
    successRate,
    avgResponseTime: Math.round(stats?.avgResponseTime ?? 0),
    totalCost: stats?.totalCost ?? 0,
  };
}

export async function getUsageByHour(projectId: number, hours: number) {
  const collection = await getCollection<UsageLogDocument>("usageLogs");
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return collection
    .aggregate<{
      hour: Date;
      requests: number;
      cost: number;
    }>([
      {
        $match: {
          projectId,
          createdAt: { $gte: since },
        },
      },
      {
        // Truncate to hour
        $addFields: {
          hourBucket: {
            $dateTrunc: {
              date: "$createdAt",
              unit: "hour",
            },
          },
        },
      },
      {
        $group: {
          _id: "$hourBucket",
          requests: { $sum: 1 },
          cost: { $sum: "$cost" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          requests: 1,
          cost: 1,
        },
      },
    ])
    .toArray();
}

export async function getUsageLogsForProjectInPeriod(
  projectId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<UsageLog[]> {
  const collection = await getCollection<UsageLogDocument>("usageLogs");
  const cursor = collection
    .find({
      projectId,
      createdAt: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    })
    .sort({ createdAt: 1 });

  return cursor.toArray();
}

/** Aggregate usage by billing month (YYYY-MM) for a project. Last N months. */
export async function getUsageByBillingMonth(
  projectId: number,
  limit: number
): Promise<{ billingMonth: string; totalRequests: number; totalCost: number }[]> {
  const collection = await getCollection<UsageLogDocument>("usageLogs");
  const rows = await collection
    .aggregate<{ billingMonth: string; totalRequests: number; totalCost: number }>([
      { $match: { projectId } },
      {
        $group: {
          _id: "$billingMonth",
          totalRequests: { $sum: 1 },
          totalCost: { $sum: "$cost" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          billingMonth: "$_id",
          totalRequests: 1,
          totalCost: 1,
        },
      },
    ])
    .toArray();
  return rows;
}

