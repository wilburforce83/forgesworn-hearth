import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  addCharacter as apiAddCharacter,
  createCampaign as apiCreateCampaign,
  getCampaign as apiGetCampaign,
  listCampaigns,
  updateCampaign as apiUpdateCampaign,
  updateCharacter as apiUpdateCharacter,
} from '../api/campaigns';
import { revealHexArea } from '../api/hex';
import { addLocation as apiAddLocation, updateLocation as apiUpdateLocation } from '../api/locations';
import { appendSessionLogEntry } from '../api/sessionLog';
import type {
  CampaignDto,
  CharacterDto,
  HexDto,
  LocationDto,
  SessionLogEntryDto,
} from '../api/types';
import type { AppRoute } from '../navigation';

interface StoreState {
  activeCampaignId?: string;
  campaigns: Record<string, CampaignDto>;
  cachedCampaigns: Array<{ campaignId: string; name: string }>;
  selectedCharacterId?: string;
  loadingCampaign?: string;
  error?: string;
}

interface StoreApi extends StoreState {
  setActiveCampaignId: (id?: string) => void;
  loadCampaign: (id: string) => Promise<CampaignDto | null>;
  createCampaign: (body: { campaignId: string; name: string; worldTruths?: string[] }) => Promise<CampaignDto>;
  addCharacter: (campaignId: string, character: CharacterDto) => Promise<CampaignDto | null>;
  updateCharacter: (
    campaignId: string,
    characterId: string,
    updates: Partial<CharacterDto>
  ) => Promise<CampaignDto | null>;
  addLogEntry: (campaignId: string, entry: SessionLogEntryDto) => Promise<CampaignDto | null>;
  addLocation: (campaignId: string, location: LocationDto) => Promise<CampaignDto | null>;
  updateLocation: (
    campaignId: string,
    locationId: string,
    updates: Partial<LocationDto>
  ) => Promise<CampaignDto | null>;
  revealArea: (
    campaignId: string,
    payload: { x: number; y: number; allowPoi?: boolean }
  ) => Promise<{ hexes: HexDto[] } | null>;
  setSelectedCharacter: (id?: string) => void;
  refreshLocalCampaigns: () => Promise<void>;
  updateCampaign: (
    campaignId: string,
    updates: Partial<Pick<CampaignDto, 'name' | 'worldTruths' | 'hexMap'>>
  ) => Promise<CampaignDto | null>;
}

