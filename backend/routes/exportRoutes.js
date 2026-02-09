import express from 'express';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { generateCSV, generatePDF } from '../services/exportService.js';
import mongoose from 'mongoose';

const router = express.Router();
router.use(authenticateToken);
router.get('/csv', async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { category, startDate, endDate } = req.query;
        const query = { userId };
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        const expenses = await Expense.find(query).sort({ date: -1 });

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No expenses found for the specified criteria'
            });
        }
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const summary = {
            total,
            count: expenses.length,
            avgExpense: total / expenses.length
        };
        const csv = generateCSV(expenses, summary);
        const filename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);

    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting CSV',
            error: error.message
        });
    }
});
router.get('/pdf', async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { category, startDate, endDate } = req.query;
        const query = { userId };
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        const [expenses, user] = await Promise.all([
            Expense.find(query).sort({ date: -1 }),
            User.findById(req.user.userId)
        ]);

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No expenses found for the specified criteria'
            });
        }
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const summary = {
            total,
            count: expenses.length,
            avgExpense: total / expenses.length,
            startDate: startDate || expenses[expenses.length - 1].date,
            endDate: endDate || expenses[0].date
        };
        const pdfBuffer = await generatePDF(expenses, summary, user.name);
        const filename = `expense_report_${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting PDF',
            error: error.message
        });
    }
});

export default router;
