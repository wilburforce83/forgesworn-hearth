import { request } from './http';
import type { CampaignDto, CharacterDto } from './types';

export interface CampaignSummary {
  campaignId: string;
  name: string;
}

export interface CreateCampaignRequest {
  campaignId: string;
  name: string;
  worldTruths?: string[];
}

const STORAGE_KEY = 'fh_campaigns';

function readStoredCampaigns(): CampaignSummary[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CampaignSummary[]) : [];
  } catch {
    return [];
  }
}

function persistCampaigns(campaigns: CampaignSummary[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

function rememberCampaign(summary: CampaignSummary) {
  const current = readStoredCampaigns();
  const exists = current.find((c) => c.campaignId === summary.campaignId);
  if (exists) {
    exists.name = summary.name;
    persistCampaigns(current);
    return;
  }
  persistCampaigns([...current, summary]);
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  return readStoredCampaigns();
}

export async function createCampaign(body: CreateCampaignRequest): Promise<CampaignDto> {
  const created = await request<CampaignDto>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  rememberCampaign({ campaignId: created.campaignId, name: created.name });
  return created;
}

export async function getCampaign(campaignId: string): Promise<CampaignDto> {
  const campaign = await request<CampaignDto>(`/campaigns/${campaignId}`);
  rememberCampaign({ campaignId: campaign.campaignId, name: campaign.name });
  return campaign;
}

export async function addCharacter(
  campaignId: string,
  body: CharacterDto
): Promise<CampaignDto> {
  return request<CampaignDto>(`/campaigns/${campaignId}/party`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCharacter(
  campaignId: string,
  characterId: string,
  body: Partial<CharacterDto>
): Promise<CampaignDto> {
  return request<CampaignDto>(`/campaigns/${campaignId}/party/${characterId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
