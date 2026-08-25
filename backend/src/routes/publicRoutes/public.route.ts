import { Router } from 'express';
import { getPublicProfileByUsername } from '../../controllers/publicController/influencerProfile.controller';

const router = Router();

router.get('/profile/:username', getPublicProfileByUsername);

router.all('/profile/:username', (req, res) => {
  res.status(405).json({ success: false, message: 'Method not allowed' });
});

export default router;