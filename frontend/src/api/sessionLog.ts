import { request } from './http';
import type { SessionLogEntryDto, CampaignDto } from './types';

export async function appendSessionLogEntry(
  campaignId: string,
  entry: SessionLogEntryDto
): Promise<CampaignDto> {
  return request<CampaignDto>(`/campaigns/${campaignId}/log`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}
