import { useEffect, useState } from 'react';
import type { AppRoute } from '../navigation';

interface SettingsProps {
  onNavigate: (route: AppRoute) => void;
}

const SETTINGS_KEY = 'fh_settings';

type ThemeTone = 'dawn' | 'dusk';

function applyTone(tone: ThemeTone) {
  const root = document.documentElement;
  if (tone === 'dusk') {
    root.style.setProperty('--color-bg', '#e6dac1');
    root.style.setProperty('--color-surface', '#e1d3b3');
    root.style.setProperty('--color-text', '#24180f');
  } else {
    root.style.removeProperty('--color-bg');
    root.style.removeProperty('--color-surface');
    root.style.removeProperty('--color-text');
  }
}

export function SettingsSection({ onNavigate }: SettingsProps) {
  const [themeTone, setThemeTone] = useState<ThemeTone>('dawn');
  const [showDice, setShowDice] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { tone?: ThemeTone; showDice?: boolean };
        if (parsed.tone) {
          setThemeTone(parsed.tone);
          applyTone(parsed.tone);
        }
        if (typeof parsed.showDice === 'boolean') setShowDice(parsed.showDice);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ tone: themeTone, showDice }));
    } catch {
      // ignore
    }
    applyTone(themeTone);
  }, [themeTone, showDice]);

  return (
    <div className="stack">
      <div className="surface stack">
        <h2>Settings</h2>
        <p className="muted">Light touch settings for now; full theme toggles and data export/import will follow.</p>
        <div className="grid grid-large">
          <div className="list-card stack">
            <strong>Theme tone</strong>
            <p className="muted">Stay in the current parchment palette, or pivot to a dusk variant.</p>
            <div className="inline-controls">
              <label className="inline-controls">
                <input
                  type="radio"
                  name="tone"
                  value="dawn"
                  checked={themeTone === 'dawn'}
                  onChange={() => setThemeTone('dawn')}
                />
                Dawn
              </label>
              <label className="inline-controls">
                <input
                  type="radio"
                  name="tone"
                  value="dusk"
                  checked={themeTone === 'dusk'}
                  onChange={() => setThemeTone('dusk')}
                />
                Dusk
              </label>
            </div>
          </div>
          <div className="list-card stack">
            <strong>Dice visibility</strong>
            <p className="muted">Choose whether to show dice results by default.</p>
            <label className="inline-controls">
              <input type="checkbox" checked={showDice} onChange={(e) => setShowDice(e.target.checked)} />
              Always display dice
            </label>
          </div>
          <div className="list-card stack">
            <strong>Data safety</strong>
            <p className="muted">Export/import campaign JSON and set a default landing campaign.</p>
            <button type="button" className="secondary" onClick={() => onNavigate({ section: 'campaigns' })}>
              Go to campaigns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
