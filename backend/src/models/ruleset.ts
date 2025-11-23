// Ruleset metadata definition to support Ironsworn and future variants.
import { ObjectId } from 'mongodb';

export type RulesetId = 'ironsworn-core' | 'starforged-core' | 'sundered-isles' | string;

export interface DiceConfig {
  action: { sides: number; count: number };
  challenge: { sides: number; count: number };
}

export interface Ruleset {
  _id?: ObjectId;
  rulesetId: RulesetId;
  name: string;
  version: string;
  dice: DiceConfig;
  moveSetKeys: string[];
  oracleTableIds: string[];
  assetPackIds: string[];
  metadata?: {
    theme?: string;
    description?: string;
  };
}
