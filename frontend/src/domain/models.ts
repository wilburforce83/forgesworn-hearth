// Shared front-end domain models for Ironsworn data.
// These mirror backend DTOs but add a few conveniences for UI state.
import type { CampaignDto, CharacterDto, HexDto, LocationDto, MoveOutcome, SessionLogEntryDto } from '../api/types';
import type { HexCoord } from '../game/hexCoords';

export type Rank = 'troublesome' | 'dangerous' | 'formidable' | 'extreme' | 'epic';

export interface ProgressTrack {
  id: string;
  title: string;
  description?: string;
  rank: Rank;
  type: 'vow' | 'journey' | 'combat' | 'delve' | 'legacy' | 'threat';
  progress: number; // 0-10 boxes
  status: 'active' | 'fulfilled' | 'forsaken';
  campaignId?: string;
  characterId?: string;
  linkedHex?: HexCoord;
}

export interface AssetInstance {
  id: string;
  name: string;
  notes?: string;
  enabledAbilities?: number[];
}

export interface Character extends CharacterDto {
  pronouns?: string;
  background?: string;
  bonds?: number;
  portraitUrl?: string;
  assetsDetailed?: AssetInstance[];
  campaignId?: string;
}

export interface Site extends LocationDto {
  rank?: Rank;
  themeId?: string;
  domainId?: string;
  progress?: number;
  discoveries?: string[];
  dangers?: string[];
}

export interface MapTile extends HexDto {
  notes?: string;
  siteIds?: string[];
}

export interface SessionLogEntry extends SessionLogEntryDto {
  type:
    | 'move'
    | 'oracle'
    | 'progress'
    | 'map'
    | 'site'
    | 'note'
    | 'dice'
    | string;
  summary: string;
  details?: string;
}

export interface Campaign extends CampaignDto {
  description?: string;
  truths?: string[];
  vows?: ProgressTrack[];
  activeSites?: Site[];
}

export interface DiceResult {
  outcome: MoveOutcome;
  actionDie: number;
  challenge: [number, number];
  actionScore: number;
}
