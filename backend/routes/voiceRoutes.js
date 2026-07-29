import express from 'express';
import { parseVoiceExpense } from '../controllers/voiceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.post('/parse', parseVoiceExpense);

export default router;
