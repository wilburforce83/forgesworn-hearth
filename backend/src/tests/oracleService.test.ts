import { strict as assert } from 'assert';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDb, getDb } from '../db/mongo';
import { rollOracle } from '../services/oracleService';

async function setupDatabase() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  const client = await connectToDb();
  const db = getDb();
  const oracles = db.collection('oracles');

  await oracles.insertMany([
    {
      oracleId: 'test:base',
      name: 'Base Oracle',
      dice: '1d100',
      entries: [
        { min: 1, max: 50, result: 'low' },
        { min: 51, max: 100, result: 'high' },
      ],
    },
    {
      oracleId: 'test:partial',
      name: 'Partial Oracle',
      dice: '1d100',
      entries: [{ min: 21, max: 30, result: 'mid' }],
      fallback: [{ range: [1, 20], oracleId: 'test:base' }],
    },
    {
      oracleId: 'test:broken',
      name: 'Broken Oracle',
      dice: '1d10',
      entries: [{ min: 1, max: 5, result: 'only-half' }],
    },
  ]);

  return { mongod, client };
}

async function runTests() {
  const { mongod, client } = await setupDatabase();

  try {
    // Fixed roll should return deterministic row.
    const fixed = await rollOracle('test:base', { fixedRoll: 1 });
    assert.equal(fixed.roll, 1, 'roll should reflect provided value');
    assert.equal(fixed.row.result, 'low', 'expected first row on low roll');

    // Fixed roll validation.
    let invalidLow = false;
    try {
      await rollOracle('test:base', { fixedRoll: 0 });
    } catch (error) {
      invalidLow = true;
    }
    assert.ok(invalidLow, 'expected error for roll below range');

    let invalidHigh = false;
    try {
      await rollOracle('test:base', { fixedRoll: 101 });
    } catch (error) {
      invalidHigh = true;
    }
    assert.ok(invalidHigh, 'expected error for roll above range');

    // Fallback should resolve and surface resolvedFrom.
    const fallback = await rollOracle('test:partial', { fixedRoll: 10 });
    assert.equal(fallback.row.result, 'low', 'fallback should reuse base oracle');
    assert.equal(fallback.resolvedFrom, 'test:partial');

    // Missing oracle should throw.
    let missingErr = false;
    try {
      await rollOracle('test:missing');
    } catch (error) {
      missingErr = true;
    }
    assert.ok(missingErr, 'expected error when oracle is missing');

    // Unmatched roll without fallback should throw.
    let unmatchedErr = false;
    try {
      await rollOracle('test:broken', { fixedRoll: 10 });
    } catch (error) {
      unmatchedErr = true;
    }
    assert.ok(unmatchedErr, 'expected error when no row matches roll');

    console.log('oracleService tests passed');
  } finally {
    await client.close();
    await mongod.stop();
  }
}

runTests().catch((error) => {
  console.error('oracleService tests failed', error);
  process.exit(1);
});
