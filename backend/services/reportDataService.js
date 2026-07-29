import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';

export const getMonthlyReportData = async (userId, month, year) => {
    try {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        const userIdObj = new mongoose.Types.ObjectId(userId);

        // 1. Opening Balance (All time before this month)
        const previousTransactions = await Expense.aggregate([
            { $match: { userId: userIdObj, date: { $lt: startOfMonth } } },
            { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);
        
        let previousIncome = 0;
        let previousExpense = 0;
        previousTransactions.forEach(t => {
            if (t._id === 'Income') previousIncome = t.total;
            if (t._id === 'Expense') previousExpense = t.total;
        });
        const openingBalance = previousIncome - previousExpense;

        // 2. Current Month Transactions
        const currentTransactions = await Expense.find({
            userId: userIdObj,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ amount: -1 }); // Sort by amount descending for top expenses

        let totalIncome = 0;
        let totalExpense = 0;
        let highestExpense = null;
        let highestIncome = null;
        const categoryMap = {};
        const dailyMap = {};
        const expensesOnly = [];
        const merchantMap = {};

        currentTransactions.forEach(t => {
            if (t.type === 'Income') {
                totalIncome += t.amount;
                if (!highestIncome || t.amount > highestIncome.amount) {
                    highestIncome = t;
                }
            } else {
                totalExpense += t.amount;
                expensesOnly.push(t);
                if (!highestExpense || t.amount > highestExpense.amount) {
                    highestExpense = t;
                }

                // Category breakdown
                categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;

                // Daily trend
                const day = new Date(t.date).getDate();
                dailyMap[day] = (dailyMap[day] || 0) + t.amount;

                // Merchant tracking
                if (t.merchant) {
                    merchantMap[t.merchant] = (merchantMap[t.merchant] || 0) + 1;
                }
            }
        });

        const totalSavings = totalIncome - totalExpense;
        const netCashFlow = totalIncome - totalExpense;
        const transactionCount = currentTransactions.length;
        const daysInMonth = endOfMonth.getDate();
        const avgDailySpending = totalExpense / daysInMonth;
        const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

        // Formatted Category Breakdown
        const categoryBreakdown = Object.keys(categoryMap).map(category => ({
            category,
            amount: categoryMap[category],
            percentage: totalExpense > 0 ? (categoryMap[category] / totalExpense) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);

        const highestSpendingCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'N/A';
        const lowestSpendingCategory = categoryBreakdown.length > 0 ? categoryBreakdown[categoryBreakdown.length - 1].category : 'N/A';

        // Most frequent merchant
        let mostFrequentMerchant = 'N/A';
        let maxMerchantCount = 0;
        for (const [merchant, count] of Object.entries(merchantMap)) {
            if (count > maxMerchantCount) {
                maxMerchantCount = count;
                mostFrequentMerchant = merchant;
            }
        }

        // Daily trend array
        const dailyTrend = [];
        for (let i = 1; i <= daysInMonth; i++) {
            dailyTrend.push({ day: i, amount: dailyMap[i] || 0 });
        }

        // Weekly spending (approximate 4 weeks)
        const weeklySpending = [0, 0, 0, 0];
        expensesOnly.forEach(t => {
            const day = new Date(t.date).getDate();
            if (day <= 7) weeklySpending[0] += t.amount;
            else if (day <= 14) weeklySpending[1] += t.amount;
            else if (day <= 21) weeklySpending[2] += t.amount;
            else weeklySpending[3] += t.amount;
        });

        // Top 10 expenses
        const top10Expenses = expensesOnly.slice(0, 10).map(t => ({
            date: t.date,
            merchant: t.merchant || 'Unknown',
            category: t.category,
            amount: t.amount,
            description: t.description
        }));

        // Budget Utilization
        const monthString = `${year}-${String(month).padStart(2, '0')}`;
        const budgets = await Budget.find({ userId: userIdObj, month: monthString });
        
        const budgetProgress = budgets.map(b => {
            const spent = categoryMap[b.category] || 0;
            return {
                category: b.category,
                limit: b.monthlyLimit,
                spent,
                utilization: b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0
            };
        });

        return {
            month,
            year,
            openingBalance,
            totalIncome,
            totalExpense,
            totalSavings,
            netCashFlow,
            transactionCount,
            avgDailySpending,
            highestExpense,
            highestIncome,
            highestSpendingCategory,
            lowestSpendingCategory,
            mostFrequentMerchant,
            biggestTransaction: highestExpense,
            savingsRate,
            categoryBreakdown,
            dailyTrend,
            weeklySpending,
            top10Expenses,
            budgetProgress
        };
    } catch (error) {
        console.error('Error in getMonthlyReportData:', error);
        throw error;
    }
};
