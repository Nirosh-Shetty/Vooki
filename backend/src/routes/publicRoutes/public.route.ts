import { Router } from 'express';
import { getPublicProfileByIdentifier } from '../../controllers/publicController/influencerProfile.controller';

const router = Router();

router.get('/profile/:identifier', getPublicProfileByIdentifier);
router.get('/creator/:identifier', getPublicProfileByIdentifier);

router.all('/profile/:identifier', (req, res) => {
  res.status(405).json({ success: false, message: 'Method not allowed' });
});

router.all('/creator/:identifier', (req, res) => {
  res.status(405).json({ success: false, message: 'Method not allowed' });
});

export default router;