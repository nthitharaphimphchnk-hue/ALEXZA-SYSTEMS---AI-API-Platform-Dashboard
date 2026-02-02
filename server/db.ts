import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, apiKeys, usageLogs, billing, billingPlans, projectBilling, InsertProject, InsertApiKey, InsertUsageLog, InsertBilling, Project, ApiKey, UsageLog } from "../drizzle/schema";
import { ENV } from './_core/env';
import { createHash, randomBytes } from 'crypto';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PROJECT OPERATIONS ============

export async function createProject(data: Omit<InsertProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data);
  const insertId = result[0].insertId;
  
  const [project] = await db.select().from(projects).where(eq(projects.id, insertId));
  return project;
}

export async function getProjectsByUserId(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(projectId: number, userId: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [project] = await db.select().from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return project;
}

export async function updateProject(projectId: number, userId: number, data: Partial<Pick<Project, 'name' | 'description' | 'environment' | 'status'>>): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(projects).set(data).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return getProjectById(projectId, userId);
}

export async function deleteProject(projectId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return result[0].affectedRows > 0;
}

// ============ API KEY OPERATIONS ============

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `tti_${randomBytes(32).toString('hex')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 12);
  return { key, hash, prefix };
}

export async function createApiKey(projectId: number, name: string): Promise<{ apiKey: ApiKey; plainKey: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { key, hash, prefix } = generateApiKey();

  const result = await db.insert(apiKeys).values({
    projectId,
    name,
    keyHash: hash,
    keyPrefix: prefix,
  });

  const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, result[0].insertId));
  return { apiKey, plainKey: key };
}

export async function getApiKeysByProjectId(projectId: number): Promise<ApiKey[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(apiKeys)
    .where(and(eq(apiKeys.projectId, projectId), eq(apiKeys.isActive, true)))
    .orderBy(desc(apiKeys.createdAt));
}

export async function revokeApiKey(keyId: number, projectId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.update(apiKeys)
    .set({ isActive: false, revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.projectId, projectId)));
  
  return result[0].affectedRows > 0;
}

// ============ USAGE OPERATIONS ============

export async function logUsage(data: Omit<InsertUsageLog, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(usageLogs).values(data);
}

export async function getUsageStats(projectId: number, hours: number = 24) {
  const db = await getDb();
  if (!db) return { totalRequests: 0, successRate: 0, avgResponseTime: 0, totalCost: 0 };

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const result = await db.select({
    totalRequests: sql<number>`COUNT(*)`,
    successCount: sql<number>`SUM(CASE WHEN ${usageLogs.statusCode} < 400 THEN 1 ELSE 0 END)`,
    avgResponseTime: sql<number>`AVG(${usageLogs.responseTimeMs})`,
    totalCost: sql<number>`SUM(${usageLogs.cost})`,
  }).from(usageLogs)
    .where(and(eq(usageLogs.projectId, projectId), gte(usageLogs.createdAt, since)));

  const stats = result[0];
  return {
    totalRequests: stats?.totalRequests ?? 0,
    successRate: stats?.totalRequests ? ((stats.successCount ?? 0) / stats.totalRequests) * 100 : 0,
    avgResponseTime: Math.round(stats?.avgResponseTime ?? 0),
    totalCost: stats?.totalCost ?? 0,
  };
}

export async function getUsageByHour(projectId: number, hours: number = 24) {
  const db = await getDb();
  if (!db) return [];

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db.select({
    hour: sql<string>`DATE_FORMAT(${usageLogs.createdAt}, '%Y-%m-%d %H:00:00')`,
    requests: sql<number>`COUNT(*)`,
    cost: sql<number>`SUM(${usageLogs.cost})`,
  }).from(usageLogs)
    .where(and(eq(usageLogs.projectId, projectId), gte(usageLogs.createdAt, since)))
    .groupBy(sql`DATE_FORMAT(${usageLogs.createdAt}, '%Y-%m-%d %H:00:00')`)
    .orderBy(sql`hour`);
}

// ============ BILLING OPERATIONS ============

export async function getOrCreateBilling(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [existing] = await db.select().from(billing)
    .where(and(
      eq(billing.projectId, projectId),
      gte(billing.billingCycleEnd, now)
    ))
    .limit(1);

  if (existing) return existing;

  const result = await db.insert(billing).values({
    projectId,
    billingCycleStart: cycleStart,
    billingCycleEnd: cycleEnd,
  });

  const [newBilling] = await db.select().from(billing).where(eq(billing.id, result[0].insertId));
  return newBilling;
}

export async function updateBillingUsage(projectId: number, requestCount: number, cost: number) {
  const db = await getDb();
  if (!db) return;

  const currentBilling = await getOrCreateBilling(projectId);
  
  await db.update(billing)
    .set({
      totalRequests: sql`${billing.totalRequests} + ${requestCount}`,
      totalCost: sql`${billing.totalCost} + ${cost}`,
      status: sql`CASE WHEN ${billing.totalRequests} + ${requestCount} >= ${billing.quotaLimit} THEN 'exceeded' ELSE 'active' END`,
    })
    .where(eq(billing.id, currentBilling.id));
}

export async function getBillingHistory(projectId: number, limit: number = 6) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(billing)
    .where(eq(billing.projectId, projectId))
    .orderBy(desc(billing.billingCycleStart))
    .limit(limit);
}

// ============ BILLING FOUNDATION (credit-based, usage_logs as source of truth) ============

export async function getUsageLogsForProjectInPeriod(
  projectId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<UsageLog[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select().from(usageLogs)
    .where(and(
      eq(usageLogs.projectId, projectId),
      gte(usageLogs.createdAt, periodStart),
      lte(usageLogs.createdAt, periodEnd)
    ))
    .orderBy(usageLogs.createdAt);
  return rows;
}

export async function getBillingPlanByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(billingPlans).where(eq(billingPlans.name, name)).limit(1);
  return row;
}

export async function getBillingPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(billingPlans).where(eq(billingPlans.id, id)).limit(1);
  return row;
}

export async function getProjectBilling(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(projectBilling).where(eq(projectBilling.projectId, projectId)).limit(1);
  return row;
}

export async function getOrCreateProjectBilling(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const existing = await getProjectBilling(projectId);
  if (existing) {
    const end = new Date(existing.currentPeriodEnd);
    if (end < now) {
      await db
        .update(projectBilling)
        .set({ currentPeriodStart: periodStart, currentPeriodEnd: periodEnd })
        .where(eq(projectBilling.projectId, projectId));
      const [updated] = await db.select().from(projectBilling).where(eq(projectBilling.projectId, projectId)).limit(1);
      return updated!;
    }
    return existing;
  }

  const freePlan = await getBillingPlanByName("free");
  if (!freePlan) throw new Error("Billing plan 'free' not found. Run migrations.");

  await db.insert(projectBilling).values({
    projectId,
    planId: freePlan.id,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
  });

  const [row] = await db.select().from(projectBilling).where(eq(projectBilling.projectId, projectId)).limit(1);
  return row!;
}
