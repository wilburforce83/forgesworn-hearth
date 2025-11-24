// MongoDB connection helper to establish and reuse a single client instance.
import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDb(): Promise<MongoClient> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in environment variables');
  }

  if (client) {
    try {
      await client.db().command({ ping: 1 });
      return client;
    } catch {
      client = null;
      db = null;
    }
  }

  client = new MongoClient(uri);
  try {
    await client.connect();
    db = client.db(); // Use default database from URI.
    console.log('Connected to MongoDB');
    return client;
  } catch (error) {
    client = null;
    db = null;
    throw error;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database connection has not been established. Call connectToDb() first.');
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
