// Seed script to load Ironsworn reference data into MongoDB.
import path from 'path';
import { promises as fs } from 'fs';
import { config } from 'dotenv';
import { AnyBulkWriteOperation } from 'mongodb';
import { connectToDb, getDb } from '../db/mongo';
import { Ruleset } from '../models/ruleset';
import { MoveDefinition } from '../models/move';
import { OracleTable } from '../models/oracle';
import { AssetDefinition } from '../models/asset';

config({ path: '../.env.development' });

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data', 'ironsworn');

async function loadJsonFile<T>(filename: string): Promise<T> {
  const content = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(content) as T;
}

async function upsertMany(
  collectionName: string,
  items: any[],
  getFilter: (item: any) => Record<string, unknown>
): Promise<void> {
  if (items.length === 0) {
    console.log(`${collectionName}: no items to upsert.`);
    return;
  }

  const db = getDb();
  const collection = db.collection(collectionName);
  const operations: AnyBulkWriteOperation[] = items.map((item) => ({
    updateOne: {
      filter: getFilter(item),
      update: { $set: item },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });
  console.log(
    `${collectionName}: inserted ${result.upsertedCount}, updated ${result.modifiedCount}.`
  );
}

async function run(): Promise<void> {
  const client = await connectToDb();

  try {
    const ruleset = await loadJsonFile<Ruleset>('ruleset.ironsworn.json');
    const moves = (
      await Promise.all([
        loadJsonFile<MoveDefinition[]>('moves.core.json'),
        loadJsonFile<MoveDefinition[]>('moves.delve.json'),
      ])
    ).flat();
    const oracles = (
      await Promise.all([
        loadJsonFile<OracleTable[]>('oracles.core.json'),
        loadJsonFile<OracleTable[]>('oracles.delve.json'),
      ])
    ).flat();
    const assets = await loadJsonFile<AssetDefinition[]>('assets.core.json');

    await upsertMany('rulesets', [ruleset], (item: Ruleset) => ({
      rulesetId: item.rulesetId,
    }));

    await upsertMany('moves', moves, (item: MoveDefinition) => ({
      rulesetId: item.rulesetId,
      key: item.key,
    }));

    await upsertMany('oracles', oracles, (item: OracleTable) => ({
      oracleId: item.oracleId,
    }));

    await upsertMany('assets', assets, (item: AssetDefinition) => ({
      rulesetId: item.rulesetId,
      assetId: item.assetId,
    }));

    console.log('Ironsworn seed complete.');
  } catch (error) {
    console.error('Failed to seed Ironsworn data:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error('Unexpected error while seeding:', error);
  process.exit(1);
});
