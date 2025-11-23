import { strict as assert } from 'assert';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDb, getDb } from '../db/mongo';
import { MoveDefinition } from '../models/move';
import { rollMove } from '../services/moveService';

async function setupDatabase() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  const client = await connectToDb();
  const db = getDb();
  const moves = db.collection<MoveDefinition>('moves');

  await moves.insertOne({
    rulesetId: 'ironsworn-core' as any,
    key: 'test:move',
    name: 'Test Move',
    category: 'adventure',
    rollType: 'action',
    text: {
      summary: 'A simple move.',
      trigger: 'When you test the move.',
      outcomes: {
        strongHit: 'You do great.',
        weakHit: 'You do okay.',
        miss: 'It goes poorly.',
      },
    },
  });

  return { mongod, client };
}

async function runTests() {
  const { mongod, client } = await setupDatabase();
  try {
    // Auto roll should produce valid ranges.
    const auto = await rollMove('test:move', {});
    assert.ok(['strong_hit', 'weak_hit', 'miss'].includes(auto.outcome));
    assert.ok(auto.actionDie >= 1 && auto.actionDie <= 6, 'action die in range');
    assert.ok(auto.challengeDice[0] >= 1 && auto.challengeDice[0] <= 10, 'challenge1 in range');
    assert.ok(auto.challengeDice[1] >= 1 && auto.challengeDice[1] <= 10, 'challenge2 in range');
    assert.equal(
      auto.actionScore,
      auto.actionDie + (auto.statValue ?? 0) + auto.adds,
      'action score computed'
    );

    // Manual roll should use provided dice and compute weak hit.
    const manual = await rollMove('test:move', {
      statValue: 2,
      adds: 1,
      manualRolls: { action: 6, challenge1: 3, challenge2: 9 },
    });
    assert.equal(manual.actionDie, 6);
    assert.deepEqual(manual.challengeDice, [3, 9]);
    assert.equal(manual.actionScore, 9);
    assert.equal(manual.outcome, 'weak_hit');

    // Manual roll validation error.
    let manualError = false;
    try {
      await rollMove('test:move', {
        manualRolls: { action: 7, challenge1: 3, challenge2: 9 },
      });
    } catch (error) {
      manualError = true;
    }
    assert.ok(manualError, 'should error for invalid manual dice');

    // Missing move.
    let missingError = false;
    try {
      await rollMove('missing:move', {});
    } catch (error) {
      missingError = true;
    }
    assert.ok(missingError, 'should error for missing move');

    console.log('moveService tests passed');
  } finally {
    await client.close();
    await mongod.stop();
  }
}

runTests().catch((error) => {
  console.error('moveService tests failed', error);
  process.exit(1);
});
