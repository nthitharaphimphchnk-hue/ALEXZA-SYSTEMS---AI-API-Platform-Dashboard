/**
 * Project service – MongoDB-backed project CRUD.
 * Uses server/db/mongo.ts. Index on userId for list performance.
 */

import type { Document } from "mongodb";
import { getCollection, getNextSequence } from "../db/mongo";

export type ProjectEnvironment = "development" | "staging" | "production";
export type ProjectStatus = "active" | "inactive" | "suspended" | "archived";

export type ProjectDocument = {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  environment: ProjectEnvironment;
  status: ProjectStatus;
  planId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const COLLECTION = "projects";
let indexEnsured = false;

async function projectsCollection() {
  return getCollection<ProjectDocument & Document>(COLLECTION);
}

/** Create index on userId for getProjectsByUser. */
export async function ensureProjectsIndex(): Promise<void> {
  if (indexEnsured) return;
  const col = await projectsCollection();
  await col.createIndex({ userId: 1 });
  indexEnsured = true;
}

export async function getProjectsByUser(userId: number): Promise<ProjectDocument[]> {
  await ensureProjectsIndex();
  const col = await projectsCollection();
  return col.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export type CreateProjectInput = {
  userId: number;
  name: string;
  environment?: ProjectEnvironment;
  description?: string | null;
  status?: ProjectStatus;
};

export async function createProject(input: CreateProjectInput): Promise<ProjectDocument> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    throw new Error("Project name is required and cannot be empty");
  }

  await ensureProjectsIndex();
  const col = await projectsCollection();
  const now = new Date();
  const id = await getNextSequence("projects");

  const doc: ProjectDocument = {
    id,
    userId: input.userId,
    name,
    description: input.description ?? null,
    environment: input.environment ?? "development",
    status: input.status ?? "active",
    planId: "free",
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(doc as (ProjectDocument & Document));
  console.log("[ProjectService] Created project", { id, name: doc.name, userId: doc.userId });
  return doc;
}

export async function getProjectById(
  projectId: number,
  userId: number
): Promise<ProjectDocument | undefined> {
  const col = await projectsCollection();
  const project = await col.findOne({ id: projectId, userId });
  return project ?? undefined;
}

export async function updateProject(
  projectId: number,
  userId: number,
  data: Partial<Pick<ProjectDocument, "name" | "description" | "environment" | "status" | "planId">>
): Promise<ProjectDocument | undefined> {
  const col = await projectsCollection();
  const now = new Date();
  const update: Partial<ProjectDocument> = {
    ...data,
    updatedAt: now,
  };
  if (typeof update.name === "string" && !update.name.trim()) {
    throw new Error("Project name cannot be empty");
  }

  await col.updateOne({ id: projectId, userId }, { $set: update });
  const updated = await col.findOne({ id: projectId, userId });
  return updated ?? undefined;
}

export async function deleteProject(projectId: number, userId: number): Promise<boolean> {
  const col = await projectsCollection();
  const result = await col.deleteOne({ id: projectId, userId });
  return result.deletedCount === 1;
}
