// Dice utilities with crypto-backed randomness when available.
import type { MoveOutcome } from '../api/types';

function randomInt(max: number): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return Number(array[0] % max);
  }
  return Math.floor(Math.random() * max);
}

export function rollDie(sides: number): number {
  return randomInt(sides) + 1;
}

export function rollD6(): number {
  return rollDie(6);
}

export function rollD10(): number {
  return rollDie(10);
}

export interface ActionRollResult {
  actionDie: number;
  challenge: [number, number];
  actionScore: number;
  outcome: MoveOutcome;
  isMatch: boolean;
}

export function rollAction(statValue: number, bonus = 0): ActionRollResult {
  const actionDie = rollD6();
  const c1 = rollD10();
  const c2 = rollD10();
  const actionScore = actionDie + statValue + bonus;
  const wins = (actionScore > c1 ? 1 : 0) + (actionScore > c2 ? 1 : 0);
  const outcome: MoveOutcome = wins === 2 ? 'strong_hit' : wins === 1 ? 'weak_hit' : 'miss';
  return {
    actionDie,
    challenge: [c1, c2],
    actionScore,
    outcome,
    isMatch: c1 === c2,
  };
}

export function rollProgress(progressScore: number): ActionRollResult {
  const c1 = rollD10();
  const c2 = rollD10();
  const wins = (progressScore > c1 ? 1 : 0) + (progressScore > c2 ? 1 : 0);
  const outcome: MoveOutcome = wins === 2 ? 'strong_hit' : wins === 1 ? 'weak_hit' : 'miss';
  return {
    actionDie: 0,
    challenge: [c1, c2],
    actionScore: progressScore,
    outcome,
    isMatch: c1 === c2,
  };
}
