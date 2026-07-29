import { useState } from 'react';
import exportService from '../services/exportService';

const CATEGORIES = ['All', 'Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Education', 'Others'];

const ReportDownloadModal = ({ isOpen, onClose }) => {
    const [format, setFormat] = useState('pdf');
    const [category, setCategory] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDownload = async () => {
        setLoading(true);
        setError('');

        const params = {};
        if (category !== 'All') params.category = category;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        try {
            if (format === 'pdf') {
                await exportService.exportPDF(params);
            } else if (format === 'excel') {
                await exportService.exportExcel(params);
            } else {
                await exportService.exportCSV(params);
            }
            onClose();
        } catch (err) {
            setError(err.message || err.response?.data?.message || `Failed to export ${format.toUpperCase()} report`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-3">
                    <div className="modal-header bg-dark text-white py-3 px-4 rounded-top-3">
                        <div className="d-flex align-items-center gap-2">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h5 className="modal-title fw-bold mb-0">Download Financial Report</h5>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4">
                        {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

                        {/* Format Selection */}
                        <div className="mb-4">
                            <label className="form-label small fw-semibold text-gray-700">Report Format *</label>
                            <div className="row g-2">
                                <div className="col-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormat('pdf')}
                                        className={`btn w-100 py-3 fw-medium ${format === 'pdf' ? 'btn-danger' : 'btn-outline-danger'}`}
                                    >
                                        📄 PDF
                                    </button>
                                </div>
                                <div className="col-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormat('excel')}
                                        className={`btn w-100 py-3 fw-medium ${format === 'excel' ? 'btn-success' : 'btn-outline-success'}`}
                                    >
                                        📊 Excel
                                    </button>
                                </div>
                                <div className="col-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormat('csv')}
                                        className={`btn w-100 py-3 fw-medium ${format === 'csv' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    >
                                        📑 CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-gray-700">Category</label>
                            <select
                                className="form-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="row g-3">
                            <div className="col-6">
                                <label className="form-label small fw-semibold text-gray-700">Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-semibold text-gray-700">End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer p-3 bg-white rounded-bottom-3">
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-dark px-4 fw-medium"
                            onClick={handleDownload}
                            disabled={loading}
                        >
                            {loading ? 'Generating Report...' : `Download ${format.toUpperCase()}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDownloadModal;
