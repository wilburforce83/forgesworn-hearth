import { useEffect, useMemo } from 'react';
import './style.css';
import { AppLayout } from './components/layout/AppLayout';
import { useHashRoute } from './hooks/useHashRoute';
import { DashboardSection, CampaignsSection, CharactersSection, MovesSection, OraclesSection, WorldMapSection, SitesSection, SessionLogSection, SettingsSection } from './sections';
import type { AppRoute } from './navigation';
import { useStore } from './store';

function App() {
  const { route, navigate } = useHashRoute();
  const { activeCampaignId, setActiveCampaignId, loadCampaign, setSelectedCharacter } = useStore();

  useEffect(() => {
    if (route.campaignId && route.campaignId !== activeCampaignId) {
      void loadCampaign(route.campaignId);
    } else if (!route.campaignId && activeCampaignId) {
      navigate({ ...route, campaignId: activeCampaignId });
    }
  }, [route.campaignId, activeCampaignId, loadCampaign, navigate]);

  useEffect(() => {
    if (route.characterId) {
      setSelectedCharacter(route.characterId);
    }
  }, [route.characterId, setSelectedCharacter]);

  const resolvedRoute: AppRoute = useMemo(() => {
    if (route.campaignId) return route;
    return { ...route, campaignId: activeCampaignId };
  }, [route, activeCampaignId]);

  const renderSection = () => {
    switch (resolvedRoute.section) {
      case 'dashboard':
      case 'campaign':
        return <DashboardSection campaignId={resolvedRoute.campaignId} onNavigate={navigate} />;
      case 'campaigns':
        return <CampaignsSection onNavigate={navigate} />;
      case 'characters':
        return <CharactersSection campaignId={resolvedRoute.campaignId} onNavigate={navigate} />;
      case 'moves':
        return <MovesSection campaignId={resolvedRoute.campaignId} onNavigate={navigate} />;
      case 'oracles':
        return <OraclesSection onNavigate={navigate} campaignId={resolvedRoute.campaignId} />;
      case 'world-map':
        return <WorldMapSection campaignId={resolvedRoute.campaignId} onNavigate={navigate} />;
      case 'sites':
        return <SitesSection campaignId={resolvedRoute.campaignId} onNavigate={navigate} />;
      case 'log':
        return <SessionLogSection campaignId={resolvedRoute.campaignId} onNavigate={navigate} />;
      case 'settings':
        return <SettingsSection onNavigate={navigate} />;
      default:
        return <DashboardSection campaignId={resolvedRoute.campaignId} onNavigate={navigate} />;
    }
  };

  return (
    <AppLayout
      route={resolvedRoute}
      onNavigate={navigate}
      activeCampaignId={resolvedRoute.campaignId}
      onCampaignChange={(id) => {
        setActiveCampaignId(id);
        if (id) navigate({ ...resolvedRoute, campaignId: id });
      }}
    >
      {renderSection()}
    </AppLayout>
  );
}

export default App;
