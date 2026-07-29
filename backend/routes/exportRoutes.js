import express from 'express';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { generateCSV, generateExcel, generatePDF } from '../services/exportService.js';
import mongoose from 'mongoose';

const router = express.Router();
router.use(authenticateToken);

// Middleware to check email verification for report email functionality
const requireVerifiedEmail = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email not verified. Please verify your email to receive reports.'
            });
        }
        req.userModel = user;
        next();
    } catch (error) {
        console.error('Email verification check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking email verification status.'
        });
    }
};

const buildExpenseQuery = (userIdStr, category, startDate, endDate) => {
    const userId = mongoose.Types.ObjectId.createFromHexString(userIdStr);
    const query = { userId };

    if (category && category !== 'All') {
        query.category = category;
    }

    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`);
        }
        if (endDate) {
            query.date.$lte = new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`);
        }
    }

    return query;
};

router.get('/csv', async (req, res) => {
    try {
        const { category, startDate, endDate } = req.query;
        const query = buildExpenseQuery(req.user.userId, category, startDate, endDate);
        const expenses = await Expense.find(query).sort({ date: -1 });

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No expenses found for the selected criteria'
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

router.get('/excel', async (req, res) => {
    try {
        const { category, startDate, endDate } = req.query;
        const query = buildExpenseQuery(req.user.userId, category, startDate, endDate);
        const expenses = await Expense.find(query).sort({ date: -1 });

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No expenses found for the selected criteria'
            });
        }

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const summary = {
            total,
            count: expenses.length,
            avgExpense: total / expenses.length
        };
        const excelBuffer = generateExcel(expenses, summary);
        const filename = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting Excel',
            error: error.message
        });
    }
});

router.get('/pdf', async (req, res) => {
    try {
        const { category, startDate, endDate } = req.query;
        const query = buildExpenseQuery(req.user.userId, category, startDate, endDate);

        const [expenses, user] = await Promise.all([
            Expense.find(query).sort({ date: -1 }),
            User.findById(req.user.userId)
        ]);

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No expenses found for the selected criteria'
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
        const pdfBuffer = await generatePDF(expenses, summary, user ? user.name : 'User');
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
