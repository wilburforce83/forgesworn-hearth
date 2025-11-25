import { useMemo, useState } from 'react';
import type { AppRoute } from '../navigation';
import { useActiveCampaign, useStore } from '../store';
import type { SessionLogEntryDto } from '../api/types';

interface SessionLogProps {
  campaignId?: string;
  onNavigate: (route: AppRoute) => void;
}

const TYPE_FILTERS = ['all', 'move', 'oracle', 'map', 'site', 'note', 'progress', 'dice'] as const;

export function SessionLogSection({ campaignId, onNavigate }: SessionLogProps) {
  const campaign = useActiveCampaign();
  const { addLogEntry } = useStore();
  const [filter, setFilter] = useState<(typeof TYPE_FILTERS)[number]>('all');
  const [note, setNote] = useState('');
  const entries = useMemo(() => {
    if (!campaign?.sessionLog) return [];
    const list = [...campaign.sessionLog].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (filter === 'all') return list;
    return list.filter((e) => e.type === filter);
  }, [campaign, filter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SessionLogEntryDto[]>();
    entries.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      groups.set(date, [...(groups.get(date) ?? []), entry]);
    });
    return Array.from(groups.entries());
  }, [entries]);

  const handleNote: React.FormEventHandler = async (evt) => {
    evt.preventDefault();
    if (!campaignId || !note.trim()) return;
    await addLogEntry(campaignId, {
      logId: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'note',
      summary: note.trim(),
    });
    setNote('');
  };

  const handleExport = async () => {
    if (!campaign) return;
    const text = campaign.sessionLog
      .map((e) => `- [${new Date(e.timestamp).toLocaleString()}] (${e.type}) ${e.summary}${e.details ? ` — ${e.details}` : ''}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied log to clipboard');
    } catch {
      alert('Could not copy log');
    }
  };

  return (
    <div className="stack">
      <div className="surface stack">
        <h2>Session log</h2>
        <p className="muted">
          A timeline-style journal groups entries by date with quick filters for moves, oracles, and map events. Export
          to Markdown for safekeeping.
        </p>
        <div className="inline-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            {TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="button" className="secondary" onClick={() => onNavigate({ section: 'moves', campaignId })}>
            Log a move
          </button>
          <button type="button" className="secondary" onClick={() => onNavigate({ section: 'oracles', campaignId })}>
            Roll an oracle
          </button>
          <button type="button" className="secondary" onClick={handleExport}>
            Export
          </button>
        </div>
        <form className="inline-controls" onSubmit={handleNote}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note to the log"
            style={{ flex: 1, minWidth: 260 }}
          />
          <button type="submit" disabled={!campaignId || !note.trim()}>
            Add note
          </button>
        </form>
      </div>

      <div className="surface stack">
        <h3>Timeline</h3>
        {grouped.length === 0 && <p className="muted">No entries yet. Roll a move or oracle to get started.</p>}
        <div className="stack">
          {grouped.map(([date, entriesForDate]) => (
            <div key={date} className="stack">
              <strong>{date}</strong>
              {entriesForDate.map((entry) => (
                <div key={entry.logId} className="list-card stack">
                  <div className="inline-controls">
                    <span className="pill">{entry.type}</span>
                    <span className="muted">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p>{entry.summary}</p>
                  {entry.details && <p className="muted">{entry.details}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
