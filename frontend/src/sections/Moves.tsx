import { useMemo, useState } from 'react';
import { rollMove } from '../api/moves';
import type { MoveRollResult, MoveOutcome } from '../api/types';
import type { AppRoute } from '../navigation';
import { useActiveCampaign, useStore } from '../store';
import { rollProgress } from '../utils/dice';

interface MovesProps {
  campaignId?: string;
  onNavigate: (route: AppRoute) => void;
}

type MoveCategory = 'adventure' | 'combat' | 'relationship' | 'progress' | 'delve' | 'session';

interface MoveDef {
  id: string;
  name: string;
  category: MoveCategory;
  kind: 'action' | 'progress';
  stat?: 'edge' | 'heart' | 'iron' | 'shadow' | 'wits';
  description: string;
}

const MOVES: MoveDef[] = [
  { id: 'strike', name: 'Strike', category: 'combat', kind: 'action', stat: 'iron', description: 'Attack in control against your foe.' },
  { id: 'clash', name: 'Clash', category: 'combat', kind: 'action', stat: 'iron', description: 'Exchange a volley or fight under fire.' },
  { id: 'enter_the_fray', name: 'Enter the Fray', category: 'combat', kind: 'action', stat: 'wits', description: 'Engage a foe or situation.' },
  { id: 'face_danger', name: 'Face Danger', category: 'adventure', kind: 'action', stat: 'edge', description: 'React to a threat.' },
  { id: 'secure_an_advantage', name: 'Secure an Advantage', category: 'adventure', kind: 'action', stat: 'wits', description: 'Gain leverage or prepare.' },
  { id: 'undertake_a_journey', name: 'Undertake a Journey', category: 'progress', kind: 'progress', description: 'Travel across perilous lands.' },
  { id: 'fulfill_your_vow', name: 'Fulfill Your Vow', category: 'progress', kind: 'progress', description: 'Resolve a vow using its track.' },
  { id: 'forge_a_bond', name: 'Forge a Bond', category: 'relationship', kind: 'action', stat: 'heart', description: 'Earn trust or allegiance.' },
];

