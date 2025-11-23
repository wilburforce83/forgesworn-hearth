// Asset definition model for paths, companions, combat talents, rituals, etc.
import { ObjectId } from 'mongodb';
import { RulesetId } from './ruleset';

export type AssetType = 'path' | 'companion' | 'combat_talent' | 'ritual' | 'other';

export interface AssetAbility {
  index: number;
  text: string;
  requiresCheckbox?: boolean;
}

export interface AssetDefinition {
  _id?: ObjectId;
  rulesetId: RulesetId;
  assetId: string;
  name: string;
  type: AssetType;
  category?: string;
  abilities: AssetAbility[];
  summary?: string;
  source?: string;
}
