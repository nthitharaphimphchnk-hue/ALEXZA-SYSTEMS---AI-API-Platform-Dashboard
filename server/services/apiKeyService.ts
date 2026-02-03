/**
 * API Key service – MongoDB-backed keys, hashed storage, Bearer auth.
 * Uses server/db/mongo.ts. Never store or log plain keys.
 */

import { createHash, randomBytes } from "crypto";
import type { Document } from "mongodb";
import { getCollection, getNextSequence } from "../db/mongo";

export const API_KEY_PREFIX = "alexza_sk_";

export type ApiKeyStatus = "active" | "revoked";

export type ApiKeyDocument = {
  id: number;
  projectId: number;
  name: string;
  keyHash: string;
  keyPrefix: string;
  status: ApiKeyStatus;
  createdAt: Date;
  revokedAt: Date | null;
};

const COLLECTION = "apiKeys";
const KEY_PREFIX_LENGTH = 8; // 6–8 chars for display
let indexEnsured = false;

async function apiKeysCollection() {
  return getCollection<ApiKeyDocument & Document>(COLLECTION);
}

function hashKey(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}

function generateKey(): { plainKey: string; keyHash: string; keyPrefix: string } {
  const plainKey = `${API_KEY_PREFIX}${randomBytes(32).toString("hex")}`;
  const keyHash = hashKey(plainKey);
  const keyPrefix = plainKey.substring(0, KEY_PREFIX_LENGTH);
  return { plainKey, keyHash, keyPrefix };
}

/** Index on projectId; unique on keyHash. */
export async function ensureApiKeysIndexes(): Promise<void> {
  if (indexEnsured) return;
  const col = await apiKeysCollection();
  await col.createIndex({ projectId: 1 });
  await col.createIndex({ keyHash: 1 }, { unique: true });
  indexEnsured = true;
}

export type CreateApiKeyInput = {
  projectId: number;
  name: string;
};

export async function createApiKey(
  input: CreateApiKeyInput
): Promise<{ apiKey: ApiKeyDocument; plainKey: string }> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    throw new Error("API key name is required and cannot be empty");
  }

  await ensureApiKeysIndexes();
  const col = await apiKeysCollection();
  const now = new Date();
  const id = await getNextSequence("apiKeys");
  const { plainKey, keyHash, keyPrefix } = generateKey();

  const doc: ApiKeyDocument = {
    id,
    projectId: input.projectId,
    name,
    keyHash,
    keyPrefix,
    status: "active",
    createdAt: now,
    revokedAt: null,
  };

  await col.insertOne(doc as (ApiKeyDocument & Document));
  console.log("[ApiKeyService] Created API key", { id, name: doc.name, projectId: doc.projectId });
  return { apiKey: doc, plainKey };
}

export async function listApiKeys(projectId: number): Promise<ApiKeyDocument[]> {
  await ensureApiKeysIndexes();
  const col = await apiKeysCollection();
  return col.find({ projectId, status: "active" }).sort({ createdAt: -1 }).toArray();
}

export async function revokeApiKey(apiKeyId: number, projectId: number): Promise<boolean> {
  const col = await apiKeysCollection();
  const result = await col.updateOne(
    { id: apiKeyId, projectId },
    { $set: { status: "revoked" as const, revokedAt: new Date() } }
  );
  if (result.matchedCount === 1) {
    console.log("[ApiKeyService] Revoked API key", { id: apiKeyId, projectId });
  }
  return result.matchedCount === 1;
}

/**
 * Resolve Bearer token to projectId + apiKeyId. Use for API key auth.
 * Returns null if key invalid or revoked. Never logs the key.
 */
export async function findProjectIdByKey(plainKey: string): Promise<{
  projectId: number;
  apiKeyId: number;
} | null> {
  if (!plainKey || typeof plainKey !== "string") return null;
  const keyHash = hashKey(plainKey.trim());
  await ensureApiKeysIndexes();
  const col = await apiKeysCollection();
  const key = await col.findOne({ keyHash, status: "active" });
  if (!key) return null;
  return { projectId: key.projectId, apiKeyId: key.id };
}

/**
 * Middleware helper: read Authorization: Bearer <key>, validate, attach projectId + apiKeyId.
 * Call next() or send 401. Use on routes that accept API key auth.
 */
export async function withApiKeyAuth(
  authHeader: string | undefined,
  onSuccess: (ctx: { projectId: number; apiKeyId: number }) => Promise<void> | void,
  onUnauthorized: () => void
): Promise<void> {
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    onUnauthorized();
    return;
  }
  const resolved = await findProjectIdByKey(token);
  if (!resolved) {
    onUnauthorized();
    return;
  }
  await onSuccess(resolved);
}
