import { useState } from 'react';
import ocrService from '../services/ocrService';

const ReceiptScanModal = ({ isOpen, onClose, onApplyData }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [scannedData, setScannedData] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
            setScannedData(null);
            setError('');
        }
    };

    const handleScan = async () => {
        if (!file) {
            setError('Please select a receipt image first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await ocrService.scanReceipt(file);
            if (res.success) {
                setScannedData(res.data);
            } else {
                setError(res.message || 'Failed to scan receipt');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error processing receipt scan');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (scannedData && onApplyData) {
            onApplyData(scannedData);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg rounded-3">
                    <div className="modal-header bg-purple-600 text-white py-3 px-4 rounded-top-3" style={{ backgroundColor: '#7c3aed' }}>
                        <div className="d-flex align-items-center gap-2">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <h5 className="modal-title fw-bold mb-0">OCR Receipt Scanner (Tesseract)</h5>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4">
                        {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

                        <div className="row g-4">
                            {/* Upload Area */}
                            <div className="col-12 col-md-6">
                                <div className="border border-2 border-dashed border-secondary border-opacity-50 rounded-3 p-4 text-center h-100 d-flex flex-column justify-content-center align-items-center bg-light">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Receipt Preview"
                                            className="img-fluid rounded shadow-sm mb-3"
                                            style={{ maxHeight: '240px', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div className="py-4">
                                            <svg className="text-secondary mb-3" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-600 mb-2">Upload receipt image</p>
                                            <p className="small text-muted mb-0">Restaurant, Grocery, Fuel, Shopping, Online orders</p>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="receiptInput"
                                        className="d-none"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="receiptInput" className="btn btn-outline-primary mt-2">
                                        {file ? 'Change Image' : 'Select Receipt'}
                                    </label>
                                </div>
                            </div>

                            {/* Extraction Results */}
                            <div className="col-12 col-md-6 d-flex flex-column justify-content-between">
                                <div className="bg-light p-3 rounded-3 border h-100">
                                    <h6 className="fw-bold text-gray-800 mb-3">Extracted Receipt Data</h6>

                                    {loading ? (
                                        <div className="py-5 text-center">
                                            <div className="spinner-border text-primary mb-3" role="status"></div>
                                            <p className="text-gray-700 fw-medium mb-0">Running Tesseract OCR...</p>
                                            <p className="small text-muted">Extracting Merchant, Date, GST & Amount</p>
                                        </div>
                                    ) : scannedData ? (
                                        <div className="d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
                                            <div className="d-flex justify-content-between border-bottom pb-2">
                                                <span className="text-muted">Merchant:</span>
                                                <span className="fw-bold text-gray-900">{scannedData.merchantName}</span>
                                            </div>
                                            <div className="d-flex justify-content-between border-bottom pb-2">
                                                <span className="text-muted">Amount:</span>
                                                <span className="fw-bold text-success fs-5">₹{scannedData.amount}</span>
                                            </div>
                                            <div className="d-flex justify-content-between border-bottom pb-2">
                                                <span className="text-muted">Category:</span>
                                                <span className="badge bg-purple-100 text-purple-700 fw-semibold">{scannedData.category}</span>
                                            </div>
                                            <div className="d-flex justify-content-between border-bottom pb-2">
                                                <span className="text-muted">Date:</span>
                                                <span className="fw-medium">{scannedData.date}</span>
                                            </div>
                                            {scannedData.gst && (
                                                <div className="d-flex justify-content-between border-bottom pb-2">
                                                    <span className="text-muted">GST:</span>
                                                    <span className="fw-medium">{scannedData.gst}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-muted text-center py-5 mb-0">
                                            Select an image and click <strong>Scan Receipt</strong> to extract transaction details.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer p-3 bg-white rounded-bottom-3">
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>
                            Cancel
                        </button>

                        {!scannedData ? (
                            <button
                                type="button"
                                className="btn btn-primary px-4 fw-medium"
                                onClick={handleScan}
                                disabled={!file || loading}
                            >
                                {loading ? 'Scanning...' : 'Scan Receipt'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-success px-4 fw-medium"
                                onClick={handleApply}
                            >
                                Auto-Fill Expense Form
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptScanModal;
