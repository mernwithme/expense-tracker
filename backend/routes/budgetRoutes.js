import express from 'express';
import {
    setBudget,
    getBudgets,
    getCurrentMonthBudgets,
    updateBudget,
    deleteBudget
} from '../controllers/budgetController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validate, budgetValidation } from '../middleware/validateMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.post('/', validate(budgetValidation), setBudget);
router.get('/', getBudgets);
router.get('/current-month', getCurrentMonthBudgets);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
