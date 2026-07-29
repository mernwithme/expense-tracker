import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getPreferences, updatePreferences, getReportHistory, triggerReport } from '../controllers/reportController.js';

const router = express.Router();

router.use(authenticateToken); // Protect all report routes

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.get('/history', getReportHistory);
router.post('/trigger', triggerReport); // Can be restricted to admin in production

export default router;
