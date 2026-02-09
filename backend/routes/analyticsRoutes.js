import express from 'express';
import {
    getCategoryTotals,
    getMonthlyTrendData,
    getCategoryTrendData,
    getYearlySummaryData,
    getOverspendingCategories,
    getTopSpendingCategories,
    getDashboardAnalytics
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/dashboard', getDashboardAnalytics);
router.get('/category-totals', getCategoryTotals);
router.get('/monthly-trend', getMonthlyTrendData);
router.get('/category-trend', getCategoryTrendData);
router.get('/yearly-summary', getYearlySummaryData);
router.get('/overspending', getOverspendingCategories);
router.get('/top-categories', getTopSpendingCategories);

export default router;
