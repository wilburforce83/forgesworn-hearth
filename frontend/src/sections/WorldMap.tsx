import { useMemo, useState } from 'react';
import type { AppRoute } from '../navigation';
import { HexWorldScreen } from '../components/HexWorldScreen';
import { useActiveCampaign, useStore } from '../store';
import type { HexDto } from '../api/types';

interface WorldMapProps {
  campaignId?: string;
  onNavigate: (route: AppRoute) => void;
}

export function WorldMapSection({ campaignId, onNavigate }: WorldMapProps) {
  const campaign = useActiveCampaign();
  const { revealArea, addLogEntry } = useStore();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hexes: HexDto[] = useMemo(() => campaign?.hexMap ?? [], [campaign]);

  const handleDiscover = async (coord: { q: number; r: number }) => {
    if (!campaignId) return;
    setStatus(`Exploring (${coord.q}, ${coord.r})...`);
    setError(null);
    try {
      const result = await revealArea(campaignId, { x: coord.q, y: coord.r, allowPoi: true });
      if (result?.hexes?.length) {
        await addLogEntry(campaignId, {
          logId: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'map',
          summary: `Explored hex ${coord.q},${coord.r}`,
          details: `${result.hexes[0]?.biome ?? 'unknown biome'}`,
        });
      }
      setStatus('Area revealed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reveal area');
    }
  };

  return (
    <div className="stack">
      <div className="surface stack">
        <div className="inline-controls">
          <div>
            <h2>World map</h2>
            <p className="muted">
              Click tiles to explore. New reveals sync to the backend hex map and log a map event.
            </p>
          </div>
          <button type="button" className="secondary" onClick={() => onNavigate({ section: 'campaigns', campaignId })}>
            Campaigns
          </button>
        </div>
        <HexWorldScreen onDiscoverTile={handleDiscover} />
        <p className="muted">{status}</p>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="surface stack">
        <div className="inline-controls">
          <h3>Discovered hexes</h3>
          <span className="pill">{hexes.length}</span>
        </div>
        <div className="grid grid-large">
          {hexes.slice().sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y)).map((hex) => (
            <div key={`${hex.x},${hex.y}`} className="list-card stack">
              <strong>
                ({hex.x}, {hex.y})
              </strong>
              <p className="muted">{hex.biome}</p>
              {hex.settlementName && <p>Settlement: {hex.settlementName}</p>}
              {hex.siteName && <p>Site: {hex.siteName}</p>}
              <span className="pill">{hex.discovered ? 'Discovered' : 'Hidden'}</span>
            </div>
          ))}
          {!hexes.length && <p className="muted">No hexes recorded yet. Explore to populate the map.</p>}
        </div>
      </div>
    </div>
  );
}
