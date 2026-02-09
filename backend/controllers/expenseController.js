import Expense from '../models/Expense.js';
import mongoose from 'mongoose';

/**
 * Create a new expense
 */
export const createExpense = async (req, res) => {
    try {
        const { amount, category, description, date } = req.body;
        const userId = req.user.userId;

        const expense = new Expense({
            userId,
            amount,
            category,
            description,
            date: date || new Date()
        });

        await expense.save();

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: { expense }
        });

    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating expense',
            error: error.message
        });
    }
};

/**
 * Get all expenses for the authenticated user
 */
export const getExpenses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { category, startDate, endDate, limit = 100, skip = 0 } = req.query;

        // Build query
        const query = { userId: mongoose.Types.ObjectId.createFromHexString(userId) };

        if (category) {
            query.category = category;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Execute query with pagination
        const expenses = await Expense.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        // Get total count for pagination
        const total = await Expense.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                expenses,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    skip: parseInt(skip),
                    hasMore: total > parseInt(skip) + expenses.length
                }
            }
        });

    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expenses',
            error: error.message
        });
    }
};

/**
 * Get a single expense by ID
 */
export const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const expense = await Expense.findOne({ _id: id, userId });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { expense }
        });

    } catch (error) {
        console.error('Get expense by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expense',
            error: error.message
        });
    }
};

/**
 * Update an expense
 */
export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { amount, category, description, date } = req.body;

        // Find expense and verify ownership
        const expense = await Expense.findOne({ _id: id, userId });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Update fields
        if (amount !== undefined) expense.amount = amount;
        if (category !== undefined) expense.category = category;
        if (description !== undefined) expense.description = description;
        if (date !== undefined) expense.date = date;

        await expense.save();

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            data: { expense }
        });

    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating expense',
            error: error.message
        });
    }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Find and delete expense
        const expense = await Expense.findOneAndDelete({ _id: id, userId });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });

    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting expense',
            error: error.message
        });
    }
};

/**
 * Get expense statistics summary
 */
export const getExpenseSummary = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { startDate, endDate } = req.query;

        // Build match query
        const matchQuery = { userId };
        if (startDate || endDate) {
            matchQuery.date = {};
            if (startDate) matchQuery.date.$gte = new Date(startDate);
            if (endDate) matchQuery.date.$lte = new Date(endDate);
        }

        const summary = await Expense.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: '$amount' },
                    expenseCount: { $sum: 1 },
                    avgExpense: { $avg: '$amount' },
                    maxExpense: { $max: '$amount' },
                    minExpense: { $min: '$amount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalExpenses: { $round: ['$totalExpenses', 2] },
                    expenseCount: 1,
                    avgExpense: { $round: ['$avgExpense', 2] },
                    maxExpense: { $round: ['$maxExpense', 2] },
                    minExpense: { $round: ['$minExpense', 2] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: summary.length > 0 ? summary[0] : {
                totalExpenses: 0,
                expenseCount: 0,
                avgExpense: 0,
                maxExpense: 0,
                minExpense: 0
            }
        });

    } catch (error) {
        console.error('Get expense summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expense summary',
            error: error.message
        });
    }
};
