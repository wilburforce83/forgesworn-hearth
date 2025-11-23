import { Router } from 'express';
import { rollOracle } from '../services/oracleService';

const router = Router();

router.get('/:oracleId/roll', async (req, res, next) => {
  try {
    const { oracleId } = req.params;
    const rollParam = req.query.roll;

    let fixedRoll: number | undefined;
    if (typeof rollParam === 'string') {
      const parsed = Number(rollParam);
      if (Number.isFinite(parsed)) {
        fixedRoll = parsed;
      }
    }

    const result = await rollOracle(oracleId, {
      fixedRoll,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
