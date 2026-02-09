import api from './api';

export const expenseService = {

    async getExpenses(params = {}) {
        const response = await api.get('/expenses', { params });
        return response.data;
    },

    async getExpenseById(id) {
        const response = await api.get(`/expenses/${id}`);
        return response.data;
    },

    async createExpense(expenseData) {
        const response = await api.post('/expenses', expenseData);
        return response.data;
    },

    async updateExpense(id, expenseData) {
        const response = await api.put(`/expenses/${id}`, expenseData);
        return response.data;
    },

    async deleteExpense(id) {
        const response = await api.delete(`/expenses/${id}`);
        return response.data;
    },

    async getExpenseSummary(params = {}) {
        const response = await api.get('/expenses/summary', { params });
        return response.data;
    },
};

export default expenseService;
