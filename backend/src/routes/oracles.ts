import { Router } from 'express';
import { rollOracle } from '../services/oracleService';

const router = Router();

router.get('/:oracleId/roll', async (req, res, next) => {
  try {
    const { oracleId } = req.params;
    const fixedRollValue = req.query.fixedRoll ? Number(req.query.fixedRoll) : undefined;
    const result = await rollOracle(oracleId, {
      fixedRoll: Number.isFinite(fixedRollValue) ? fixedRollValue : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
