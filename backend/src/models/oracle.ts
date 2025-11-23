// Oracle table model for structured random prompts and nested tables.
import { ObjectId } from 'mongodb';
import { RulesetId } from './ruleset';

export interface OracleEntry {
  min: number;
  max: number;
  result: string;
  tags?: string[];
  nextTableId?: string;
}

export interface OracleTable {
  _id?: ObjectId;
  rulesetId: RulesetId;
  oracleId: string;
  group: string;
  name: string;
  dice: string;
  entries: OracleEntry[];
  description?: string;
}
