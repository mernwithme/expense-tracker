import mongoose from 'mongoose';
import AIInsight from '../models/AIInsight.js';
import {
    getCategoryWiseTotals,
    getMonthlyTrend,
    getTopCategories
} from '../utils/aggregations.js';
import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import {
    generateSpendingInsights,
    generateSavingTips,
    predictOverspendingRisk
} from '../services/aiService.js';

/**
 * Generate comprehensive AI insights
 */
export const generateInsights = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { forceRefresh = false } = req.query;

        // Check for cached insights (if not forcing refresh)
        if (!forceRefresh) {
            const cachedInsight = await AIInsight.findRecentInsight(userId, 'spending_analysis', 24);

            if (cachedInsight) {
                return res.status(200).json({
                    success: true,
                    message: 'Retrieved cached insights',
                    data: {
                        insights: cachedInsight.response,
                        cached: true,
                        generatedAt: cachedInsight.createdAt
                    }
                });
            }
        }

        // Get current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Gather all necessary data using aggregations
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
                        _id: '$category',
                        actual: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        // Calculate budget status
        const spendingMap = {};
        actualSpending.forEach(item => {
            spendingMap[item._id] = item.actual;
        });

        const budgetStatus = budgets.map(budget => {
            const actual = spendingMap[budget.category] || 0;
            return {
                category: budget.category,
                monthlyLimit: budget.monthlyLimit,
                actual: Math.round(actual * 100) / 100,
                remaining: Math.round((budget.monthlyLimit - actual) * 100) / 100,
                isOverspent: actual > budget.monthlyLimit,
                percentageUsed: budget.monthlyLimit > 0
                    ? Math.round((actual / budget.monthlyLimit) * 100)
                    : 0
            };
        });

        // Calculate total metrics
        const totalMonthlyBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
        const totalSpentThisMonth = actualSpending.reduce((sum, item) => sum + item.actual, 0);

        let overspentAmount = 0;
        let remainingAmount = 0;

        if (totalSpentThisMonth > totalMonthlyBudget) {
            overspentAmount = totalSpentThisMonth - totalMonthlyBudget;
        } else {
            remainingAmount = totalMonthlyBudget - totalSpentThisMonth;
        }

        // Get top categories details
        const sortedCategories = [...categoryTotals].sort((a, b) => b.total - a.total);
        const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : { category: 'None', total: 0 };
        const secondCategory = sortedCategories.length > 1 ? sortedCategories[1] : { category: 'None', total: 0 };

        const topCategoryPercentage = totalSpentThisMonth > 0
            ? Math.round((topCategory.total / totalSpentThisMonth) * 100)
            : 0;

        // Prepare data snapshot for AI
        const dataSnapshot = {
            budget: totalMonthlyBudget,
            totalSpent: totalSpentThisMonth,
            overspentAmount,
            remainingAmount,
            topCategory: topCategory.category,
            topCategoryPercentage,
            secondCategory: secondCategory.category !== 'None' ? secondCategory.category : 'None',
            raw: {
                categoryTotals,
                monthlyTrend,
                budgetStatus,
                topCategories
            },
            month: currentMonth
        };

        // Generate AI insights
        const aiResponse = await generateSpendingInsights(dataSnapshot);

        // Cache the AI response
        const insight = new AIInsight({
            userId,
            insightType: 'spending_analysis',
            dataSnapshot,
            response: aiResponse,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        await insight.save();

        res.status(200).json({
            success: true,
            message: 'AI insights generated successfully',
            data: {
                insights: aiResponse,
                cached: false,
                generatedAt: insight.createdAt,
                dataUsed: {
                    categoriesAnalyzed: categoryTotals.length,
                    monthsAnalyzed: monthlyTrend.length,
                    budgetsTracked: budgetStatus.length
                }
            }
        });

    } catch (error) {
        console.error('Generate insights error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating AI insights',
            error: error.message
        });
    }
};

/**
 * Generate saving tips
 */
export const getSavingTips = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);

        // Check cache
        const cachedTips = await AIInsight.findRecentInsight(userId, 'budget_optimization', 48);

        if (cachedTips) {
            return res.status(200).json({
                success: true,
                data: {
                    tips: cachedTips.response,
                    cached: true
                }
            });
        }

        // Get current month data
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const [categoryTotals, budgets, actualSpending] = await Promise.all([
            getCategoryWiseTotals(userId, startOfMonth, endOfMonth),
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
                        _id: '$category',
                        actual: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        // Calculate budget status
        const spendingMap = {};
        actualSpending.forEach(item => {
            spendingMap[item._id] = item.actual;
        });

        const budgetStatus = budgets.map(budget => ({
            category: budget.category,
            monthlyLimit: budget.monthlyLimit,
            actual: spendingMap[budget.category] || 0
        }));

        // Generate tips
        const tips = await generateSavingTips(categoryTotals, budgetStatus);

        // Cache the tips
        const insight = new AIInsight({
            userId,
            insightType: 'budget_optimization',
            dataSnapshot: { categoryTotals, budgetStatus },
            response: tips,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
        });

        await insight.save();

        res.status(200).json({
            success: true,
            data: {
                tips,
                cached: false
            }
        });

    } catch (error) {
        console.error('Get saving tips error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating saving tips',
            error: error.message
        });
    }
};

/**
 * Predict overspending risk
 */
export const predictRisk = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);

        // Get data
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const [monthlyTrend, currentSpending, budgets] = await Promise.all([
            getMonthlyTrend(userId, 6),
            Expense.aggregate([
                {
                    $match: {
                        userId,
                        date: { $gte: startOfMonth, $lte: endOfMonth }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        total: { $sum: '$amount' }
                    }
                }
            ]),
            Budget.find({ userId, month: currentMonth })
        ]);

        // Generate prediction
        const prediction = await predictOverspendingRisk(monthlyTrend, currentSpending, budgets);

        res.status(200).json({
            success: true,
            data: { prediction }
        });

    } catch (error) {
        console.error('Predict risk error:', error);
        res.status(500).json({
            success: false,
            message: 'Error predicting risk',
            error: error.message
        });
    }
};

/**
 * Get all cached insights for user
 */
export const getCachedInsights = async (req, res) => {
    try {
        const userId = req.user.userId;

        const insights = await AIInsight.find({
            userId,
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: { insights }
        });

    } catch (error) {
        console.error('Get cached insights error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cached insights',
            error: error.message
        });
    }
};
