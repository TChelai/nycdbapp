import { Router } from 'express';
import datasetsRoutes from './datasets';
import authRoutes from './auth';
import userRoutes from './user';

const router = Router();

router.use('/datasets', datasetsRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
