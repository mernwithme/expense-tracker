import api from './api';

export const analyticsService = {
    async getDashboardAnalytics() {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    },

    async getCategoryTotals(params = {}) {
        const response = await api.get('/analytics/category-totals', { params });
        return response.data;
    },

    async getMonthlyTrend(params = {}) {
        const response = await api.get('/analytics/monthly-trend', { params });
        return response.data;
    },

    async getCategoryTrend(params = {}) {
        const response = await api.get('/analytics/category-trend', { params });
        return response.data;
    },

    async getYearlySummary(params = {}) {
        const response = await api.get('/analytics/yearly-summary', { params });
        return response.data;
    },

    async getOverspendingCategories() {
        const response = await api.get('/analytics/overspending');
        return response.data;
    },

    async getTopCategories(params = {}) {
        const response = await api.get('/analytics/top-categories', { params });
        return response.data;
    },
};

export default analyticsService;
