import api from './api';

export const aiService = {
    async generateInsights(forceRefresh = false) {
        const response = await api.post(`/ai/generate-insights?forceRefresh=${forceRefresh}`);
        return response.data;
    },

    async getSavingTips() {
        const response = await api.get('/ai/saving-tips');
        return response.data;
    },

    async predictRisk() {
        const response = await api.get('/ai/predict-risk');
        return response.data;
    },

    async getCachedInsights() {
        const response = await api.get('/ai/cached');
        return response.data;
    },
};

export default aiService;
