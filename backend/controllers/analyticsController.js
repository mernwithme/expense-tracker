import mongoose from 'mongoose';
import {
    getCategoryWiseTotals,
    getMonthlyTrend,
    getCategoryMonthlyTrend,
    getYearlySummary,
    getTopCategories
} from '../utils/aggregations.js';
import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';

/**
 * Get category-wise spending totals
 */
export const getCategoryTotals = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { startDate, endDate } = req.query;

        // Default to current month if no dates provided
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const categoryTotals = await getCategoryWiseTotals(userId, start, end);

        res.status(200).json({
            success: true,
            data: {
                categoryTotals,
                period: {
                    startDate: start,
                    endDate: end
                }
            }
        });

    } catch (error) {
        console.error('Get category totals error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category totals',
            error: error.message
        });
    }
};

/**
 * Get monthly spending trend
 */
export const getMonthlyTrendData = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { months = 6 } = req.query;

        const monthlyTrend = await getMonthlyTrend(userId, parseInt(months));

        res.status(200).json({
            success: true,
            data: { monthlyTrend }
        });

    } catch (error) {
        console.error('Get monthly trend error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly trend',
            error: error.message
        });
    }
};

/**
 * Get category-wise monthly trend
 */
export const getCategoryTrendData = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { months = 6 } = req.query;

        const categoryTrend = await getCategoryMonthlyTrend(userId, parseInt(months));

        res.status(200).json({
            success: true,
            data: { categoryTrend }
        });

    } catch (error) {
        console.error('Get category trend error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category trend',
            error: error.message
        });
    }
};

/**
 * Get yearly summary
 */
export const getYearlySummaryData = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { year = new Date().getFullYear() } = req.query;

        const yearlySummary = await getYearlySummary(userId, parseInt(year));

        res.status(200).json({
            success: true,
            data: {
                year: parseInt(year),
                summary: yearlySummary
            }
        });

    } catch (error) {
        console.error('Get yearly summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching yearly summary',
            error: error.message
        });
    }
};

/**
 * Get overspending categories (categories exceeding budget)
 */
export const getOverspendingCategories = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);

        // Get current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Get budgets for current month
        const budgets = await Budget.find({ userId, month: currentMonth });

        // Get actual spending per category
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

        // Create spending map
        const spendingMap = {};
        actualSpending.forEach(item => {
            spendingMap[item._id] = item.actual;
        });

        // Find overspending categories
        const overspendingCategories = budgets
            .map(budget => {
                const actual = spendingMap[budget.category] || 0;
                const overspent = actual - budget.monthlyLimit;

                return {
                    category: budget.category,
                    budget: budget.monthlyLimit,
                    actual: Math.round(actual * 100) / 100,
                    overspent: Math.round(overspent * 100) / 100,
                    percentageOver: Math.round(((actual / budget.monthlyLimit) - 1) * 100)
                };
            })
            .filter(item => item.overspent > 0)
            .sort((a, b) => b.overspent - a.overspent);

        res.status(200).json({
            success: true,
            data: {
                month: currentMonth,
                overspendingCategories,
                count: overspendingCategories.length
            }
        });

    } catch (error) {
        console.error('Get overspending categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching overspending categories',
            error: error.message
        });
    }
};

/**
 * Get top spending categories
 */
export const getTopSpendingCategories = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { limit = 5, startDate, endDate } = req.query;

        const topCategories = await getTopCategories(userId, parseInt(limit), startDate, endDate);

        res.status(200).json({
            success: true,
            data: { topCategories }
        });

    } catch (error) {
        console.error('Get top categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top categories',
            error: error.message
        });
    }
};

/**
 * Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);

        // Get current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Fetch all analytics data in parallel
        const [
            categoryTotals,
            monthlyTrend,
            topCategories,
            budgets,
            actualSpending
        ] = await Promise.all([
            getCategoryWiseTotals(userId, startOfMonth, endOfMonth),
            getMonthlyTrend(userId, 6),
            getTopCategories(userId, 5, startOfMonth, endOfMonth),
            Budget.find({ userId, month: currentMonth }),
            Expense.aggregate([
                {
                    $match: {
                        userId,
                        date: { $gte: startOfMonth, $lte: endOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Calculate budget status
        const spendingMap = {};
        categoryTotals.forEach(item => {
            spendingMap[item.category] = item.total;
        });

        let totalBudget = 0;
        let budgetUsed = 0;

        budgets.forEach(budget => {
            totalBudget += budget.monthlyLimit;
            budgetUsed += spendingMap[budget.category] || 0;
        });

        const currentMonthTotal = actualSpending.length > 0 ? actualSpending[0].total : 0;

        res.status(200).json({
            success: true,
            data: {
                currentMonth: {
                    total: Math.round(currentMonthTotal * 100) / 100,
                    expenseCount: actualSpending.length > 0 ? actualSpending[0].count : 0,
                    totalBudget: Math.round(totalBudget * 100) / 100,
                    budgetUsed: Math.round(budgetUsed * 100) / 100,
                    budgetRemaining: Math.round((totalBudget - budgetUsed) * 100) / 100,
                    budgetPercentageUsed: totalBudget > 0 ? Math.round((budgetUsed / totalBudget) * 100) : 0
                },
                categoryTotals,
                monthlyTrend,
                topCategories
            }
        });

    } catch (error) {
        console.error('Get dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard analytics',
            error: error.message
        });
    }
};
