// Oracle resolution service for rolling oracle tables from Mongo.
import { Collection } from 'mongodb';
import { getDb } from '../db/mongo';
import { OracleEntry, OracleTable } from '../models/oracle';

export interface OracleTableRow extends OracleEntry {
  [key: string]: unknown;
}

export interface OracleDefinition extends OracleTable {
  entries: OracleTableRow[];
  fallback?: Array<{
    range: [number, number];
    oracleId: string;
  }>;
}

export interface OracleRollOptions {
  fixedRoll?: number;
  /** Internal: prevent cycles when following fallbacks. */
  visited?: Set<string>;
}

export interface OracleRollResult {
  oracleId: string;
  oracleName: string;
  roll: number;
  row: OracleTableRow;
  /** Populated when a fallback oracle resolved the roll. */
  resolvedFrom?: string;
}

function parseRange(row: OracleTableRow): { min: number; max: number } {
  const min = (row as any).min ?? (row as any).floor;
  const max = (row as any).max ?? (row as any).ceiling;
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new Error('Oracle row is missing numeric min/max fields');
  }
  return { min, max };
}

function parseDice(dice?: string, entries?: OracleTableRow[]): number {
  if (dice) {
    const match = dice.match(/1d(\\d+)/i);
    if (match) {
      return Number(match[1]);
    }
  }

  if (entries && entries.length > 0) {
    return Math.max(...entries.map((row) => parseRange(row).max));
  }

  return 100;
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

async function loadOracle(collection: Collection<OracleDefinition>, oracleId: string) {
  const oracle = await collection.findOne({ oracleId });
  if (!oracle) {
    throw new Error(`Oracle not found for id: ${oracleId}`);
  }
  return oracle;
}

function findMatchingRow(entries: OracleTableRow[], roll: number): OracleTableRow | null {
  for (const row of entries) {
    const { min, max } = parseRange(row);
    if (roll >= min && roll <= max) {
      return row;
    }
  }
  return null;
}

export async function rollOracle(
  oracleId: string,
  options: OracleRollOptions = {}
): Promise<OracleRollResult> {
  const db = getDb();
  const collection = db.collection<OracleDefinition>('oracles');
  const oracle = await loadOracle(collection, oracleId);

  const maxRoll = parseDice(oracle.dice, oracle.entries);
  const roll = options.fixedRoll ?? rollDie(maxRoll);

  const matchedRow = findMatchingRow(oracle.entries, roll);
  if (matchedRow) {
    return {
      oracleId: oracle.oracleId,
      oracleName: oracle.name,
      roll,
      row: matchedRow,
    };
  }

  if (oracle.fallback && oracle.fallback.length > 0) {
    const fallbackRange = oracle.fallback.find(
      (fb) => roll >= fb.range[0] && roll <= fb.range[1]
    );

    if (fallbackRange) {
      const visited = options.visited ?? new Set<string>();
      if (visited.has(oracleId)) {
        throw new Error(`Circular oracle fallback detected for id: ${oracleId}`);
      }
      visited.add(oracleId);
      const fallbackResult = await rollOracle(fallbackRange.oracleId, {
        ...options,
        fixedRoll: roll,
        visited,
      });
      return {
        ...fallbackResult,
        resolvedFrom: oracleId,
      };
    }
  }

  throw new Error(`No oracle row matched roll ${roll} for oracle ${oracleId}`);
}
