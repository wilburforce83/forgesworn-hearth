import { Router } from 'express';
import {
  appendSessionLogEntry,
  createCampaign,
  getCampaignById,
  addCharacterToCampaign,
  updateCharacterInCampaign,
  setHexMap,
} from '../services/campaignService';
import { Character, SessionLogEntry, Hex } from '../models/Campaign';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { campaignId, name, worldTruths } = req.body;
    const campaign = await createCampaign({ campaignId, name, worldTruths });
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

router.get('/:campaignId', async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

router.post('/:campaignId/party', async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const character = req.body as Character;
    const campaign = await addCharacterToCampaign(campaignId, character);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

router.patch('/:campaignId/party/:characterId', async (req, res, next) => {
  try {
    const { campaignId, characterId } = req.params;
    const updates = req.body as Partial<Character>;
    const campaign = await updateCharacterInCampaign(campaignId, characterId, updates);
    res.json(campaign);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Campaign not found')) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    if (error instanceof Error && error.message.includes('Character not found')) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    next(error);
  }
});

router.post('/:campaignId/log', async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const entry = req.body as SessionLogEntry;
    const campaign = await appendSessionLogEntry(campaignId, entry);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

router.put('/:campaignId/hexmap', async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const hexes = req.body as Hex[];
    const campaign = await setHexMap(campaignId, hexes);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

export default router;
