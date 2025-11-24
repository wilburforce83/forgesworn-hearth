import { request } from './http';
import type { RevealHexAreaResult } from './types';

export interface RevealHexPayload {
  x: number;
  y: number;
  allowPoi?: boolean;
}

export async function revealHexArea(
  campaignId: string,
  payload: RevealHexPayload
): Promise<RevealHexAreaResult> {
  return request<RevealHexAreaResult>(`/hex/${campaignId}/reveal-area`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
