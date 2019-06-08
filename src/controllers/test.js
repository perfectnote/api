import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ code: 200, message: 'Test' });
});

export default router;