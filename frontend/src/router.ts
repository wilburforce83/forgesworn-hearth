import { renderCampaignDetailView } from './views/campaignDetailView';
import { renderCampaignListView } from './views/campaignListView';
import { renderCharacterDashboardView } from './views/characterDashboardView';
import { renderHexMapView } from './views/hexMapView';

export function initRouter() {
  const root = document.getElementById('app');
  if (!(root instanceof HTMLElement)) return;
  const app: HTMLElement = root;

  function handleRoute() {
    const hash = window.location.hash || '#/';
    const parts = hash.slice(2).split('/');

    if (parts[0] === '') {
      renderCampaignListView(app);
      return;
    }

    if (parts[0] === 'campaign' && parts[1]) {
      const campaignId = parts[1];
      if (parts[2] === 'character' && parts[3]) {
        renderCharacterDashboardView(app, { campaignId, characterId: parts[3] });
        return;
      }
      if (parts[2] === 'map') {
        renderHexMapView(app, { campaignId });
        return;
      }
      renderCampaignDetailView(app, { campaignId });
      return;
    }

    app.innerHTML = `<p>Not found. <a href="#/">Go home</a></p>`;
  }

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('load', handleRoute);
  handleRoute();
}
