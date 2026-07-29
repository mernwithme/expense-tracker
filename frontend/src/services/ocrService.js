import api from './api';

export const ocrService = {
    async scanReceipt(file) {
        const formData = new FormData();
        formData.append('receipt', file);

        const response = await api.post('/expenses/ocr/scan', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default ocrService;
