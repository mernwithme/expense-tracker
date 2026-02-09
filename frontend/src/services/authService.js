import api from './api';

export const authService = {
    
    async register(userData) {
        const response = await api.post('/auth/register', userData);
        if (response.data.success) {
            const { accessToken, refreshToken, user } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
        }
        return response.data;
    },

    
    async login(credentials) {
        const response = await api.post('/auth/login', credentials);
        if (response.data.success) {
            const { accessToken, refreshToken, user } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
        }
        return response.data;
    },
    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    },

    async getProfile() {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
};

export default authService;
