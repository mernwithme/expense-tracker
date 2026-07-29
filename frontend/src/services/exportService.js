import api from './api';

const parseBlobError = async (err) => {
    if (err.response?.data instanceof Blob) {
        try {
            const text = await err.response.data.text();
            const parsed = JSON.parse(text);
            if (parsed && parsed.message) {
                const newErr = new Error(parsed.message);
                newErr.response = err.response;
                newErr.response.data = parsed;
                throw newErr;
            }
        } catch (e) {
            if (e.message && e.message !== err.message && e.name === 'Error') {
                throw e;
            }
        }
    }
    throw err;
};

export const exportService = {
    async exportCSV(params = {}) {
        try {
            const response = await api.get('/export/csv', {
                params,
                responseType: 'blob', 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true, message: 'CSV downloaded successfully' };
        } catch (err) {
            await parseBlobError(err);
        }
    },

    async exportExcel(params = {}) {
        try {
            const response = await api.get('/export/excel', {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true, message: 'Excel downloaded successfully' };
        } catch (err) {
            await parseBlobError(err);
        }
    },

    async exportPDF(params = {}) {
        try {
            const response = await api.get('/export/pdf', {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expense_report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true, message: 'PDF downloaded successfully' };
        } catch (err) {
            await parseBlobError(err);
        }
    },
};

export default exportService;
