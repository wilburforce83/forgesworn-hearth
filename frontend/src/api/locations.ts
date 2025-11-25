import { request } from './http';
import type { CampaignDto, LocationDto } from './types';

export async function addLocation(campaignId: string, body: LocationDto): Promise<CampaignDto> {
  return request<CampaignDto>(`/campaigns/${campaignId}/locations`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateLocation(
  campaignId: string,
  locationId: string,
  body: Partial<LocationDto>
): Promise<CampaignDto> {
  return request<CampaignDto>(`/campaigns/${campaignId}/locations/${locationId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function removeLocation(campaignId: string, locationId: string): Promise<CampaignDto> {
  return request<CampaignDto>(`/campaigns/${campaignId}/locations/${locationId}`, {
    method: 'DELETE',
  });
}
