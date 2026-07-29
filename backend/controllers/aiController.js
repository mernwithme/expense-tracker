import mongoose from 'mongoose';
import AIInsight from '../models/AIInsight.js';
import AIHistory from '../models/AIHistory.js';
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
import geminiService from '../services/geminiService.js';

/**
 * Generate comprehensive AI insights
 */
export const generateInsights = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const { forceRefresh = false } = req.query;

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

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

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

        const totalMonthlyBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
        const totalSpentThisMonth = actualSpending.reduce((sum, item) => sum + item.actual, 0);

        let overspentAmount = 0;
        let remainingAmount = 0;

        if (totalSpentThisMonth > totalMonthlyBudget) {
            overspentAmount = totalSpentThisMonth - totalMonthlyBudget;
        } else {
            remainingAmount = totalMonthlyBudget - totalSpentThisMonth;
        }

        const sortedCategories = [...categoryTotals].sort((a, b) => b.total - a.total);
        const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : { category: 'None', total: 0 };
        const secondCategory = sortedCategories.length > 1 ? sortedCategories[1] : { category: 'None', total: 0 };

        const topCategoryPercentage = totalSpentThisMonth > 0
            ? Math.round((topCategory.total / totalSpentThisMonth) * 100)
            : 0;

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

        const aiResponse = await geminiService.analyzeSpendingWithGemini(userId, {
            totalSpent: totalSpentThisMonth,
            totalBudget: totalMonthlyBudget,
            categoryTotals,
            monthlyTrend,
            topCategory: topCategory.category
        }) || await generateSpendingInsights(dataSnapshot);

        const insight = new AIInsight({
            userId,
            insightType: 'spending_analysis',
            dataSnapshot,
            response: aiResponse,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
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

        const spendingMap = {};
        actualSpending.forEach(item => {
            spendingMap[item._id] = item.actual;
        });

        const budgetStatus = budgets.map(budget => ({
            category: budget.category,
            monthlyLimit: budget.monthlyLimit,
            actual: spendingMap[budget.category] || 0
        }));

        const tips = await generateSavingTips(categoryTotals, budgetStatus);

        const insight = new AIInsight({
            userId,
            insightType: 'budget_optimization',
            dataSnapshot: { categoryTotals, budgetStatus },
            response: tips,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
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
 * Interactive AI Chat Endpoint (Gemini API)
 */
export const handleAIChat = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { query } = req.body;

        if (!query || typeof query !== 'string' || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Query string is required'
            });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const [categoryTotals, monthlyTrend, budgets, actualSpending] = await Promise.all([
            getCategoryWiseTotals(userId, startOfMonth, endOfMonth),
            getMonthlyTrend(userId, 6),
            Budget.find({ userId, month: currentMonth }),
            Expense.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
            ])
        ]);

        const totalSpent = actualSpending[0]?.totalSpent || 0;
        const totalBudget = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);

        const aiResponseText = await geminiService.processAIChat(userId, query.trim(), {
            totalSpent,
            totalBudget,
            categoryTotals,
            monthlyTrend
        });

        res.status(200).json({
            success: true,
            data: {
                prompt: query,
                response: aiResponseText,
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            success: false,
            message: 'AI Assistant failed to process query',
            error: error.message
        });
    }
};

/**
 * Get AI Chat History
 */
export const getAIChatHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const history = await AIHistory.find({ userId })
            .sort({ createdAt: -1 })
            .limit(30);

        res.status(200).json({
            success: true,
            data: { history }
        });
    } catch (error) {
        console.error('Get AI History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve AI history',
            error: error.message
        });
    }
};

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
