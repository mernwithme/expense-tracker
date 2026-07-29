import express from 'express';
import {
    generateInsights,
    getSavingTips,
    predictRisk,
    getCachedInsights,
    handleAIChat,
    getAIChatHistory
} from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.post('/generate-insights', generateInsights);
router.get('/saving-tips', getSavingTips);
router.get('/predict-risk', predictRisk);
router.get('/cached', getCachedInsights);

// Interactive Chat Endpoints
router.post('/chat', handleAIChat);
router.get('/chat/history', getAIChatHistory);

export default router;
