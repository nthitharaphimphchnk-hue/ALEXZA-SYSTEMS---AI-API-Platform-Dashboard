/**
 * Admin / Internal analytics – aggregate usage across all projects.
 * For debug and internal tools only. Use with admin role only.
 */

import type { Document } from "mongodb";
import { getCollection } from "../db/mongo";

type UsageLogDoc = {
  projectId: number;
  billingMonth: string;
  creditsUsed: number;
  success: boolean;
  errorMessage: string | null;
  createdAt: Date;
};

type ProjectDoc = {
  id: number;
  name: string;
};

const USAGE_COLLECTION = "usageLogs";
const PROJECTS_COLLECTION = "projects";

async function usageLogsCol() {
  return getCollection<UsageLogDoc & Document>(USAGE_COLLECTION);
}

async function projectsCol() {
  return getCollection<ProjectDoc & Document>(PROJECTS_COLLECTION);
}

export type ProjectUsageByMonth = {
  projectId: number;
  projectName: string;
  billingMonth: string;
  creditsUsed: number;
  requestCount: number;
  errorCount: number;
};

/**
 * Get usage for all projects, grouped by billing month.
 * Returns one row per project per month (for admin overview).
 */
export async function getAllProjectsUsage(params?: {
  billingMonth?: string;
  limit?: number;
}): Promise<ProjectUsageByMonth[]> {
  const col = await usageLogsCol();
  const match: Record<string, unknown> = {};
  if (params?.billingMonth) {
    match.billingMonth = params.billingMonth;
  }

  const aggregated = await col
    .aggregate<{
      _id: { projectId: number; billingMonth: string };
      creditsUsed: number;
      requestCount: number;
      errorCount: number;
    }>([
      { $match: Object.keys(match).length ? match : {} },
      {
        $group: {
          _id: { projectId: "$projectId", billingMonth: "$billingMonth" },
          creditsUsed: { $sum: "$creditsUsed" },
          requestCount: { $sum: 1 },
          errorCount: { $sum: { $cond: ["$success", 0, 1] } },
        },
      },
      { $sort: { "_id.billingMonth": -1, creditsUsed: -1 } },
      { $limit: params?.limit ?? 500 },
    ])
    .toArray();

  const projectIds = [...new Set(aggregated.map((r) => r._id.projectId))];
  const projectsColRef = await projectsCol();
  const projects = await projectsColRef
    .find({ id: { $in: projectIds } })
    .toArray();
  const nameById = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  return aggregated.map((r) => ({
    projectId: r._id.projectId,
    projectName: nameById[r._id.projectId] ?? `Project ${r._id.projectId}`,
    billingMonth: r._id.billingMonth,
    creditsUsed: r.creditsUsed,
    requestCount: r.requestCount,
    errorCount: r.errorCount,
  }));
}

export type TopProjectUsage = {
  projectId: number;
  projectName: string;
  creditsUsed: number;
  requestCount: number;
  errorCount: number;
};

/**
 * Get top projects by total credits used (all time or by billing month).
 */
export async function getTopProjectsByUsage(params?: {
  billingMonth?: string;
  limit?: number;
}): Promise<TopProjectUsage[]> {
  const col = await usageLogsCol();
  const match: Record<string, unknown> = {};
  if (params?.billingMonth) {
    match.billingMonth = params.billingMonth;
  }

  const aggregated = await col
    .aggregate<{
      _id: number;
      creditsUsed: number;
      requestCount: number;
      errorCount: number;
    }>([
      { $match: Object.keys(match).length ? match : {} },
      {
        $group: {
          _id: "$projectId",
          creditsUsed: { $sum: "$creditsUsed" },
          requestCount: { $sum: 1 },
          errorCount: { $sum: { $cond: ["$success", 0, 1] } },
        },
      },
      { $sort: { creditsUsed: -1 } },
      { $limit: params?.limit ?? 50 },
    ])
    .toArray();

  const projectIds = aggregated.map((r) => r._id);
  const projectsColRef = await projectsCol();
  const projects = await projectsColRef.find({ id: { $in: projectIds } }).toArray();
  const nameById = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  return aggregated.map((r) => ({
    projectId: r._id,
    projectName: nameById[r._id] ?? `Project ${r._id}`,
    creditsUsed: r.creditsUsed,
    requestCount: r.requestCount,
    errorCount: r.errorCount,
  }));
}

export type RecentErrorRow = {
  projectId: number;
  projectName: string;
  errorMessage: string | null;
  createdAt: string;
  endpoint?: string;
}

/**
 * Get recent error entries from usageLogs (success = false), sorted by createdAt desc.
 */
export async function getRecentErrors(params?: { limit?: number }): Promise<RecentErrorRow[]> {
  const col = await usageLogsCol();
  const limit = params?.limit ?? 100;

  const docs = await col
    .find({ success: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const projectIds = [...new Set(docs.map((d) => d.projectId))];
  const projectsColRef = await projectsCol();
  const projects = await projectsColRef.find({ id: { $in: projectIds } }).toArray();
  const nameById = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  return docs.map((d) => ({
    projectId: d.projectId,
    projectName: nameById[d.projectId] ?? `Project ${d.projectId}`,
    errorMessage: d.errorMessage ?? null,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
    endpoint: (d as unknown as { endpoint?: string }).endpoint,
  }));
}
