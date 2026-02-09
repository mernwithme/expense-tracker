import Expense from '../models/Expense.js';

export const getCategoryWiseTotals = async (userId, startDate, endDate) => {
    try {
        const result = await Expense.aggregate([
            {
                $match: {
                    userId,
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    total: { $round: ['$total', 2] },
                    count: 1
                }
            }
        ]);

        return result;
    } catch (error) {
        console.error('Category-wise totals aggregation error:', error);
        throw error;
    }
};

export const getMonthlyTrend = async (userId, monthsCount = 6) => {
    try {
        const result = await Expense.aggregate([
            {
                $match: { userId }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1 }
            },
            {
                $limit: monthsCount
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    monthName: {
                        $arrayElemAt: [
                            ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                            '$_id.month'
                        ]
                    },
                    total: { $round: ['$total', 2] },
                    count: 1
                }
            }
        ]);

        return result;
    } catch (error) {
        console.error('Monthly trend aggregation error:', error);
        throw error;
    }
};

export const getCategoryMonthlyTrend = async (userId, monthsCount = 6) => {
    try {
        const result = await Expense.aggregate([
            {
                $match: { userId }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        category: '$category'
                    },
                    total: { $sum: '$amount' }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1 }
            },
            {
                $group: {
                    _id: { year: '$_id.year', month: '$_id.month' },
                    categories: {
                        $push: {
                            category: '$_id.category',
                            total: '$total'
                        }
                    },
                    monthTotal: { $sum: '$total' }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1 }
            },
            {
                $limit: monthsCount
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    categories: 1,
                    monthTotal: { $round: ['$monthTotal', 2] }
                }
            }
        ]);

        return result;
    } catch (error) {
        console.error('Category monthly trend aggregation error:', error);
        throw error;
    }
};

export const getYearlySummary = async (userId, year) => {
    try {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const result = await Expense.aggregate([
            {
                $match: {
                    userId,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id',
                    monthName: {
                        $arrayElemAt: [
                            ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                            '$_id'
                        ]
                    },
                    total: { $round: ['$total', 2] },
                    count: 1
                }
            }
        ]);

        return result;
    } catch (error) {
        console.error('Yearly summary aggregation error:', error);
        throw error;
    }
};


export const getTopCategories = async (userId, limit = 5, startDate, endDate) => {
    try {
        const matchCondition = { userId };

        if (startDate && endDate) {
            matchCondition.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const result = await Expense.aggregate([
            {
                $match: matchCondition
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgExpense: { $avg: '$amount' }
                }
            },
            {
                $sort: { total: -1 }
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    total: { $round: ['$total', 2] },
                    count: 1,
                    avgExpense: { $round: ['$avgExpense', 2] }
                }
            }
        ]);

        return result;
    } catch (error) {
        console.error('Top categories aggregation error:', error);
        throw error;
    }
};
