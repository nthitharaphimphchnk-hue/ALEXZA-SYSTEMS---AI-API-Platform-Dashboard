import { type Document, MongoClient, type Db, type Collection } from "mongodb";

/**
 * MongoDB connection helper (singleton, hot‑reload safe).
 *
 * Uses process.env.MONGODB_URI as the connection string.
 * Do NOT hardcode the URI – configure it in .env instead.
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn(
    "[Mongo] MONGODB_URI is not set – database features will be disabled until it is configured."
  );
}

// Use globalThis to survive hot‑reload in dev
type GlobalWithMongo = typeof globalThis & {
  __alexza_mongo_client__?: Promise<MongoClient>;
};

const globalWithMongo = globalThis as GlobalWithMongo;

async function createClient(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not configured. Set it in your .env file to enable MongoDB."
    );
  }

  const client = new MongoClient(MONGODB_URI, {
    // Let the driver handle reconnects automatically
    maxPoolSize: 20,
  });

  // Initial connect – will be awaited by all callers via the shared promise
  await client.connect();
  console.log("[Mongo] Connected");
  return client;
}

export function getMongoClient(): Promise<MongoClient> {
  if (!globalWithMongo.__alexza_mongo_client__) {
    globalWithMongo.__alexza_mongo_client__ = createClient().catch(err => {
      console.error("[Mongo] Connection error:", err);
      // Reset so that the next call can retry
      delete globalWithMongo.__alexza_mongo_client__;
      throw err;
    });
  }
  return globalWithMongo.__alexza_mongo_client__;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  // Default DB name can be taken from the URI; if not present, driver picks one.
  return client.db();
}

export async function getCollection<TSchema extends Document = Document>(
  name: string
): Promise<Collection<TSchema>> {
  const db = await getMongoDb();
  return db.collection<TSchema>(name);
}

/**
 * Simple numeric auto‑increment helper using a `counters` collection.
 * This keeps existing numeric `id` usage working on top of MongoDB.
 */
export async function getNextSequence(sequenceName: string): Promise<number> {
  const counters = await getCollection<{ _id: string; seq: number }>("counters");
  const result = await counters.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  if (!result || typeof (result as { seq?: number }).seq !== "number") {
    throw new Error(`[Mongo] Failed to get next sequence for ${sequenceName}`);
  }

  return (result as { seq: number }).seq;
}

