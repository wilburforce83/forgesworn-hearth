import mongoose, { Types } from 'mongoose';
import CampaignModel, { Campaign, Character, SessionLogEntry, Hex } from '../models/Campaign';

let connectPromise: Promise<typeof mongoose> | null = null;

async function ensureMongooseConnection(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in environment variables');
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(uri);
  }
  await connectPromise;
}

export async function createCampaign(input: {
  campaignId: string;
  name: string;
  worldTruths?: string[];
}): Promise<Campaign> {
  await ensureMongooseConnection();
  const existing = await CampaignModel.findOne({ campaignId: input.campaignId });
  if (existing) {
    throw new Error(`Campaign already exists with id: ${input.campaignId}`);
  }
  const campaign = new CampaignModel({
    campaignId: input.campaignId,
    name: input.name,
    worldTruths: input.worldTruths ?? [],
    party: [],
    hexMap: [],
    sessionLog: [],
  });
  return campaign.save();
}

export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  await ensureMongooseConnection();
  return CampaignModel.findOne({ campaignId });
}

export async function addCharacterToCampaign(
  campaignId: string,
  character: Character
): Promise<Campaign> {
  await ensureMongooseConnection();
  const campaign = await CampaignModel.findOne({ campaignId });
  if (!campaign) {
    throw new Error(`Campaign not found for id: ${campaignId}`);
  }

  const newCharacter = { ...character };
  newCharacter.characterId = newCharacter.characterId ?? new Types.ObjectId().toString();

  if (campaign.party.some((c: Character) => c.characterId === newCharacter.characterId)) {
    throw new Error(`Character already exists with id: ${newCharacter.characterId}`);
  }

  campaign.party.push(newCharacter);
  await campaign.save();
  return campaign;
}

export async function updateCharacterInCampaign(
  campaignId: string,
  characterId: string,
  updates: Partial<Character>
): Promise<Campaign> {
  await ensureMongooseConnection();
  const campaign = await CampaignModel.findOne({ campaignId });
  if (!campaign) {
    throw new Error(`Campaign not found for id: ${campaignId}`);
  }

  const idx = campaign.party.findIndex((c: Character) => c.characterId === characterId);
  if (idx === -1) {
    throw new Error(`Character not found with id: ${characterId}`);
  }

  const target = campaign.party[idx] as unknown as Character;
  Object.assign(target, updates);
  target.characterId = characterId;
  await campaign.save();
  return campaign;
}

export async function appendSessionLogEntry(
  campaignId: string,
  entry: SessionLogEntry
): Promise<Campaign> {
  await ensureMongooseConnection();
  const campaign = await CampaignModel.findOne({ campaignId });
  if (!campaign) {
    throw new Error(`Campaign not found for id: ${campaignId}`);
  }

  const logEntry = { ...entry };
  logEntry.logId = logEntry.logId ?? new Types.ObjectId().toString();
  logEntry.timestamp = logEntry.timestamp ? new Date(logEntry.timestamp) : new Date();
  campaign.sessionLog.push(logEntry);
  await campaign.save();
  return campaign;
}

export async function setHexMap(campaignId: string, hexMap: Hex[]): Promise<Campaign> {
  await ensureMongooseConnection();
  const campaign = await CampaignModel.findOne({ campaignId });
  if (!campaign) {
    throw new Error(`Campaign not found for id: ${campaignId}`);
  }

  campaign.hexMap = hexMap;
  await campaign.save();
  return campaign;
}