export function MovesSection({ campaignId, onNavigate }: MovesProps) {
  const campaign = useActiveCampaign();
  const { addLogEntry, setSelectedCharacter } = useStore();
  const [category, setCategory] = useState<MoveCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('strike');
  const [selectedCharacterId, setCharacterId] = useState<string | undefined>(campaign?.party[0]?.characterId);
  const [bonus, setBonus] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [result, setResult] = useState<MoveRollResult | null>(null);
  const [progressResult, setProgressResult] = useState<{ outcome: MoveOutcome; score: number; dice: [number, number] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const party = campaign?.party ?? [];

  const filteredMoves = useMemo(() => {
    return MOVES.filter((move) => {
      const matchesCategory = category === 'all' || move.category === category;
      const matchesSearch = move.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const selectedMove = MOVES.find((m) => m.id === selectedId) ?? MOVES[0];

  const handleRoll = async () => {
    setError(null);
    setResult(null);
    setProgressResult(null);
    if (!selectedMove) return;
    if (selectedMove.kind === 'progress') {
      const roll = rollProgress(progressValue);
      setProgressResult({ outcome: roll.outcome, score: roll.actionScore, dice: roll.challenge });
      if (campaignId) {
        await addLogEntry(campaignId, {
          logId: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'progress',
          summary: `${selectedMove.name} → ${roll.outcome.replace('_', ' ')}`,
          details: `Progress ${progressValue} vs [${roll.challenge.join(', ')}]`,
        });
      }
      return;
    }

    const character = party.find((c) => c.characterId === selectedCharacterId);
    const statVal = selectedMove.stat ? character?.[selectedMove.stat] ?? 0 : 0;
    try {
      const res = await rollMove(selectedMove.id, {
        statKey: selectedMove.stat,
        statValue: statVal,
        adds: bonus,
      });
      setResult(res);
      if (campaignId) {
        await addLogEntry(campaignId, {
          logId: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'move',
          characterId: character?.characterId,
          moveId: selectedMove.id,
          summary: `${selectedMove.name} → ${res.outcome.replace('_', ' ')}`,
          details: `Action ${res.actionDie} + stat ${statVal} + bonus ${bonus} vs [${res.challengeDice.join(', ')}]`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll');
    }
  };

  return (
    <div className="stack">
      <div className="surface stack">
        <h2>Moves</h2>
        <p className="muted">
          The move library will categorize every Ironsworn move with prompts, required inputs, and auto rolls. Results
          will write straight into the session log.
        </p>
        <div className="grid grid-large">
          <div className="list-card stack">
            <strong>Action moves</strong>
            <p className="muted">Adventure, combat, suffer/recover moves grouped by category.</p>
          </div>
          <div className="list-card stack">
            <strong>Progress moves</strong>
            <p className="muted">Use vow, journey, combat, or delve tracks as the progress score.</p>
          </div>
          <div className="list-card stack">
            <strong>Logging</strong>
            <p className="muted">Every roll records dice, modifiers, and outcome text for later review.</p>
          </div>
        </div>
        <div className="inline-controls">
          <button type="button" onClick={() => onNavigate({ section: 'oracles', campaignId })} className="secondary">
            Pair with oracle
          </button>
          <button type="button" onClick={() => onNavigate({ section: 'characters', campaignId })} className="secondary">
            Choose character
          </button>
          <span className="muted">More filters and advanced move forms will land here.</span>
        </div>
      </div>

      <div className="two-col">
        <div className="surface stack">
          <div className="inline-controls">
            <h3>Browse</h3>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="all">All</option>
              <option value="adventure">Adventure</option>
              <option value="combat">Combat</option>
              <option value="relationship">Relationship</option>
              <option value="progress">Progress</option>
              <option value="session">Session</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search moves"
              style={{ flex: 1, minWidth: 200 }}
            />
          </div>
          <div className="grid">
            {filteredMoves.map((move) => (
              <button
                key={move.id}
                type="button"
                className={`list-card stack ${selectedId === move.id ? 'is-active' : ''}`}
                onClick={() => setSelectedId(move.id)}
              >
                <div className="inline-controls">
                  <strong>{move.name}</strong>
                  <span className="pill">{move.category}</span>
                </div>
                <p className="muted">{move.description}</p>
              </button>
            ))}
            {!filteredMoves.length && <p className="muted">No moves match your filters.</p>}
          </div>
        </div>

        <div className="surface stack">
          <h3>{selectedMove?.name}</h3>
          <p className="muted">{selectedMove?.description}</p>
          {selectedMove?.kind === 'action' && (
            <div className="stack">
              <label>
                Character
                <select
                  value={selectedCharacterId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value || undefined;
                    setCharacterId(id);
                    if (id) setSelectedCharacter(id);
                  }}
                >
                  <option value="">—</option>
                  {party.map((ch) => (
                    <option key={ch.characterId} value={ch.characterId}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Bonus
                <input type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} />
              </label>
              <button type="button" onClick={handleRoll}>
                Roll move
              </button>
            </div>
          )}
          {selectedMove?.kind === 'progress' && (
            <div className="stack">
              <label>
                Progress value
                <input
                  type="number"
                  value={progressValue}
                  min={0}
                  max={10}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                />
              </label>
              <button type="button" onClick={handleRoll}>
                Roll progress
              </button>
            </div>
          )}
          {error && <p className="error">{error}</p>}
          {result && (
            <div className="list-card stack">
              <strong>
                {result.moveName} → {result.outcome.replace('_', ' ')}
              </strong>
              <p className="muted">
                Action {result.actionDie} vs challenge [{result.challengeDice.join(', ')}]; score {result.actionScore}
                {result.isMatch ? ' (match!)' : ''}
              </p>
              {result.text && (
                <p>
                  {(result.outcome === 'strong_hit' && result.text.strongHit) ||
                    (result.outcome === 'weak_hit' && result.text.weakHit) ||
                    (result.outcome === 'miss' && result.text.miss)}
                </p>
              )}
            </div>
          )}
          {progressResult && (
            <div className="list-card stack">
              <strong>
                {selectedMove?.name} → {progressResult.outcome.replace('_', ' ')}
              </strong>
              <p className="muted">
                Progress {progressValue} vs challenge [{progressResult.dice.join(', ')}]
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
