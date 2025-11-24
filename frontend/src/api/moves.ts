import { request } from './http';
import type { MoveRollRequest, MoveRollResult } from './types';

export async function rollMove(moveId: string, body: MoveRollRequest = {}): Promise<MoveRollResult> {
  return request<MoveRollResult>(`/moves/${moveId}/roll`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
