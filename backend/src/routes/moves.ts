import { Router } from 'express';
import { MoveRollInput, rollMove } from '../services/moveService';

const router = Router();

router.post('/:moveId/roll', async (req, res, next) => {
  try {
    const { moveId } = req.params;
    const body = req.body as MoveRollInput;
    const result = await rollMove(moveId, body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
