import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - each user can have multiple projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  environment: mysqlEnum("environment", ["development", "staging", "production"]).default("development").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * API Keys table - each project can have multiple API keys
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 64 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 12 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Usage logs table - tracks API usage per project
 */
export const usageLogs = mysqlTable("usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  apiKeyId: int("apiKeyId"),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: int("statusCode").notNull(),
  responseTimeMs: int("responseTimeMs"),
  inputTokens: int("inputTokens").default(0),
  outputTokens: int("outputTokens").default(0),
  cost: bigint("cost", { mode: "number" }).default(0),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

/**
 * Billing table - tracks billing cycles and quotas (legacy)
 */
export const billing = mysqlTable("billing", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  billingCycleStart: timestamp("billingCycleStart").notNull(),
  billingCycleEnd: timestamp("billingCycleEnd").notNull(),
  totalRequests: int("totalRequests").default(0).notNull(),
  quotaLimit: int("quotaLimit").default(10000).notNull(),
  totalCost: bigint("totalCost", { mode: "number" }).default(0),
  status: mysqlEnum("status", ["active", "exceeded", "paid"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Billing = typeof billing.$inferSelect;
export type InsertBilling = typeof billing.$inferInsert;

/**
 * Billing plans - configurable credit quotas (rules in code, not hardcoded in DB)
 */
export const billingPlans = mysqlTable("billing_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  monthlyCreditQuota: int("monthlyCreditQuota").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillingPlan = typeof billingPlans.$inferSelect;
export type InsertBillingPlan = typeof billingPlans.$inferInsert;

/**
 * Project billing - links project to plan and current period
 */
export const projectBilling = mysqlTable("project_billing", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().unique(),
  planId: int("planId").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectBilling = typeof projectBilling.$inferSelect;
export type InsertProjectBilling = typeof projectBilling.$inferInsert;
