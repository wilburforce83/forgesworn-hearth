export type MoveOutcome = 'strong_hit' | 'weak_hit' | 'miss';

export interface VowDto {
  vowId: string;
  name: string;
  rank: 'troublesome' | 'dangerous' | 'formidable' | 'extreme' | 'epic';
  progress: number;
  fulfilled: boolean;
  forsaken: boolean;
}

export interface AssetRef {
  assetId: string;
}

export interface Debilities {
  wounded?: boolean;
  shaken?: boolean;
  unprepared?: boolean;
  encumbered?: boolean;
  maimed?: boolean;
  corrupted?: boolean;
}

export interface CharacterDto {
  characterId: string;
  name: string;
  edge: number;
  heart: number;
  iron: number;
  shadow: number;
  wits: number;
  health: number;
  spirit: number;
  supply: number;
  momentum: number;
  momentumMax: number;
  momentumReset: number;
  debilities?: Debilities;
  assets: AssetRef[];
  vows: VowDto[];
  notes?: string;
}

export interface HexDto {
  x: number;
  y: number;
  biome: string;
  elevation?: string;
  settlementName?: string;
  siteName?: string;
  siteDomain?: string;
  siteTheme?: string;
  rivers?: number[];
  discovered: boolean;
}

export interface SessionLogEntryDto {
  logId: string;
  timestamp: string;
  type: string;
  playerName?: string;
  characterId?: string;
  moveId?: string;
  oracleId?: string;
  summary: string;
  details?: string;
}

export interface NpcDto {
  npcId: string;
  name: string;
  role?: string;
  disposition?: 'friendly' | 'neutral' | 'hostile' | 'unknown';
  descriptors?: string[];
  description?: string;
  locationId?: string;
  hex?: { x: number; y: number };
  isFoe?: boolean;
  isImportant?: boolean;
}

export interface LocationDto {
  locationId: string;
  name: string;
  type: string;
  summary?: string;
  description?: string;
  hex: { x: number; y: number };
  tags?: string[];
  siteDomain?: string;
  siteTheme?: string;
}

export interface CampaignDto {
  campaignId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  worldTruths?: string[];
  party: CharacterDto[];
  hexMap: HexDto[];
  sessionLog: SessionLogEntryDto[];
  npcs: NpcDto[];
  locations: LocationDto[];
}

export interface MoveRollRequest {
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

export interface OracleRollResult {
  oracleId: string;
  oracleName: string;
  roll: number;
  row: Record<string, unknown> & { result?: string };
  resolvedFrom?: string;
}

export interface GeneratedNpcResult {
  npc: NpcDto;
  campaign?: CampaignDto | null;
}

export interface GeneratedLocationResult {
  location: LocationDto;
  campaign: CampaignDto;
}

export interface RevealHexAreaResult {
  campaign: CampaignDto;
  hexes: HexDto[];
  generatedLocations?: LocationDto[];
  generatedNpcs?: NpcDto[];
}
