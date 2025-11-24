import { strict as assert } from 'assert';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { connectToDb, getDb, closeDb } from '../db/mongo';
import { generateLocation, generateNpc } from '../services/generatorService';
import { createCampaign, setHexMap } from '../services/campaignService';
import { Hex } from '../models/Campaign';

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
    // generate NPC without campaign
    const npcResult = await generateNpc();
    assert.ok(npcResult.npc.name);
    assert.ok(npcResult.npc.role);
    assert.ok((npcResult.npc.descriptors ?? []).length >= 1);

    // generate NPC into campaign
    await createCampaign({ campaignId: 'camp1', name: 'Camp One' });
    const npcWithCamp = await generateNpc({ campaignId: 'camp1' });
    assert.ok(npcWithCamp.campaign);
    assert.equal(npcWithCamp.campaign?.npcs.length, 1);

    // generate location
    const hexes: Hex[] = [
      { x: 0, y: 0, biome: 'forest', discovered: true },
      { x: 1, y: 0, biome: 'hills', discovered: true },
    ];
    await setHexMap('camp1', hexes);
    const locResult = await generateLocation({ campaignId: 'camp1', hex: { x: 1, y: 0 } });
    assert.equal(locResult.campaign.locations.length, 1);
    assert.equal(locResult.campaign.locations[0].hex.x, 1);
    assert.equal(locResult.campaign.locations[0].hex.y, 0);

    console.log('generatorService tests passed');
  } finally {
    await closeDb();
    await mongoose.disconnect();
    await mongod.stop();
  }
}

runTests().catch((error) => {
  console.error('generatorService tests failed', error);
  process.exit(1);
});
