import { strict as assert } from 'assert';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {
  addCharacterToCampaign,
  appendSessionLogEntry,
  createCampaign,
  getCampaignById,
  setHexMap,
  updateCharacterInCampaign,
} from '../services/campaignService';
import { Character, Hex } from '../models/Campaign';

async function setupDatabase() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  return mongod;
}

function buildCharacter(partial?: Partial<Character>): Character {
  return {
    characterId: 'char-1',
    name: 'Aria',
    edge: 2,
    heart: 3,
    iron: 2,
    shadow: 1,
    wits: 2,
    health: 5,
    spirit: 5,
    supply: 5,
    momentum: 2,
    momentumMax: 10,
    momentumReset: 2,
    debilities: {},
    assets: [],
    vows: [],
    ...partial,
  };
}

async function runTests() {
  const mongod = await setupDatabase();

  try {
    // Create and fetch campaign.
    const created = await createCampaign({
      campaignId: 'storm-scarred-coast',
      name: 'Storm Scarred Coast',
      worldTruths: ['Iron is rare', 'Old World lost'],
    });
    assert.equal(created.campaignId, 'storm-scarred-coast');
    assert.equal(created.party.length, 0);
    assert.equal(created.hexMap.length, 0);
    assert.equal(created.sessionLog.length, 0);

    const fetched = await getCampaignById('storm-scarred-coast');
    assert.ok(fetched);
    assert.equal(fetched?.name, 'Storm Scarred Coast');

    // Add character.
    const updatedWithChar = await addCharacterToCampaign('storm-scarred-coast', buildCharacter());
    assert.equal(updatedWithChar.party.length, 1);
    assert.equal(updatedWithChar.party[0].name, 'Aria');

    // Update character.
    const updatedChar = await updateCharacterInCampaign('storm-scarred-coast', 'char-1', {
      momentum: 4,
      health: 3,
    });
    const pc = updatedChar.party.find((c) => c.characterId === 'char-1');
    assert.ok(pc);
    assert.equal(pc?.momentum, 4);
    assert.equal(pc?.health, 3);

    // Append log entry.
    const withLog = await appendSessionLogEntry('storm-scarred-coast', {
      logId: 'log-1',
      timestamp: new Date(),
      type: 'note',
      summary: 'Reached the coast.',
    });
    assert.equal(withLog.sessionLog.length, 1);
    assert.ok(withLog.sessionLog[0].logId);

    // Set hex map.
    const hexes: Hex[] = [
      { x: 0, y: 0, biome: 'forest', discovered: true },
      { x: 1, y: 0, biome: 'hills', discovered: false },
      { x: 0, y: 1, biome: 'swamp', discovered: false },
    ];
    const withHexes = await setHexMap('storm-scarred-coast', hexes);
    assert.equal(withHexes.hexMap.length, 3);
    assert.equal(withHexes.hexMap[1].biome, 'hills');

    console.log('campaignService tests passed');
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
}

runTests().catch((error) => {
  console.error('campaignService tests failed', error);
  process.exit(1);
});
