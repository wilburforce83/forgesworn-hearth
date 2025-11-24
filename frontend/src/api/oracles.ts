import { request } from './http';
import type { OracleRollResult } from './types';

export async function rollOracle(oracleId: string, manualRoll?: number): Promise<OracleRollResult> {
  const query = manualRoll ? `?roll=${manualRoll}` : '';
  return request<OracleRollResult>(`/oracles/${oracleId}/roll${query}`);
}