const StoreContext = createContext<StoreApi | undefined>(undefined);
const ACTIVE_KEY = 'fh_active_campaign';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    activeCampaignId: undefined,
    campaigns: {},
    cachedCampaigns: [],
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_KEY);
      if (stored) {
        setState((prev) => ({ ...prev, activeCampaignId: stored }));
      }
    } catch {
      // ignore
    }
    void listCampaigns().then((c) => setState((prev) => ({ ...prev, cachedCampaigns: c })));
  }, []);

  const setActiveCampaignId = useCallback((id?: string) => {
    setState((prev) => ({ ...prev, activeCampaignId: id }));
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const setCampaign = useCallback((campaign: CampaignDto) => {
    setState((prev) => ({
      ...prev,
      campaigns: { ...prev.campaigns, [campaign.campaignId]: campaign },
    }));
  }, []);

  const loadCampaign = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loadingCampaign: id, error: undefined }));
    try {
      const data = await apiGetCampaign(id);
      setCampaign(data);
      setActiveCampaignId(id);
      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load campaign',
        loadingCampaign: undefined,
      }));
      return null;
    } finally {
      setState((prev) => ({ ...prev, loadingCampaign: undefined }));
    }
  }, [setActiveCampaignId, setCampaign]);

  const createCampaign = useCallback(
    async (body: { campaignId: string; name: string; worldTruths?: string[] }) => {
      const created = await apiCreateCampaign(body);
      setCampaign(created);
      setActiveCampaignId(created.campaignId);
      setState((prev) => ({
        ...prev,
        cachedCampaigns: [...prev.cachedCampaigns, { campaignId: created.campaignId, name: created.name }],
      }));
      return created;
    },
    [setCampaign, setActiveCampaignId]
  );

  const addCharacter = useCallback(
    async (campaignId: string, character: CharacterDto) => {
      try {
        const campaign = await apiAddCharacter(campaignId, character);
        setCampaign(campaign);
        return campaign;
      } catch (error) {
        setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to add character' }));
        return null;
      }
    },
    [setCampaign]
  );

  const updateCharacter = useCallback(
    async (campaignId: string, characterId: string, updates: Partial<CharacterDto>) => {
      try {
        const res = await apiUpdateCharacter(campaignId, characterId, updates);
        setCampaign(res);
        return res;
      } catch (error) {
        setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update character' }));
        return null;
      }
    },
    [setCampaign]
  );

  const addLogEntry = useCallback(
    async (campaignId: string, entry: SessionLogEntryDto) => {
      try {
        const res = await appendSessionLogEntry(campaignId, entry);
        setCampaign(res);
        return res;
      } catch (error) {
        setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to write log' }));
        return null;
      }
    },
    [setCampaign]
  );

  const addLocation = useCallback(
    async (campaignId: string, location: LocationDto) => {
      try {
        const res = await apiAddLocation(campaignId, location);
        setCampaign(res);
        return res;
      } catch (error) {
        setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to add location' }));
        return null;
      }
    },
    [setCampaign]
  );

  const updateLocation = useCallback(
    async (campaignId: string, locationId: string, updates: Partial<LocationDto>) => {
      try {
        const res = await apiUpdateLocation(campaignId, locationId, updates);
        setCampaign(res);
        return res;
      } catch (error) {
        setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update location' }));
        return null;
      }
    },
    [setCampaign]
  );

  const revealArea = useCallback(
    async (campaignId: string, payload: { x: number; y: number; allowPoi?: boolean }) => {
      try {
        const res = await revealHexArea(campaignId, payload);
        setCampaign(res.campaign);
        return { hexes: res.hexes };
      } catch (error) {
        setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to reveal hexes' }));
        return null;
      }
    },
    [setCampaign]
  );

  const setSelectedCharacter = useCallback((id?: string) => {
    setState((prev) => ({ ...prev, selectedCharacterId: id }));
  }, []);

  const updateCampaign = useCallback(
    async (campaignId: string, updates: Partial<Pick<CampaignDto, 'name' | 'worldTruths' | 'hexMap'>>) => {
      try {
        const res = await apiUpdateCampaign(campaignId, updates);
        setCampaign(res);
        return res;
      } catch (error) {
        setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update campaign' }));
        return null;
      }
    },
    [setCampaign]
  );

  const refreshLocalCampaigns = useCallback(async () => {
    const list = await listCampaigns();
    setState((prev) => ({ ...prev, cachedCampaigns: list }));
  }, []);

  const value: StoreApi = useMemo(
    () => ({
      ...state,
      setActiveCampaignId,
      loadCampaign,
      createCampaign,
      addCharacter,
      updateCharacter,
      addLogEntry,
      addLocation,
      updateLocation,
      revealArea,
      setSelectedCharacter,
      refreshLocalCampaigns,
      updateCampaign,
    }),
    [
      state,
      setActiveCampaignId,
      loadCampaign,
      createCampaign,
      addCharacter,
      updateCharacter,
      addLogEntry,
      addLocation,
      updateLocation,
      revealArea,
      setSelectedCharacter,
      refreshLocalCampaigns,
      updateCampaign,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
}

export function useActiveCampaign(): CampaignDto | null {
  const { campaigns, activeCampaignId } = useStore();
  if (!activeCampaignId) return null;
  return campaigns[activeCampaignId] ?? null;
}

export function selectCharacterFromRoute(route: AppRoute, campaign?: CampaignDto) {
  if (!campaign) return null;
  if (route.characterId) {
    return campaign.party.find((c) => c.characterId === route.characterId) ?? null;
  }
  return null;
}
