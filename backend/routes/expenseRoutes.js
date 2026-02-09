import express from 'express';
import {
    createExpense,
    getExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseSummary
} from '../controllers/expenseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validate, expenseValidation } from '../middleware/validateMiddleware.js';

const router = express.Router();
router.use(authenticateToken);
router.post('/', validate(expenseValidation), createExpense);
router.get('/', getExpenses);
router.get('/summary', getExpenseSummary);
router.get('/:id', getExpenseById);
router.put('/:id', validate(expenseValidation), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
