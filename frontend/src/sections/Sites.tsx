import { useMemo, useState } from 'react';
import type { AppRoute } from '../navigation';
import { useActiveCampaign, useStore } from '../store';
import type { LocationDto } from '../api/types';

interface SitesProps {
  campaignId?: string;
  onNavigate: (route: AppRoute) => void;
}

function buildSite(): LocationDto {
  return {
    locationId: crypto.randomUUID ? crypto.randomUUID() : `site-${Date.now()}`,
    name: 'New site',
    type: 'Delve',
    summary: '',
    description: '',
    hex: { x: 0, y: 0 },
    tags: [],
  };
}

export function SitesSection({ campaignId, onNavigate }: SitesProps) {
  const campaign = useActiveCampaign();
  const { addLocation, updateLocation } = useStore();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [newSite, setNewSite] = useState<LocationDto>(buildSite());
  const sites = useMemo(() => campaign?.locations ?? [], [campaign]);
  const selected = sites.find((s) => s.locationId === selectedId);

  if (!campaignId) {
    return (
      <div className="surface stack">
        <h2>Sites & delves</h2>
        <p className="muted">Select a campaign to manage sites.</p>
      </div>
    );
  }

  const handleCreate: React.FormEventHandler = async (evt) => {
    evt.preventDefault();
    const payload = { ...newSite, locationId: crypto.randomUUID ? crypto.randomUUID() : `site-${Date.now()}` };
    const res = await addLocation(campaignId, payload);
    if (res) {
      setSelectedId(payload.locationId);
      setNewSite(buildSite());
    }
  };

  const handleUpdate = async (field: keyof LocationDto, value: any) => {
    if (!selected) return;
    await updateLocation(campaignId, selected.locationId, { [field]: value });
  };

  return (
    <div className="stack">
      <div className="surface stack">
        <h2>Sites & delves</h2>
        <p className="muted">
          Track delve sites with rank, domain, theme, progress, and discoveries. Link them to map hexes for fast travel.
        </p>
        <div className="inline-controls">
          <button type="button" className="secondary" onClick={() => onNavigate({ section: 'world-map', campaignId })}>
            Jump to map
          </button>
          <button type="button" className="secondary" onClick={() => onNavigate({ section: 'log', campaignId })}>
            View log
          </button>
          <span className="pill">{sites.length} sites</span>
        </div>
        <div className="grid grid-large">
          {sites.map((site) => (
            <button
              key={site.locationId}
              type="button"
              className={`list-card stack ${selectedId === site.locationId ? 'is-active' : ''}`}
              onClick={() => setSelectedId(site.locationId)}
            >
              <div className="inline-controls">
                <strong>{site.name}</strong>
                <span className="pill">{site.type}</span>
              </div>
              <p className="muted">
                Hex ({site.hex.x}, {site.hex.y})
              </p>
              {site.summary && <p>{site.summary}</p>}
            </button>
          ))}
          {!sites.length && <p className="muted">No sites yet. Add one below.</p>}
        </div>
      </div>

      <div className="two-col">
        <div className="surface stack">
          <h3>Add site</h3>
          <form className="stack" onSubmit={handleCreate}>
            <label>
              Name
              <input
                value={newSite.name}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                required
              />
            </label>
            <label>
              Type
              <input value={newSite.type} onChange={(e) => setNewSite({ ...newSite, type: e.target.value })} />
            </label>
            <div className="inline-controls">
              <label>
                Hex X
                <input
                  type="number"
                  value={newSite.hex.x}
                  onChange={(e) => setNewSite({ ...newSite, hex: { ...newSite.hex, x: Number(e.target.value) } })}
                />
              </label>
              <label>
                Hex Y
                <input
                  type="number"
                  value={newSite.hex.y}
                  onChange={(e) => setNewSite({ ...newSite, hex: { ...newSite.hex, y: Number(e.target.value) } })}
                />
              </label>
            </div>
            <label>
              Summary
              <textarea
                value={newSite.summary ?? ''}
                onChange={(e) => setNewSite({ ...newSite, summary: e.target.value })}
                placeholder="What stands out?"
              />
            </label>
            <button type="submit">Add site</button>
          </form>
        </div>

        <div className="surface stack">
          <h3>Details</h3>
          {!selected && <p className="muted">Select a site to edit.</p>}
          {selected && (
            <div className="stack">
              <label>
                Name
                <input value={selected.name} onChange={(e) => handleUpdate('name', e.target.value)} />
              </label>
              <label>
                Summary
                <textarea
                  value={selected.summary ?? ''}
                  onChange={(e) => handleUpdate('summary', e.target.value)}
                />
              </label>
              <label>
                Description / discoveries
                <textarea
                  value={selected.description ?? ''}
                  onChange={(e) => handleUpdate('description', e.target.value)}
                  placeholder="Discoveries, dangers, notes..."
                />
              </label>
              <div className="inline-controls">
                <label>
                  Hex X
                  <input
                    type="number"
                    value={selected.hex.x}
                    onChange={(e) => handleUpdate('hex', { ...selected.hex, x: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Hex Y
                  <input
                    type="number"
                    value={selected.hex.y}
                    onChange={(e) => handleUpdate('hex', { ...selected.hex, y: Number(e.target.value) })}
                  />
                </label>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => onNavigate({ section: 'world-map', campaignId })}
              >
                Center map
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
