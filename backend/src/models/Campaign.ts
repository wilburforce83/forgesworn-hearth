import { Schema, Types, model, models, Document } from 'mongoose';

export interface Character {
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
  debilities?: {
    wounded?: boolean;
    shaken?: boolean;
    unprepared?: boolean;
    encumbered?: boolean;
    maimed?: boolean;
    corrupted?: boolean;
  };
  assets: {
    assetId: string;
  }[];
  vows: {
    vowId: string;
    name: string;
    rank: 'troublesome' | 'dangerous' | 'formidable' | 'extreme' | 'epic';
    progress: number;
    fulfilled: boolean;
    forsaken: boolean;
  }[];
  notes?: string;
}

export interface Hex {
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

export interface SessionLogEntry {
  logId: string;
  timestamp: Date;
  type: string;
  playerName?: string;
  characterId?: string;
  moveId?: string;
  oracleId?: string;
  summary: string;
  details?: string;
}

export interface Npc {
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

export interface Location {
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

export interface Campaign extends Document {
  campaignId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  worldTruths?: string[];
  party: Character[];
  hexMap: Hex[];
  sessionLog: SessionLogEntry[];
  npcs: Npc[];
  locations: Location[];
}

const CharacterSchema = new Schema<Character>(
  {
    characterId: { type: String, required: true },
    name: { type: String, required: true },
    edge: { type: Number, required: true },
    heart: { type: Number, required: true },
    iron: { type: Number, required: true },
    shadow: { type: Number, required: true },
    wits: { type: Number, required: true },
    health: { type: Number, required: true },
    spirit: { type: Number, required: true },
    supply: { type: Number, required: true },
    momentum: { type: Number, required: true },
    momentumMax: { type: Number, required: true },
    momentumReset: { type: Number, required: true },
    debilities: {
      wounded: Boolean,
      shaken: Boolean,
      unprepared: Boolean,
      encumbered: Boolean,
      maimed: Boolean,
      corrupted: Boolean,
    },
    assets: [
      new Schema(
        {
          assetId: { type: String, required: true },
        },
        { _id: false }
      ),
    ],
    vows: [
      new Schema(
        {
          vowId: { type: String, required: true },
          name: { type: String, required: true },
          rank: {
            type: String,
            enum: ['troublesome', 'dangerous', 'formidable', 'extreme', 'epic'],
            required: true,
          },
          progress: { type: Number, required: true },
          fulfilled: { type: Boolean, default: false },
          forsaken: { type: Boolean, default: false },
        },
        { _id: false }
      ),
    ],
    notes: { type: String },
  },
  { _id: false }
);

const HexSchema = new Schema<Hex>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    biome: { type: String, required: true },
    elevation: { type: String },
    settlementName: { type: String },
    siteName: { type: String },
    siteDomain: { type: String },
    siteTheme: { type: String },
    rivers: [{ type: Number }],
    discovered: { type: Boolean, default: false },
  },
  { _id: false }
);

const SessionLogEntrySchema = new Schema<SessionLogEntry>(
  {
    logId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    type: { type: String, required: true },
    playerName: { type: String },
    characterId: { type: String },
    moveId: { type: String },
    oracleId: { type: String },
    summary: { type: String, required: true },
    details: { type: String },
  },
  { _id: false }
);

const NpcSchema = new Schema<Npc>(
  {
    npcId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String },
    disposition: { type: String, enum: ['friendly', 'neutral', 'hostile', 'unknown'] },
    descriptors: [{ type: String }],
    description: { type: String },
    locationId: { type: String },
    hex: {
      x: { type: Number },
      y: { type: Number },
    },
    isFoe: { type: Boolean },
    isImportant: { type: Boolean },
  },
  { _id: false }
);

const LocationSchema = new Schema<Location>(
  {
    locationId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    summary: { type: String },
    description: { type: String },
    hex: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    tags: [{ type: String }],
    siteDomain: { type: String },
    siteTheme: { type: String },
  },
  { _id: false }
);

const CampaignSchema = new Schema<Campaign>(
  {
    campaignId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    worldTruths: [{ type: String }],
    party: { type: [CharacterSchema], default: [] },
    hexMap: { type: [HexSchema], default: [] },
    sessionLog: { type: [SessionLogEntrySchema], default: [] },
    npcs: { type: [NpcSchema], default: [] },
    locations: { type: [LocationSchema], default: [] },
  },
  { timestamps: true }
);

const CampaignModel = models.Campaign || model<Campaign>('Campaign', CampaignSchema);
export default CampaignModel;
