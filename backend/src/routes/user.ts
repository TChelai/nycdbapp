import { Router } from 'express';
import { savePreferences, getPreferences, saveQuery, getSavedQueries, deleteQuery } from '../controllers/user';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// User preferences routes
router.get('/preferences', getPreferences);
router.post('/preferences', savePreferences);

// Saved queries routes
router.get('/saved-queries', getSavedQueries);
router.post('/saved-queries', saveQuery);
router.delete('/saved-queries/:id', deleteQuery);

export default router;
