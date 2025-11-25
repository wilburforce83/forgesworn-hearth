import { useMemo, useState } from 'react';
import type { AppRoute } from '../navigation';
import type { CharacterDto } from '../api/types';
import { useActiveCampaign, useStore } from '../store';

interface CharactersProps {
  campaignId?: string;
  onNavigate: (route: AppRoute) => void;
}

const STAT_KEYS: Array<keyof Pick<CharacterDto, 'edge' | 'heart' | 'iron' | 'shadow' | 'wits'>> = [
  'edge',
  'heart',
  'iron',
  'shadow',
  'wits',
];

const TRACK_KEYS: Array<keyof Pick<CharacterDto, 'health' | 'spirit' | 'supply' | 'momentum'>> = [
  'health',
  'spirit',
  'supply',
  'momentum',
];

function buildCharacter(): CharacterDto {
  return {
    characterId: crypto.randomUUID ? crypto.randomUUID() : `char-${Date.now()}`,
    name: 'New character',
    edge: 1,
    heart: 1,
    iron: 1,
    shadow: 1,
    wits: 1,
    health: 5,
    spirit: 5,
    supply: 5,
    momentum: 2,
    momentumMax: 10,
    momentumReset: 2,
    assets: [],
    vows: [],
  };
}

export function CharactersSection({ campaignId, onNavigate }: CharactersProps) {
  const { addCharacter, updateCharacter, setSelectedCharacter } = useStore();
  const campaign = useActiveCampaign();
  const party = useMemo(() => campaign?.party ?? [], [campaign]);
  const [selectedId, setSelectedId] = useState<string | undefined>(party[0]?.characterId);
  const selected = party.find((ch) => ch.characterId === selectedId);
  const [assetsText, setAssetsText] = useState('');

  if (!campaignId) {
    return (
      <div className="surface stack">
        <h2>Character sheets</h2>
        <p className="muted">Select a campaign to manage its party.</p>
      </div>
    );
  }

  const handleAdd = async () => {
    const payload = buildCharacter();
    const res = await addCharacter(campaignId, payload);
    if (res) {
      setSelectedId(payload.characterId);
    }
  };

  const handleChange = async (field: keyof CharacterDto, value: any) => {
    if (!selected) return;
    const updates: Partial<CharacterDto> = { [field]: value } as Partial<CharacterDto>;
    await updateCharacter(campaignId, selected.characterId, updates);
  };

  const handleTrackChange = (field: keyof CharacterDto, delta: number) => {
    if (!selected) return;
    const next = Math.max(0, (selected[field] as number) + delta);
    void handleChange(field, next);
  };

  return (
    <div className="stack">
      <div className="two-col">
        <div className="surface stack">
          <div className="inline-controls">
            <h2>Party</h2>
            <button type="button" onClick={handleAdd}>
              Add character
            </button>
          </div>
          <div className="grid">
            {party.map((ch) => (
              <button
                key={ch.characterId}
                type="button"
                className={`list-card stack ${selectedId === ch.characterId ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedId(ch.characterId);
                  setSelectedCharacter(ch.characterId);
                }}
              >
                <div className="inline-controls">
                  <h4>{ch.name}</h4>
                  <span className="pill">Momentum {ch.momentum}/{ch.momentumMax}</span>
                </div>
                <p className="muted">
                  Edge {ch.edge} · Heart {ch.heart} · Iron {ch.iron} · Shadow {ch.shadow} · Wits {ch.wits}
                </p>
              </button>
            ))}
            {!party.length && <p className="muted">No characters yet. Add one to begin.</p>}
          </div>
        </div>

        <div className="surface stack">
          <h2>Sheet</h2>
          {!selected && <p className="muted">Pick a character to edit.</p>}
          {selected && (
            <div className="stack">
              <label>
                Name
                <input
                  value={selected.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Name"
                />
              </label>
              <div className="grid">
                {STAT_KEYS.map((stat) => (
                  <label key={stat}>
                    {stat.toUpperCase()}
                    <input
                      type="number"
                      value={selected[stat]}
                      min={0}
                      onChange={(e) => handleChange(stat, Number(e.target.value))}
                    />
                  </label>
                ))}
              </div>
              <div className="grid">
                {TRACK_KEYS.map((track) => (
                  <div key={track} className="list-card stack">
                    <div className="inline-controls">
                      <strong>{track === 'supply' ? 'Supply' : track.charAt(0).toUpperCase() + track.slice(1)}</strong>
                      <span className="pill">{selected[track]}</span>
                    </div>
                    <div className="inline-controls">
                      <button type="button" className="secondary" onClick={() => handleTrackChange(track, -1)}>
                        -1
                      </button>
                      <button type="button" onClick={() => handleTrackChange(track, 1)}>
                        +1
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="list-card stack">
                <div className="inline-controls">
                  <strong>Momentum</strong>
                  <span className="pill">
                    {selected.momentum}/{selected.momentumMax} (reset {selected.momentumReset})
                  </span>
                </div>
                <div className="inline-controls">
                  <button type="button" className="secondary" onClick={() => handleTrackChange('momentum', -1)}>
                    -1
                  </button>
                  <button type="button" onClick={() => handleTrackChange('momentum', 1)}>
                    +1
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleChange('momentum', selected.momentumReset)}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="list-card stack">
                <strong>Debilities</strong>
                <div className="inline-controls">
                  {['wounded', 'shaken', 'unprepared', 'encumbered', 'maimed', 'corrupted'].map((key) => (
                    <label key={key} className="pill">
                      <input
                        type="checkbox"
                        checked={Boolean((selected.debilities as any)?.[key])}
                        onChange={(e) =>
                          handleChange('debilities', {
                            ...selected.debilities,
                            [key]: e.target.checked,
                          })
                        }
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>

              <div className="list-card stack">
                <strong>Assets (quick notes)</strong>
                <textarea
                  value={assetsText}
                  onChange={(e) => setAssetsText(e.target.value)}
                  placeholder="Companion wolf: +2 when aiding, once per scene..."
                />
                <p className="muted">This is a scratchpad until asset data is wired in.</p>
              </div>

              <div className="inline-controls">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCharacter(selected.characterId);
                    onNavigate({ section: 'moves', campaignId, characterId: selected.characterId });
                  }}
                >
                  Make a move with {selected.name}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => onNavigate({ section: 'campaign', campaignId })}
                >
                  Back to campaign
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
