/**
 * Plan / Package service – UX only. No Stripe, no real payment, no invoice.
 * Manages billingPlans collection and project.planId.
 */

import type { Document } from "mongodb";
import { getCollection } from "../db/mongo";
import * as projectService from "./projectService";

export type PlanName = "Free" | "Pro" | "Enterprise";
export type PlanStatus = "active" | "hidden";

export type BillingPlanDocument = {
  _id: string;
  name: PlanName;
  monthlyCredits: number;
  status: PlanStatus;
};

const COLLECTION = "billingPlans";
const DEFAULT_PLANS: BillingPlanDocument[] = [
  { _id: "free", name: "Free", monthlyCredits: 1000, status: "active" },
  { _id: "pro", name: "Pro", monthlyCredits: 50_000, status: "active" },
  { _id: "enterprise", name: "Enterprise", monthlyCredits: 0, status: "active" },
];

let plansEnsured = false;

async function plansCollection() {
  return getCollection<BillingPlanDocument & Document>(COLLECTION);
}

/** Ensure billingPlans has default plans (Free, Pro, Enterprise). Run once. */
export async function ensureBillingPlans(): Promise<void> {
  if (plansEnsured) return;
  const col = await plansCollection();
  const count = await col.countDocuments();
  if (count === 0) {
    await col.insertMany(
      DEFAULT_PLANS.map((p) => ({ ...p })) as (BillingPlanDocument & Document)[]
    );
    plansEnsured = true;
    console.log("[PlanService] Inserted default billing plans: free, pro, enterprise");
  }
  plansEnsured = true;
}

/**
 * List plans for UX (e.g. plan picker). Returns only active plans.
 * Do not touch Stripe / payment.
 */
export async function listPlans(): Promise<BillingPlanDocument[]> {
  await ensureBillingPlans();
  const col = await plansCollection();
  return col.find({ status: "active" }).sort({ monthlyCredits: 1 }).toArray();
}

/**
 * Get plan by id (for quota resolution). Returns null if not found.
 */
export async function getPlanById(planId: string): Promise<BillingPlanDocument | null> {
  await ensureBillingPlans();
  const col = await plansCollection();
  const plan = await col.findOne({ _id: planId });
  return plan ?? null;
}

/**
 * Change a project's plan. Updates project.planId only (UX; no real charge).
 * "Refill" for current month is implied: quota shown comes from new plan's monthlyCredits.
 */
export async function changeProjectPlan(params: {
  projectId: number;
  planId: string;
  userId: number;
}): Promise<{ ok: boolean; message?: string }> {
  const { projectId, planId, userId } = params;

  const project = await projectService.getProjectById(projectId, userId);
  if (!project) {
    return { ok: false, message: "Project not found" };
  }

  const plan = await getPlanById(planId);
  if (!plan) {
    return { ok: false, message: "Plan not found" };
  }

  if (plan.status !== "active") {
    return { ok: false, message: "Plan is not available" };
  }

  await projectService.updateProject(projectId, userId, { planId });
  return { ok: true };
}
