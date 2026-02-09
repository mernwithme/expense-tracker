import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import mongoose from 'mongoose';

/**
 * Create or update a budget for a category
 */
export const setBudget = async (req, res) => {
    try {
        const { category, monthlyLimit, month } = req.body;
        const userId = req.user.userId;

        // Check if budget already exists for this user, category, and month
        let budget = await Budget.findOne({ userId, category, month });

        if (budget) {
            // Update existing budget
            budget.monthlyLimit = monthlyLimit;
            await budget.save();

            return res.status(200).json({
                success: true,
                message: 'Budget updated successfully',
                data: { budget }
            });
        }

        // Create new budget
        budget = new Budget({
            userId,
            category,
            monthlyLimit,
            month
        });

        await budget.save();

        res.status(201).json({
            success: true,
            message: 'Budget created successfully',
            data: { budget }
        });

    } catch (error) {
        console.error('Set budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting budget',
            error: error.message
        });
    }
};

/**
 * Get all budgets for the authenticated user
 */
export const getBudgets = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { month } = req.query;

        const query = { userId };
        if (month) {
            query.month = month;
        }

        const budgets = await Budget.find(query).sort({ month: -1, category: 1 });

        res.status(200).json({
            success: true,
            data: { budgets }
        });

    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching budgets',
            error: error.message
        });
    }
};

/**
 * Get current month budgets with actual spending
 */
export const getCurrentMonthBudgets = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);

        // Get current month in YYYY-MM format
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Get budgets for current month
        const budgets = await Budget.find({ userId, month: currentMonth });

        // Get start and end of current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Calculate actual spending per category
        const actualSpending = await Expense.aggregate([
            {
                $match: {
                    userId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    actual: { $sum: '$amount' }
                }
            }
        ]);

        // Create a map of category -> actual spending
        const spendingMap = {};
        actualSpending.forEach(item => {
            spendingMap[item._id] = item.actual;
        });

        // Combine budget and actual data
        const budgetStatus = budgets.map(budget => {
            const actual = spendingMap[budget.category] || 0;
            const remaining = budget.monthlyLimit - actual;
            const percentageUsed = budget.monthlyLimit > 0
                ? Math.round((actual / budget.monthlyLimit) * 100)
                : 0;

            return {
                category: budget.category,
                monthlyLimit: budget.monthlyLimit,
                actual: Math.round(actual * 100) / 100,
                remaining: Math.round(remaining * 100) / 100,
                percentageUsed,
                isOverspent: actual > budget.monthlyLimit,
                month: budget.month
            };
        });

        res.status(200).json({
            success: true,
            data: {
                month: currentMonth,
                budgets: budgetStatus
            }
        });

    } catch (error) {
        console.error('Get current month budgets error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching current month budgets',
            error: error.message
        });
    }
};

/**
 * Update a budget
 */
export const updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { monthlyLimit } = req.body;

        const budget = await Budget.findOne({ _id: id, userId });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        budget.monthlyLimit = monthlyLimit;
        await budget.save();

        res.status(200).json({
            success: true,
            message: 'Budget updated successfully',
            data: { budget }
        });

    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating budget',
            error: error.message
        });
    }
};

/**
 * Delete a budget
 */
export const deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const budget = await Budget.findOneAndDelete({ _id: id, userId });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Budget deleted successfully'
        });

    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting budget',
            error: error.message
        });
    }
};
