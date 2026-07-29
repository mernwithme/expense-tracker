import api from './api';

export const reportService = {
    getPreferences: async () => {
        try {
            const response = await api.get('/reports/preferences');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updatePreferences: async (preferences) => {
        try {
            const response = await api.put('/reports/preferences', preferences);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getHistory: async () => {
        try {
            const response = await api.get('/reports/history');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    triggerManualReport: async () => {
        try {
            const response = await api.post('/reports/trigger');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default reportService;
