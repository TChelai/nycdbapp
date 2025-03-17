import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth';
import { protect } from '../middleware/auth';

const router = Router();

// Register a new user
router.post('/register', register);

// Login
router.post('/login', login);

// Get current user (protected route)
router.get('/me', protect, getMe);

export default router;
