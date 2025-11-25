import { useEffect, useMemo, useState } from 'react';
import type { CampaignDto } from '../api/types';
import type { AppRoute } from '../navigation';
import { useStore } from '../store';

interface CampaignsProps {
  onNavigate: (route: AppRoute) => void;
}

function randomCampaignId() {
  return `camp-${Math.random().toString(36).slice(2, 8)}`;
}

export function CampaignsSection({ onNavigate }: CampaignsProps) {
  const {
    createCampaign: createCampaignAction,
    loadCampaign,
    cachedCampaigns,
    refreshLocalCampaigns,
    setActiveCampaignId,
  } = useStore();
  const [name, setName] = useState('');
  const [campaignId, setCampaignId] = useState(randomCampaignId());
  const [worldTruths, setWorldTruths] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [preview, setPreview] = useState<CampaignDto | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    void refreshLocalCampaigns();
  }, [refreshLocalCampaigns]);

  useEffect(() => {
    if (!previewId) {
      setPreview(null);
      return;
    }
    setPreviewError(null);
    loadCampaign(previewId)
      .then(setPreview)
      .catch((err) => {
        setPreview(null);
        setPreviewError(err instanceof Error ? err.message : 'Could not load campaign');
      });
  }, [previewId]);

  const truthsList = useMemo(
    () =>
      worldTruths
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean),
    [worldTruths]
  );

  const handleCreate: React.FormEventHandler = async (evt) => {
    evt.preventDefault();
    setStatus('Creating campaign…');
    setError(null);
    try {
      const created = await createCampaignAction({
        campaignId: campaignId.trim(),
        name: name.trim() || campaignId.trim(),
        worldTruths: truthsList.length ? truthsList : undefined,
      });
      void refreshLocalCampaigns();
      setStatus('Created and saved locally');
      setActiveCampaignId(created.campaignId);
      onNavigate({ section: 'campaign', campaignId: created.campaignId });
      setPreviewId(created.campaignId);
      setName('');
      setWorldTruths('');
      setCampaignId(randomCampaignId());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
      setStatus(null);
    }
  };

  return (
    <div className="stack">
      <div className="two-col">
        <div className="surface stack">
          <h2>New campaign</h2>
          <p className="muted">
            World truths are optional. Use this to get a shell in the database, then flesh it out from the dashboard.
          </p>
          <form className="stack" onSubmit={handleCreate}>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" required />
            </label>
            <label>
              Campaign ID
              <input
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="camp-xxxxx"
                required
              />
            </label>
            <label>
              World truths (one per line)
              <textarea
                value={worldTruths}
                onChange={(e) => setWorldTruths(e.target.value)}
                placeholder="The Ironlands are..."
              />
            </label>
            <div className="inline-controls">
              <button type="submit">Create</button>
              {status && <span className="pill">{status}</span>}
              {error && <span className="error">{error}</span>}
            </div>
          </form>
        </div>

        <div className="surface stack">
          <h2>Known campaigns</h2>
          <p className="muted">These are stored locally after you visit or create them.</p>
          <div className="grid">
            {cachedCampaigns.map((camp) => (
              <div key={camp.campaignId} className="list-card stack">
                <div className="inline-controls">
                  <div>
                    <h4>{camp.name || camp.campaignId}</h4>
                    <p className="muted">{camp.campaignId}</p>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setPreviewId(camp.campaignId);
                      setActiveCampaignId(camp.campaignId);
                      onNavigate({ section: 'campaign', campaignId: camp.campaignId });
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
            {!cachedCampaigns.length && <p className="muted">No campaigns cached yet.</p>}
          </div>
        </div>
      </div>

      <div className="surface stack">
        <h3>Campaign detail</h3>
        {!previewId && <p className="muted">Select a campaign above to see truths, party, and map footprint.</p>}
        {previewError && <p className="error">{previewError}</p>}
        {preview && (
          <div className="grid grid-large">
            <div className="list-card stack">
              <strong>Truths</strong>
              {preview.worldTruths && preview.worldTruths.length ? (
                <ul className="stack">
                  {preview.worldTruths.map((truth) => (
                    <li key={truth} className="muted">
                      {truth}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No truths recorded.</p>
              )}
            </div>
            <div className="list-card stack">
              <strong>Party</strong>
              {preview.party?.length ? (
                <ul className="stack">
                  {preview.party.map((ch) => (
                    <li key={ch.characterId}>
                      <span>{ch.name}</span>
                      <span className="muted">
                        · Edge {ch.edge} Heart {ch.heart} Iron {ch.iron} Shadow {ch.shadow} Wits {ch.wits}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No characters yet.</p>
              )}
            </div>
            <div className="list-card stack">
              <strong>Map</strong>
              <p className="muted">
                {preview.hexMap?.length ? `${preview.hexMap.length} hexes revealed` : 'No discovered hexes yet.'}
              </p>
              <button
                type="button"
                className="secondary"
                onClick={() => onNavigate({ section: 'world-map', campaignId: preview.campaignId })}
              >
                Open map
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
