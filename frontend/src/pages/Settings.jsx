import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reportService from '../services/reportService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import Footer from '../components/Common/Footer';

const Settings = () => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState({
        monthlyReport: true,
        budgetAlerts: true,
        aiInsights: true
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prefRes, histRes] = await Promise.all([
                reportService.getPreferences(),
                reportService.getHistory()
            ]);
            
            if (prefRes.success) {
                setPreferences(prefRes.data.preferences);
            }
            if (histRes.success) {
                setHistory(histRes.data.history);
            }
            setError('');
        } catch (err) {
            setError('Failed to load settings data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setPreferences(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleSavePreferences = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccessMessage('');
            
            const res = await reportService.updatePreferences(preferences);
            if (res.success) {
                setSuccessMessage('Preferences saved successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to save preferences');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleManualTrigger = async () => {
        if (!window.confirm("Trigger manual generation of this month's report? This is primarily for testing.")) return;
        
        try {
            const res = await reportService.triggerManualReport();
            if (res.success) {
                alert(res.message);
                // Refresh history after a short delay since generation is async
                setTimeout(fetchData, 3000);
            }
        } catch (err) {
            alert(err.message || "Failed to trigger report");
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-light">
                <LoadingSpinner size="large" message="Loading Settings..." />
            </div>
        );
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="min-vh-100 bg-gradient-light d-flex flex-column">
            {/* Header */}
            <header className="bg-white shadow-sm sticky-top z-10">
                <div className="container-fluid px-3 px-sm-5 px-lg-8 py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <Link to="/dashboard" className="btn btn-icon btn-light border-0 rounded-circle shadow-sm hover-lift" aria-label="Go back">
                                <i className="bi bi-arrow-left fs-5 text-gray-700"></i>
                            </Link>
                            <div>
                                <h1 className="fs-3 fw-bold text-gray-900 mb-0">Settings</h1>
                                <p className="small text-gray-500 mb-0">Manage preferences for {user?.email || 'your account'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 container-fluid px-3 px-sm-5 px-lg-8 py-4 py-lg-5 max-w-7xl mx-auto">
                <div className="row g-4">
                    {/* Left Column: Preferences */}
                    <div className="col-12 col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 hover-shadow transition-all overflow-hidden h-100">
                            <div className="card-header bg-white border-bottom-0 pt-4 pb-2 px-4">
                                <h5 className="mb-0 fw-bold text-gray-800 d-flex align-items-center gap-2">
                                    <i className="bi bi-envelope-paper text-primary fs-4"></i>
                                    Email Preferences
                                </h5>
                            </div>
                            <div className="card-body px-4 pb-4">
                                {error && <ErrorMessage message={error} />}
                                {successMessage && (
                                    <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        <div>{successMessage}</div>
                                    </div>
                                )}
                                
                                <div className="mb-4">
                                    <p className="text-gray-600 small mb-4">
                                        Choose what kind of automated emails you'd like to receive from ExpenseIQ.
                                    </p>

                                    <div className="form-check form-switch mb-3 p-3 bg-light rounded-3 d-flex align-items-center">
                                        <input 
                                            className="form-check-input fs-5 mt-0 me-3 ms-0 cursor-pointer" 
                                            type="checkbox" 
                                            role="switch" 
                                            id="monthlyReport"
                                            name="monthlyReport"
                                            checked={preferences.monthlyReport}
                                            onChange={handleCheckboxChange}
                                        />
                                        <label className="form-check-label cursor-pointer w-100" htmlFor="monthlyReport">
                                            <div className="fw-semibold text-gray-800">Receive Monthly PDF Reports</div>
                                            <div className="text-gray-500 small">Get a comprehensive financial statement at the end of every month.</div>
                                        </label>
                                    </div>

                                    <div className="form-check form-switch mb-3 p-3 bg-light rounded-3 d-flex align-items-center">
                                        <input 
                                            className="form-check-input fs-5 mt-0 me-3 ms-0 cursor-pointer" 
                                            type="checkbox" 
                                            role="switch" 
                                            id="budgetAlerts"
                                            name="budgetAlerts"
                                            checked={preferences.budgetAlerts}
                                            onChange={handleCheckboxChange}
                                        />
                                        <label className="form-check-label cursor-pointer w-100" htmlFor="budgetAlerts">
                                            <div className="fw-semibold text-gray-800">Receive Budget Alerts</div>
                                            <div className="text-gray-500 small">Get notified when you exceed your set budget limits.</div>
                                        </label>
                                    </div>

                                    <div className="form-check form-switch mb-4 p-3 bg-light rounded-3 d-flex align-items-center">
                                        <input 
                                            className="form-check-input fs-5 mt-0 me-3 ms-0 cursor-pointer" 
                                            type="checkbox" 
                                            role="switch" 
                                            id="aiInsights"
                                            name="aiInsights"
                                            checked={preferences.aiInsights}
                                            onChange={handleCheckboxChange}
                                        />
                                        <label className="form-check-label cursor-pointer w-100" htmlFor="aiInsights">
                                            <div className="fw-semibold text-gray-800">Receive AI Insights</div>
                                            <div className="text-gray-500 small">Get personalized tips and recommendations via email.</div>
                                        </label>
                                    </div>
                                </div>

                                <button 
                                    className="btn btn-primary w-100 py-2 fw-semibold" 
                                    onClick={handleSavePreferences}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
                                    ) : (
                                        <><i className="bi bi-save me-2"></i> Save Preferences</>
                                    )}
                                </button>
                                
                                <hr className="my-4 text-gray-300" />
                                
                                <button 
                                    className="btn btn-outline-secondary w-100 py-2 fw-semibold" 
                                    onClick={handleManualTrigger}
                                >
                                    <i className="bi bi-lightning-charge me-2"></i> Developer: Trigger Report Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Report History */}
                    <div className="col-12 col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 hover-shadow transition-all overflow-hidden h-100">
                            <div className="card-header bg-white border-bottom-0 pt-4 pb-2 px-4">
                                <h5 className="mb-0 fw-bold text-gray-800 d-flex align-items-center gap-2">
                                    <i className="bi bi-clock-history text-primary fs-4"></i>
                                    Automated Report History
                                </h5>
                            </div>
                            <div className="card-body px-4 pb-4">
                                <p className="text-gray-600 small mb-4">
                                    A log of all automated monthly financial statements sent to your email.
                                </p>
                                
                                {history.length === 0 ? (
                                    <div className="text-center py-5 bg-light rounded-4">
                                        <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm mb-3" style={{ width: '64px', height: '64px' }}>
                                            <i className="bi bi-inbox text-gray-400 fs-1"></i>
                                        </div>
                                        <h5 className="text-gray-800 fw-semibold mb-2">No Reports Yet</h5>
                                        <p className="text-gray-500 small mb-0 max-w-sm mx-auto">
                                            Your first monthly report will be generated and emailed on the last day of this month.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="table-responsive rounded-3 border border-gray-200">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="text-gray-600 fw-semibold py-3 px-4 border-0">Month</th>
                                                    <th className="text-gray-600 fw-semibold py-3 px-4 border-0">Status</th>
                                                    <th className="text-gray-600 fw-semibold py-3 px-4 border-0">Sent At</th>
                                                </tr>
                                            </thead>
                                            <tbody className="border-top-0">
                                                {history.map((record) => (
                                                    <tr key={record._id} className="transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="fw-medium text-gray-800">
                                                                {monthNames[record.month - 1]} {record.year}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {record.status === 'sent' && (
                                                                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                                                                    <i className="bi bi-check-circle me-1"></i> Sent
                                                                </span>
                                                            )}
                                                            {record.status === 'pending' && (
                                                                <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill">
                                                                    <i className="bi bi-hourglass-split me-1"></i> Pending
                                                                </span>
                                                            )}
                                                            {record.status === 'failed' && (
                                                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill">
                                                                    <i className="bi bi-exclamation-circle me-1"></i> Failed
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 small">
                                                            {record.emailedAt 
                                                                ? new Date(record.emailedAt).toLocaleString() 
                                                                : 'N/A'
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Settings;
