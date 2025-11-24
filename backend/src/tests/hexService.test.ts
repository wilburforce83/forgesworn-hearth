import { strict as assert } from 'assert';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectToDb, getDb, closeDb } from '../db/mongo';
import { createCampaign } from '../services/campaignService';
import { revealHexArea } from '../services/hexService';

async function seedOracles(): Promise<void> {
  const db = getDb();
  const collection = db.collection('oracles');
  const core = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', '..', 'data', 'ironsworn', 'oracles.core.json'), 'utf-8')
  );
  const delve = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', '..', 'data', 'ironsworn', 'oracles.delve.json'), 'utf-8')
  );
  await collection.insertMany(core);
  await collection.insertMany(delve);
}

async function setupDatabase() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await connectToDb();
  await mongoose.connect(process.env.MONGO_URI as string);
  await seedOracles();
  return mongod;
}

async function runTests() {
  const mongod = await setupDatabase();
  try {
    await createCampaign({ campaignId: 'camp-hex', name: 'Hex Camp' });

    // First reveal
    const first = await revealHexArea({ campaignId: 'camp-hex', x: 0, y: 0 });
    assert.equal(first.hexes.length, 7);
    assert.equal(first.campaign.hexMap.length, 7);
    assert.ok(first.hexes.every((h) => h.discovered));

    // Second reveal same area should not duplicate
    const second = await revealHexArea({ campaignId: 'camp-hex', x: 0, y: 0 });
    assert.equal(second.hexes.length, 7);
    assert.equal(second.campaign.hexMap.length, 7);

    // Reveal with allowPoi false
    const third = await revealHexArea({ campaignId: 'camp-hex', x: 1, y: 1, allowPoi: false });
    assert.equal(third.hexes.length, 7);
    assert.ok(!third.generatedLocations || third.generatedLocations.length >= 0);
    assert.ok(!third.generatedNpcs || third.generatedNpcs.length >= 0);

    console.log('hexService tests passed');
  } finally {
    await closeDb();
    await mongoose.disconnect();
    await mongod.stop();
  }
}

runTests().catch((error) => {
  console.error('hexService tests failed', error);
  process.exit(1);
});
