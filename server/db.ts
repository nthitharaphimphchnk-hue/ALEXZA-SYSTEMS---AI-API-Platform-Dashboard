import type { Collection, WithId } from "mongodb";
import { ENV } from "./_core/env";
import { getCollection, getNextSequence } from "./db/mongo";
import {
  getUsageByBillingMonth,
  getUsageByHour as mongoGetUsageByHour,
  getUsageLogsForProjectInPeriod as mongoGetUsageLogsForProjectInPeriod,
  getUsageStats as mongoGetUsageStats,
  type UsageLog as MongoUsageLog,
} from "./db/usageLogService";
import { logUsage as logUsageService } from "./services/usageLogService";
import * as apiKeyService from "./services/apiKeyService";
import * as projectService from "./services/projectService";

// ---------------------------------------------------------------------------
// Shared document types (numeric ids, Mongo-backed)
// ---------------------------------------------------------------------------

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type Project = {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  environment: "development" | "staging" | "production";
  status: "active" | "inactive" | "suspended" | "archived";
  planId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiKey = {
  id: number;
  projectId: number;
  name: string;
  keyHash: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  revokedAt?: Date | null;
};

export type UsageLog = MongoUsageLog;

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

async function usersCollection(): Promise<Collection<User>> {
  return getCollection<User>("users");
}

// ---------------------------------------------------------------------------
// User operations
// ---------------------------------------------------------------------------

export async function upsertUser(
  user: Partial<User> & { openId: string }
): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const col = await usersCollection();
  const now = new Date();

  const existing = await col.findOne({ openId: user.openId });

  const base: Omit<User, "id"> = {
    openId: user.openId,
    name: (user.name ?? existing?.name) ?? null,
    email: (user.email ?? existing?.email) ?? null,
    loginMethod: (user.loginMethod ?? existing?.loginMethod) ?? null,
    role:
      user.role ??
      existing?.role ??
      (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastSignedIn: user.lastSignedIn ?? now,
  };

  if (existing) {
    await col.updateOne({ openId: user.openId }, { $set: base });
  } else {
    const id = await getNextSequence("users");
    await col.insertOne({ id, ...base });
  }
}

export async function getUserByOpenId(
  openId: string
): Promise<(User & { _id?: unknown }) | undefined> {
  const col = await usersCollection();
  const user = await col.findOne({ openId });
  if (!user) return undefined;
  return {
    ...user,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
  };
}

// ---------------------------------------------------------------------------
// Project operations (MongoDB via projectService)
// ---------------------------------------------------------------------------

export async function createProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<Project> {
  return projectService.createProject({
    userId: data.userId,
    name: data.name,
    description: data.description ?? null,
    environment: data.environment,
    status: data.status,
  });
}

export async function getProjectsByUserId(userId: number): Promise<Project[]> {
  return projectService.getProjectsByUser(userId);
}

export async function getProjectById(
  projectId: number,
  userId: number
): Promise<Project | undefined> {
  return projectService.getProjectById(projectId, userId);
}

export async function updateProject(
  projectId: number,
  userId: number,
  data: Partial<
    Pick<Project, "name" | "description" | "environment" | "status">
  >
): Promise<Project | undefined> {
  return projectService.updateProject(projectId, userId, data);
}

export async function deleteProject(
  projectId: number,
  userId: number
): Promise<boolean> {
  return projectService.deleteProject(projectId, userId);
}

// ---------------------------------------------------------------------------
// API key operations (MongoDB via apiKeyService)
// ---------------------------------------------------------------------------

function mapToApiKey(doc: apiKeyService.ApiKeyDocument): ApiKey {
  return {
    id: doc.id,
    projectId: doc.projectId,
    name: doc.name,
    keyHash: doc.keyHash,
    keyPrefix: doc.keyPrefix,
    isActive: doc.status === "active",
    lastUsedAt: null,
    expiresAt: null,
    createdAt: doc.createdAt,
    revokedAt: doc.revokedAt,
  };
}

export async function createApiKey(
  projectId: number,
  name: string
): Promise<{ apiKey: ApiKey; plainKey: string }> {
  const { apiKey, plainKey } = await apiKeyService.createApiKey({ projectId, name });
  return { apiKey: mapToApiKey(apiKey), plainKey };
}

export async function getApiKeysByProjectId(
  projectId: number
): Promise<ApiKey[]> {
  const list = await apiKeyService.listApiKeys(projectId);
  return list.map(mapToApiKey);
}

export async function revokeApiKey(
  keyId: number,
  projectId: number
): Promise<boolean> {
  return apiKeyService.revokeApiKey(keyId, projectId);
}

/** Resolve Bearer API key to projectId + apiKeyId. Returns null if invalid or revoked. */
export async function getProjectIdFromApiKey(plainKey: string): Promise<{
  projectId: number;
  apiKeyId: number;
} | null> {
  return apiKeyService.findProjectIdByKey(plainKey);
}

// ---------------------------------------------------------------------------
// Usage operations (MongoDB service layer)
// ---------------------------------------------------------------------------

/** Log usage via service layer (try/catch inside; never throws). usageLogs = source of truth for billing. */
export async function logUsage(data: {
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
}): Promise<void> {
  await logUsageService({
    projectId: data.projectId,
    apiKeyId: data.apiKeyId ?? null,
    success: data.statusCode < 400,
    errorMessage: data.errorMessage ?? null,
    responseTimeMs: data.responseTimeMs ?? 0,
    endpoint: data.endpoint,
    method: data.method,
    statusCode: data.statusCode,
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    cost: data.cost,
  });
}

export async function getUsageStats(
  projectId: number,
  hours: number = 24
) {
  return mongoGetUsageStats(projectId, hours);
}

export async function getUsageByHour(
  projectId: number,
  hours: number = 24
) {
  return mongoGetUsageByHour(projectId, hours);
}

// ---------------------------------------------------------------------------
// Billing foundation (credit-based, usageLogs as source of truth)
// ---------------------------------------------------------------------------

export async function getUsageLogsForProjectInPeriod(
  projectId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<UsageLog[]> {
  return mongoGetUsageLogsForProjectInPeriod(projectId, periodStart, periodEnd);
}

const DEFAULT_QUOTA_LIMIT = 10000;

/** Current billing period derived from usageLogs (MongoDB). */
export async function getOrCreateBilling(projectId: number) {
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

  const logs = await mongoGetUsageLogsForProjectInPeriod(
    projectId,
    periodStart,
    periodEnd
  );
  const totalRequests = logs.length;
  const totalCost = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const status = totalRequests >= DEFAULT_QUOTA_LIMIT ? "exceeded" : "active";

  return {
    id: 0,
    projectId,
    billingCycleStart: periodStart,
    billingCycleEnd: periodEnd,
    totalRequests,
    quotaLimit: DEFAULT_QUOTA_LIMIT,
    totalCost,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

/** Billing history derived from usageLogs grouped by month (MongoDB). */
export async function getBillingHistory(projectId: number, limit: number = 6) {
  const months = await getUsageByBillingMonth(projectId, limit);
  return months.map((m, i) => {
    const [y, mo] = m.billingMonth.split("-").map(Number);
    const periodStart = new Date(y, mo - 1, 1);
    const periodEnd = new Date(y, mo, 0, 23, 59, 59, 999);
    const status =
      m.totalRequests >= DEFAULT_QUOTA_LIMIT ? "exceeded" : "active";
    return {
      id: i + 1,
      projectId,
      billingCycleStart: periodStart,
      billingCycleEnd: periodEnd,
      totalRequests: m.totalRequests,
      totalCost: m.totalCost,
      status,
    };
  });
}
