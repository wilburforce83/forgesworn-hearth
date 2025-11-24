import { request } from './http';
import type { GeneratedLocationResult, GeneratedNpcResult } from './types';

export interface GenerateNpcBody {
  campaignId?: string;
  hex?: { x: number; y: number };
}

export interface GenerateLocationBody {
  campaignId: string;
  hex: { x: number; y: number };
}

export async function generateNpc(body: GenerateNpcBody): Promise<GeneratedNpcResult> {
  return request<GeneratedNpcResult>('/generators/npc', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function generateLocation(
  body: GenerateLocationBody
): Promise<GeneratedLocationResult> {
  return request<GeneratedLocationResult>('/generators/location', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
