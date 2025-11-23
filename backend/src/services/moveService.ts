// Move resolution service implementing Ironsworn action rolls.
import { getDb } from '../db/mongo';
import { MoveDefinition } from '../models/move';

export type MoveOutcome = 'strong_hit' | 'weak_hit' | 'miss';

export interface MoveRollInput {
  statKey?: string;
  statValue?: number;
  adds?: number;
  manualRolls?: {
    action: number;
    challenge1: number;
    challenge2: number;
  };
}

export interface MoveRollResult {
  moveId: string;
  moveName: string;
  outcome: MoveOutcome;
  isMatch: boolean;
  actionDie: number;
  challengeDice: [number, number];
  statKey?: string;
  statValue: number;
  adds: number;
  actionScore: number;
  text?: {
    strongHit?: string;
    weakHit?: string;
    miss?: string;
  };
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function validateManualRolls(manual?: MoveRollInput['manualRolls']): [number, number, number] | null {
  if (!manual) {
    return null;
  }

  const { action, challenge1, challenge2 } = manual;
  const allProvided =
    [action, challenge1, challenge2].every((v) => typeof v === 'number' && Number.isFinite(v));
  if (!allProvided) {
    throw new Error('Manual dice must provide action, challenge1, and challenge2 values.');
  }

  if (
    !Number.isInteger(action) ||
    action < 1 ||
    action > 6 ||
    !Number.isInteger(challenge1) ||
    challenge1 < 1 ||
    challenge1 > 10 ||
    !Number.isInteger(challenge2) ||
    challenge2 < 1 ||
    challenge2 > 10
  ) {
    throw new Error('Manual dice must be integers in the ranges: action 1-6, challenge 1-10');
  }

  return [action, challenge1, challenge2];
}

function deriveOutcome(actionScore: number, challenge1: number, challenge2: number): MoveOutcome {
  const wins =
    (actionScore > challenge1 ? 1 : 0) +
    (actionScore > challenge2 ? 1 : 0);

  if (wins === 2) return 'strong_hit';
  if (wins === 1) return 'weak_hit';
  return 'miss';
}

function extractOutcomeText(move: MoveDefinition) {
  const outcomes = move.text?.outcomes;
  if (!outcomes) return undefined;
  return {
    strongHit: outcomes.strongHit,
    weakHit: outcomes.weakHit,
    miss: outcomes.miss,
  };
}

export async function rollMove(moveId: string, input: MoveRollInput = {}): Promise<MoveRollResult> {
  const db = getDb();
  const collection = db.collection<MoveDefinition>('moves');
  const move = await collection.findOne({ key: moveId });

  if (!move) {
    throw new Error(`Move not found for id: ${moveId}`);
  }

  const statValue = input.statValue ?? 0;
  const adds = input.adds ?? 0;

  const manual = validateManualRolls(input.manualRolls);
  const actionDie = manual ? manual[0] : rollDie(6);
  const challenge1 = manual ? manual[1] : rollDie(10);
  const challenge2 = manual ? manual[2] : rollDie(10);

  const actionScore = actionDie + statValue + adds;
  const outcome = deriveOutcome(actionScore, challenge1, challenge2);
  const isMatch = challenge1 === challenge2;

  return {
    moveId: move.key,
    moveName: move.name,
    outcome,
    isMatch,
    actionDie,
    challengeDice: [challenge1, challenge2],
    statKey: input.statKey,
    statValue,
    adds,
    actionScore,
    text: extractOutcomeText(move),
  };
}
