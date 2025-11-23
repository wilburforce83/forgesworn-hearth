// Log entry model capturing move results, oracles, and narrative notes.
import { ObjectId } from 'mongodb';

export type LogType =
  | 'moveResult'
  | 'oracleResult'
  | 'llmNarration'
  | 'playerNarrative'
  | 'gmNote'
  | 'system';

export interface LogLinks {
  characterIds?: ObjectId[];
  entityIds?: ObjectId[];
  tileId?: ObjectId;
  vowId?: ObjectId;
}

export interface LogEntry {
  _id?: ObjectId;
  campaignId: ObjectId;
  sceneId?: ObjectId;
  type: LogType;
  createdAt: Date;
  text?: string;
  moveKey?: string;
  oracleId?: string;
  links?: LogLinks;
  payload?: any;
}
