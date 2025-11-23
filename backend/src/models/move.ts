// Move definition model capturing narrative text and categorization.
import { ObjectId } from 'mongodb';
import { RulesetId } from './ruleset';

export type MoveCategory =
  | 'adventure'
  | 'relationship'
  | 'combat'
  | 'quest'
  | 'delve'
  | 'session'
  | 'other';

export type MoveRollType = 'action' | 'progress' | 'special';

export interface MoveOutcomes {
  strongHit: string;
  weakHit: string;
  miss: string;
}

export interface MoveTextBlock {
  summary: string;
  trigger: string;
  outcomes: MoveOutcomes;
}

export interface MoveDefinition {
  _id?: ObjectId;
  rulesetId: RulesetId;
  key: string;
  name: string;
  category: MoveCategory;
  rollType: MoveRollType;
  statsUsed?: string[];
  text: MoveTextBlock;
  rankOptions?: string[];
}
