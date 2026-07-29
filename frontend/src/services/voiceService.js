import api from './api';

export const voiceService = {
    async parseVoiceExpense(text) {
        const response = await api.post('/expenses/voice/parse', { text });
        return response.data;
    }
};

export default voiceService;
