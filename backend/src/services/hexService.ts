import mongoose, { Types } from 'mongoose';
import CampaignModel, { Campaign, Hex, Location, Npc } from '../models/Campaign';
import { rollOracle } from './oracleService';
import { generateLocation, generateNpc } from './generatorService';

const HEX_ORACLES = {
  region: 'ironsworn:place:region',
};

const NEIGHBOR_OFFSETS: Array<{ dx: number; dy: number }> = [
  { dx: 1, dy: 0 },
  { dx: 1, dy: -1 },
  { dx: 0, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: 1 },
  { dx: 0, dy: 1 },
];

export interface RevealHexAreaOptions {
  campaignId: string;
  x: number;
  y: number;
  allowPoi?: boolean;
}

export interface RevealHexAreaResult {
  campaign: Campaign;
  hexes: Hex[];
  generatedLocations?: Location[];
  generatedNpcs?: Npc[];
}

async function ensureMongooseConnection(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in environment variables');
  }
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
}

function findHex(campaign: Campaign, x: number, y: number): Hex | undefined {
  return campaign.hexMap.find((h) => h.x === x && h.y === y);
}

async function ensureHexAt(
  campaign: Campaign,
  x: number,
  y: number,
  allowPoi: boolean
): Promise<{
  hex: Hex;
  generatedLocation?: Location;
  generatedNpc?: Npc;
}> {
  const existing = findHex(campaign, x, y);
  if (existing) {
    if (!existing.discovered) {
      existing.discovered = true;
    }
    return { hex: existing };
  }

  const regionRoll = await rollOracle(HEX_ORACLES.region);
  const biome = regionRoll.row.result;

  const newHex: Hex = {
    x,
    y,
    biome,
    discovered: true,
  };

  let generatedLocation: Location | undefined;
  let generatedNpc: Npc | undefined;

  if (allowPoi) {
    const poiRoll = Math.floor(Math.random() * 100) + 1;
    if (poiRoll <= 30) {
      const locResult = await generateLocation({
        campaignId: campaign.campaignId,
        hex: { x, y },
      });
      generatedLocation = locResult.location;
      const loc = generatedLocation;
      if (loc) {
        if (!campaign.locations.some((l) => l.locationId === loc.locationId)) {
          campaign.locations.push(loc);
        }
        newHex.settlementName = loc.name;
      }
    }

    const npcRoll = Math.floor(Math.random() * 100) + 1;
    if (npcRoll <= 20) {
      const npcResult = await generateNpc({ campaignId: campaign.campaignId, hex: { x, y } });
      if (npcResult.npc) {
        generatedNpc = npcResult.npc;
        const npc = generatedNpc;
        if (npc && !campaign.npcs.some((n) => n.npcId === npc.npcId)) {
          campaign.npcs.push(npc);
        }
      }
    }
  }

  campaign.hexMap.push(newHex);

  return { hex: newHex, generatedLocation, generatedNpc };
}

export async function revealHexArea(options: RevealHexAreaOptions): Promise<RevealHexAreaResult> {
  await ensureMongooseConnection();
  const campaign = await CampaignModel.findOne({ campaignId: options.campaignId });
  if (!campaign) {
    throw new Error(`Campaign not found for id: ${options.campaignId}`);
  }

  const allowPoi = options.allowPoi ?? true;
  const coords = [
    { x: options.x, y: options.y },
    ...NEIGHBOR_OFFSETS.map((o) => ({ x: options.x + o.dx, y: options.y + o.dy })),
  ];

  const hexes: Hex[] = [];
  const generatedLocations: Location[] = [];
  const generatedNpcs: Npc[] = [];

  for (const coord of coords) {
    const result = await ensureHexAt(campaign, coord.x, coord.y, allowPoi);
    hexes.push(result.hex);
    if (result.generatedLocation) generatedLocations.push(result.generatedLocation);
    if (result.generatedNpc) generatedNpcs.push(result.generatedNpc);
  }

  await campaign.save();

  return {
    campaign,
    hexes,
    generatedLocations: generatedLocations.length ? generatedLocations : undefined,
    generatedNpcs: generatedNpcs.length ? generatedNpcs : undefined,
  };
}
