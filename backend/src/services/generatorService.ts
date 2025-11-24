import { Types } from 'mongoose';
import { rollOracle } from './oracleService';
import {
  addLocationToCampaign,
  addNpcToCampaign,
  getCampaignById,
} from './campaignService';
import { Campaign, Location, Npc } from '../models/Campaign';

const oracleIds = {
  nameTables: ['ironsworn:name:ironlander_a', 'ironsworn:name:ironlander_b'],
  role: 'ironsworn:character:role',
  descriptor: 'ironsworn:character:descriptor',
  goal: 'ironsworn:character:goal',
  region: 'ironsworn:place:region',
  location: 'ironsworn:place:location',
  locationDescriptor: 'ironsworn:place:descriptor',
  settlementPrefix: 'ironsworn:settlement:quick_name_prefix',
  settlementSuffix: 'ironsworn:settlement:quick_name_suffix',
};

export interface GenerateNpcOptions {
  campaignId?: string;
  hex?: { x: number; y: number };
}

export interface GeneratedNpcResult {
  npc: Npc;
  campaign?: Campaign | null;
}

export interface GenerateLocationOptions {
  campaignId: string;
  hex: { x: number; y: number };
}

export interface GeneratedLocationResult {
  location: Location;
  campaign: Campaign;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function cleanResultText(text: string): string {
  // Remove markdown link formatting like [Text](id:...)
  return text.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
}

export async function generateNpc(options: GenerateNpcOptions = {}): Promise<GeneratedNpcResult> {
  const nameOracleId = pickRandom(oracleIds.nameTables);
  const nameRoll = await rollOracle(nameOracleId);
  const roleRoll = await rollOracle(oracleIds.role);
  const descriptorRoll = await rollOracle(oracleIds.descriptor);
  const goalRoll = await rollOracle(oracleIds.goal);

  const name = cleanResultText(nameRoll.row.result);
  const role = cleanResultText(roleRoll.row.result);
  const descriptor = cleanResultText(descriptorRoll.row.result);
  const goal = cleanResultText(goalRoll.row.result);

  const npc: Npc = {
    npcId: new Types.ObjectId().toString(),
    name,
    role,
    disposition: 'unknown',
    descriptors: [descriptor, goal],
    description: `A ${descriptor} ${role} who seeks to ${goal.toLowerCase()}.`,
    hex: options.hex,
    isImportant: true,
  };

  if (options.campaignId) {
    const campaign = await addNpcToCampaign(options.campaignId, npc);
    return { npc, campaign };
  }

  return { npc };
}

export async function generateLocation(
  options: GenerateLocationOptions
): Promise<GeneratedLocationResult> {
  if (!options.campaignId) {
    throw new Error('campaignId is required to generate a location');
  }
  if (!options.hex) {
    throw new Error('hex is required to generate a location');
  }

  const regionRoll = await rollOracle(oracleIds.region);
  const locationTypeRoll = await rollOracle(oracleIds.location);
  const descriptorRoll = await rollOracle(oracleIds.locationDescriptor);
  const prefixRoll = await rollOracle(oracleIds.settlementPrefix);
  const suffixRoll = await rollOracle(oracleIds.settlementSuffix);

  const region = cleanResultText(regionRoll.row.result);
  const locationType = cleanResultText(locationTypeRoll.row.result);
  const descriptor = cleanResultText(descriptorRoll.row.result);

  const prefix = cleanResultText(prefixRoll.row.result);
  const suffix = cleanResultText(suffixRoll.row.result);
  const name = `${prefix}${suffix}`;

  const location: Location = {
    locationId: new Types.ObjectId().toString(),
    name,
    type: locationType.toLowerCase(),
    hex: options.hex,
    summary: `A ${descriptor} ${locationType.toLowerCase()} in the ${region}.`,
    tags: [region, locationType, descriptor].map((t) => cleanResultText(t)),
  };

  const campaign = await addLocationToCampaign(options.campaignId, location);
  return { location, campaign };
}
