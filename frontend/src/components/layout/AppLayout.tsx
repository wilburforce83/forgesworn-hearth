import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { listCampaigns } from '../../api/campaigns';
import type { CampaignSummary } from '../../api/campaigns';
import { NAV_ITEMS, navKeyForRoute } from '../../navigation';
import type { AppRoute, NavSection } from '../../navigation';

interface AppLayoutProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  activeCampaignId?: string;
  onCampaignChange?: (campaignId?: string) => void;
  children: ReactNode;
}

function CampaignSwitcher({
  campaigns,
  value,
  onChange,
}: {
  campaigns: CampaignSummary[];
  value?: string;
  onChange?: (campaignId?: string) => void;
}) {
  const [input, setInput] = useState(value ?? '');

  useEffect(() => {
    setInput(value ?? '');
  }, [value]);

  const handleSubmit: React.FormEventHandler = (evt) => {
    evt.preventDefault();
    onChange?.(input.trim() || undefined);
  };

  return (
    <form className="campaign-switcher" onSubmit={handleSubmit}>
      <label>
        <span className="muted">Campaign</span>
        <select
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value || undefined)}
          style={{ minWidth: 140 }}
        >
          <option value="">—</option>
          {campaigns.map((c) => (
            <option key={c.campaignId} value={c.campaignId}>
              {c.name || c.campaignId}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="muted">Jump to ID</span>
        <input
          type="text"
          value={input}
          placeholder="camp-xxxxx"
          onChange={(e) => setInput(e.target.value)}
          style={{ minWidth: 160 }}
        />
      </label>
      <button type="submit" className="secondary">
        Load
      </button>
    </form>
  );
}

export function AppLayout({
  route,
  onNavigate,
  activeCampaignId,
  onCampaignChange,
  children,
}: AppLayoutProps) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const activeNav: NavSection = navKeyForRoute(route);

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .catch(() => {
        // silently ignore; UI will just show empty list
      });
  }, []);

  const title = useMemo(
    () => NAV_ITEMS.find((item) => item.key === activeNav)?.label ?? 'Dashboard',
    [activeNav]
  );

  const hint = useMemo(
    () => NAV_ITEMS.find((item) => item.key === activeNav)?.hint ?? 'Overview',
    [activeNav]
  );

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div>
          <div className="app-brand">Forgesworn Hearth</div>
          <div className="brand-sub">Ironsworn campaign keeper</div>
        </div>

        <div className="sidebar-section">
          <div className="nav-list">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`nav-item ${activeNav === item.key ? 'is-active' : ''}`}
                onClick={() => onNavigate({ section: item.key, campaignId: route.campaignId })}
              >
                <span>{item.label}</span>
                {item.hint && <small>{item.hint}</small>}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-footnote">
          <strong>Guiding spark</strong>
          <p className="muted">
            Keep your party close: set an active campaign in the top bar to anchor maps, moves, and logs.
          </p>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p className="tagline">{hint}</p>
          </div>
          <div className="meta">
            <CampaignSwitcher
              campaigns={campaigns}
              value={activeCampaignId}
              onChange={(id) => {
                onCampaignChange?.(id);
                if (id) {
                  onNavigate({ ...route, campaignId: id });
                }
              }}
            />
          </div>
        </header>

        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
