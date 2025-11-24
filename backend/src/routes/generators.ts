import { Router } from 'express';
import { generateLocation, generateNpc } from '../services/generatorService';

const router = Router();

router.post('/npc', async (req, res, next) => {
  try {
    const { campaignId, hex } = req.body ?? {};
    const result = await generateNpc({ campaignId, hex });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/location', async (req, res, next) => {
  try {
    const { campaignId, hex } = req.body ?? {};
    const result = await generateLocation({ campaignId, hex });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
