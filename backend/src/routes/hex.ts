import { Router } from 'express';
import { revealHexArea } from '../services/hexService';

const router = Router();

router.post('/:campaignId/reveal-area', async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { x, y, allowPoi } = req.body;

    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ error: 'x and y must be numbers' });
    }

    const result = await revealHexArea({
      campaignId,
      x,
      y,
      allowPoi: allowPoi === undefined ? true : Boolean(allowPoi),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
