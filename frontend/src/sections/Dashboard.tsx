import { useEffect, useMemo, useState } from 'react';
import type { CampaignDto, SessionLogEntryDto } from '../api/types';
import type { AppRoute } from '../navigation';
import { useActiveCampaign, useStore } from '../store';

interface DashboardProps {
  campaignId?: string;
  onNavigate: (route: AppRoute) => void;
}

function CampaignSummaryCard({
  campaign,
  onOpenMap,
  onOpenLog,
}: {
  campaign: CampaignDto;
  onOpenMap: () => void;
  onOpenLog: () => void;
}) {
  const truths = useMemo(() => campaign.worldTruths?.slice(0, 3) ?? [], [campaign.worldTruths]);
  const party = campaign.party?.slice(0, 3) ?? [];

  return (
    <div className="surface stack">
      <div className="inline-controls">
        <div>
          <h3>{campaign.name}</h3>
          <p className="muted">ID: {campaign.campaignId}</p>
        </div>
        <div className="pill">{campaign.party?.length ?? 0} companions</div>
      </div>
      {truths.length > 0 && (
        <div className="stack">
          <strong>Truths</strong>
          <ul className="stack">
            {truths.map((truth) => (
              <li key={truth} className="muted">
                {truth}
              </li>
            ))}
          </ul>
        </div>
      )}
      {party.length > 0 && (
        <div className="stack">
          <strong>Party spotlight</strong>
          <div className="grid">
            {party.map((ch) => (
              <div key={ch.characterId} className="list-card">
                <h4>{ch.name}</h4>
                <p className="muted">
                  Edge {ch.edge} · Heart {ch.heart} · Iron {ch.iron} · Shadow {ch.shadow} · Wits{' '}
                  {ch.wits}
                </p>
                <p className="muted">
                  Health {ch.health} | Spirit {ch.spirit} | Supply {ch.supply}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="inline-controls">
        <button type="button" onClick={onOpenMap}>
          Open map
        </button>
        <button type="button" className="secondary" onClick={onOpenLog}>
          Session log
        </button>
      </div>
    </div>
  );
}

export function DashboardSection({ campaignId, onNavigate }: DashboardProps) {
  const storeCampaign = useActiveCampaign();
  const { loadCampaign, addLogEntry } = useStore();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const campaign = storeCampaign && campaignId === storeCampaign.campaignId ? storeCampaign : null;

  useEffect(() => {
    if (!campaignId) {
      setStatus('idle');
      return;
    }

    if (!campaign) {
      setStatus('loading');
      setError(null);
      loadCampaign(campaignId).catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
        setStatus('error');
      });
    } else {
      setStatus('idle');
    }
  }, [campaignId, campaign, loadCampaign]);

  const recentLog = useMemo(() => {
    if (!campaign?.sessionLog) return [];
    return campaign.sessionLog.slice(-5).reverse();
  }, [campaign]);

  const handleNoteSubmit: React.FormEventHandler = async (evt) => {
    evt.preventDefault();
    if (!campaignId || !note.trim()) return;
    const entry: SessionLogEntryDto = {
      logId: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'note',
      summary: note.trim(),
    };
    await addLogEntry(campaignId, entry);
    setNote('');
  };

  return (
    <div className="stack">
      <div className="grid grid-large">
        <div className="surface stack">
          <h2>Current campaign</h2>
          {!campaignId && <p className="muted">Choose a campaign in the top bar to anchor the dashboard.</p>}
          {campaignId && status === 'loading' && <p className="muted">Loading {campaignId}…</p>}
          {error && <p className="error">{error}</p>}
          {campaign && (
            <CampaignSummaryCard
              campaign={campaign}
              onOpenMap={() => onNavigate({ section: 'world-map', campaignId })}
              onOpenLog={() => onNavigate({ section: 'log', campaignId })}
            />
          )}
        </div>

        <div className="surface surface-muted stack">
          <h3>Quick actions</h3>
          <p className="muted">
            Jump to a move, ask an oracle, or free-roll something evocative. Logging happens automatically once the
            move framework is wired.
          </p>
          <div className="grid">
            <button type="button" className="secondary" onClick={() => onNavigate({ section: 'moves', campaignId })}>
              Make a move
            </button>
            <button type="button" className="secondary" onClick={() => onNavigate({ section: 'oracles', campaignId })}>
              Ask the oracle
            </button>
            <button type="button" className="secondary" onClick={() => onNavigate({ section: 'world-map', campaignId })}>
              Explore the map
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-large">
        <div className="surface stack">
          <h3>Recent beats</h3>
          <p className="muted">
            Session log entries will collect here by date—moves, oracle rolls, and map events all feed into the journal.
          </p>
          {recentLog.length ? (
            <div className="stack">
              {recentLog.map((log) => (
                <div key={log.logId} className="list-card stack">
                  <div className="inline-controls">
                    <strong>{new Date(log.timestamp).toLocaleString()}</strong>
                    <span className="pill">{log.type}</span>
                  </div>
                  <p>{log.summary}</p>
                  {log.details && <p className="muted">{log.details}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="list-card">
              <p className="muted">No entries yet. Log your first move to begin the chronicle.</p>
            </div>
          )}
        </div>

        <div className="surface stack">
          <h3>Prep queue</h3>
          <p className="muted">
            Track vows, sites, and fronts you want at hand. This section will grow into a proper agenda as the framework
            fills out.
          </p>
          <div className="grid">
            <div className="list-card">
              <strong>Vows</strong>
              <p className="muted">
                Tie vows to party members and mark progress from here. Coming soon: dedicated vow tracks.
              </p>
            </div>
            <div className="list-card">
              <strong>Sites</strong>
              <p className="muted">Pin active delves to quickly jump into a delve move set.</p>
            </div>
            <div className="list-card">
              <strong>Fronts & threats</strong>
              <p className="muted">Escalate dangers and note clocks or looming forces.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface stack">
        <h3>Quick note</h3>
        <p className="muted">Drop a short session beat; it will appear in the log immediately.</p>
        <form className="inline-controls" onSubmit={handleNoteSubmit}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Discovered a cairn of ancient stones..."
            style={{ flex: 1, minWidth: 280 }}
          />
          <button type="submit" disabled={!campaignId || !note.trim()}>
            Add note
          </button>
        </form>
      </div>
    </div>
  );
}
