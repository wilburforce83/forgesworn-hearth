export type AppSection =
  | 'dashboard'
  | 'campaigns'
  | 'campaign'
  | 'characters'
  | 'moves'
  | 'oracles'
  | 'world-map'
  | 'sites'
  | 'log'
  | 'settings';

export interface AppRoute {
  section: AppSection;
  campaignId?: string;
  characterId?: string;
}

export type NavSection = Exclude<AppSection, 'campaign'>;

export const NAV_ITEMS: Array<{ key: NavSection; label: string; hint?: string }> = [
  { key: 'dashboard', label: 'Dashboard', hint: 'Overview' },
  { key: 'campaigns', label: 'Campaigns', hint: 'Worlds & truths' },
  { key: 'characters', label: 'Characters', hint: 'Sheets & assets' },
  { key: 'moves', label: 'Moves', hint: 'Action & progress' },
  { key: 'oracles', label: 'Oracles', hint: 'Prompts' },
  { key: 'world-map', label: 'World Map', hint: 'Hex crawl' },
  { key: 'sites', label: 'Sites & Delves', hint: 'Domains' },
  { key: 'log', label: 'Session Log', hint: 'Journal' },
  { key: 'settings', label: 'Settings', hint: 'Theme & data' },
];

export function navKeyForRoute(route: AppRoute): NavSection {
  if (route.section === 'campaign') return 'campaigns';
  return route.section;
}

export function parseHash(hash: string): AppRoute {
  const clean = (hash || '').replace(/^#/, '').replace(/^\/+/, '');
  const parts = clean ? clean.split('/').filter(Boolean) : [];

  if (parts.length === 0) {
    return { section: 'dashboard' };
  }

  const [first, second, third, fourth] = parts;

  if (first === 'campaign' && second) {
    if (third === 'character' && fourth) {
      return { section: 'characters', campaignId: second, characterId: fourth };
    }
    if (third === 'map') {
      return { section: 'world-map', campaignId: second };
    }
    if (third === 'sites') {
      return { section: 'sites', campaignId: second };
    }
    if (third === 'log') {
      return { section: 'log', campaignId: second };
    }
    if (third === 'characters') {
      return { section: 'characters', campaignId: second };
    }
    return { section: 'campaign', campaignId: second };
  }

  switch (first) {
    case 'dashboard':
      return { section: 'dashboard' };
    case 'campaigns':
      return { section: 'campaigns' };
    case 'characters':
      return { section: 'characters', characterId: second };
    case 'moves':
      return { section: 'moves', campaignId: second };
    case 'oracles':
      return { section: 'oracles' };
    case 'world-map':
      return { section: 'world-map', campaignId: second };
    case 'sites':
      return { section: 'sites', campaignId: second };
    case 'log':
      return { section: 'log', campaignId: second };
    case 'settings':
      return { section: 'settings' };
    default:
      return { section: 'dashboard' };
  }
}

export function buildHash(route: AppRoute): string {
  switch (route.section) {
    case 'dashboard':
      return '#/dashboard';
    case 'campaigns':
      return '#/campaigns';
    case 'campaign':
      return route.campaignId ? `#/campaign/${route.campaignId}` : '#/campaigns';
    case 'characters':
      if (route.campaignId && route.characterId) {
        return `#/campaign/${route.campaignId}/character/${route.characterId}`;
      }
      if (route.campaignId) {
        return `#/campaign/${route.campaignId}/characters`;
      }
      if (route.characterId) {
        return `#/characters/${route.characterId}`;
      }
      return '#/characters';
    case 'moves':
      return route.campaignId ? `#/moves/${route.campaignId}` : '#/moves';
    case 'oracles':
      return '#/oracles';
    case 'world-map':
      return route.campaignId ? `#/campaign/${route.campaignId}/map` : '#/world-map';
    case 'sites':
      return route.campaignId ? `#/campaign/${route.campaignId}/sites` : '#/sites';
    case 'log':
      return route.campaignId ? `#/campaign/${route.campaignId}/log` : '#/log';
    case 'settings':
      return '#/settings';
    default:
      return '#/';
  }
}
