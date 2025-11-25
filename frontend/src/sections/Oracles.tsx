import { useState } from 'react';
import { rollOracle } from '../api/oracles';
import type { OracleRollResult } from '../api/types';
import type { AppRoute } from '../navigation';
import { useStore } from '../store';

interface OraclesProps {
  campaignId?: string;
  onNavigate: (route: AppRoute) => void;
}

const QUICK_ORACLES = [
  { id: 'ironsworn:action', label: 'Action' },
  { id: 'ironsworn:theme', label: 'Theme' },
  { id: 'ironsworn:character:descriptor', label: 'Character descriptor' },
  { id: 'ironsworn:place:location', label: 'Location' },
];

export function OraclesSection({ campaignId, onNavigate }: OraclesProps) {
  const { addLogEntry } = useStore();
  const [oracleId, setOracleId] = useState(QUICK_ORACLES[0]?.id ?? '');
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<OracleRollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoll: React.FormEventHandler = async (evt) => {
    evt.preventDefault();
    if (!oracleId) return;
    setRolling(true);
    setError(null);
    try {
      const res = await rollOracle(oracleId);
      setResult(res);
      if (campaignId) {
        await addLogEntry(campaignId, {
          logId: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'oracle',
          oracleId,
          summary: `${res.oracleName} → ${res.roll}`,
          details: (res.row as any).result ?? JSON.stringify(res.row),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll oracle');
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="stack">
      <div className="surface stack">
        <h2>Oracles</h2>
        <p className="muted">
          Browse oracle trees, roll directly, and chain secondary tables. Results will pipe into the session log.
        </p>
        <div className="grid grid-large">
          <div className="list-card stack">
            <strong>Browse</strong>
            <p className="muted">Action/Theme, Character, Location, Delve, Combat, and misc tables.</p>
          </div>
          <div className="list-card stack">
            <strong>Search & tags</strong>
            <p className="muted">Filter by name or tag to quickly find an oracle mid-session.</p>
          </div>
          <div className="list-card stack">
            <strong>Logging</strong>
            <p className="muted">Each roll records the oracle ID, roll value, and resulting text.</p>
          </div>
        </div>
        <div className="inline-controls">
          <button type="button" className="secondary" onClick={() => onNavigate({ section: 'moves' })}>
            Use with moves
          </button>
          <button type="button" className="secondary" onClick={() => onNavigate({ section: 'log' })}>
            View log
          </button>
        </div>
      </div>

      <div className="surface stack">
        <h3>Quick oracle</h3>
        <form className="inline-controls" onSubmit={handleRoll}>
          <select value={oracleId} onChange={(e) => setOracleId(e.target.value)}>
            {QUICK_ORACLES.map((oracle) => (
              <option key={oracle.id} value={oracle.id}>
                {oracle.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={rolling}>
            {rolling ? 'Rolling…' : 'Roll'}
          </button>
          {error && <span className="error">{error}</span>}
        </form>
        {result && (
          <div className="list-card stack">
            <strong>
              {result.oracleName} ({result.roll})
            </strong>
            <p>{(result.row as any).result ?? JSON.stringify(result.row)}</p>
            {result.resolvedFrom && <p className="muted">Resolved via {result.resolvedFrom}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
