// Entity models representing campaign actors, places, and items.
import { ObjectId } from 'mongodb';

export type EntityType =
  | 'npc'
  | 'foe'
  | 'location'
  | 'site'
  | 'settlement'
  | 'faction'
  | 'item'
  | 'encounter';

export type ChallengeRank = 'Troublesome' | 'Dangerous' | 'Formidable' | 'Extreme' | 'Epic';

export interface OriginInfo {
  firstSeenLogId?: ObjectId;
  createdFromOracles?: {
    oracleId: string;
    roll: number;
    result: string;
  }[];
}

export interface BaseEntity {
  _id?: ObjectId;
  campaignId: ObjectId;
  type: EntityType;
  name: string;
  tags: string[];
  origin?: OriginInfo;
  summary?: string;
}

export interface NpcEntity extends BaseEntity {
  type: 'npc';
  relationship?: {
    bonded?: boolean;
    trust?: number;
  };
  role?: string;
}

export interface FoeEntity extends BaseEntity {
  type: 'foe';
  rank?: ChallengeRank;
  threat?: string;
}

export interface LocationEntity extends BaseEntity {
  type: 'location';
  rank?: ChallengeRank;
  tileId?: ObjectId;
  domain?: string;
  theme?: string;
}

export interface SiteEntity extends BaseEntity {
  type: 'site';
  rank?: ChallengeRank;
  tileId?: ObjectId;
  domain?: string;
  theme?: string;
}

export interface SettlementEntity extends BaseEntity {
  type: 'settlement';
  rank?: ChallengeRank;
  population?: string;
  tileId?: ObjectId;
  domain?: string;
  theme?: string;
}

export interface FactionEntity extends BaseEntity {
  type: 'faction';
  influence?: string;
}

export interface ItemEntity extends BaseEntity {
  type: 'item';
  rarity?: string;
}

export interface EncounterEntity extends BaseEntity {
  type: 'encounter';
  rank?: ChallengeRank;
  situation?: string;
}

export type Entity =
  | NpcEntity
  | FoeEntity
  | LocationEntity
  | SiteEntity
  | SettlementEntity
  | FactionEntity
  | ItemEntity
  | EncounterEntity;
