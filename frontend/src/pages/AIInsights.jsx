import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import aiService from '../services/aiService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Footer from '../components/Common/Footer';

const AIInsights = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState(null);
    const [savingTips, setSavingTips] = useState(null);
    const [riskPrediction, setRiskPrediction] = useState(null);
    const [error, setError] = useState('');

    const generateInsights = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await aiService.generateInsights();
            setInsights(response.data);
        } catch (err) {
            setError('Failed to generate insights. ' + (err.response?.data?.message || 'Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const getSavingTips = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await aiService.getSavingTips();
            setSavingTips(response.data);
        } catch (err) {
            setError('Failed to get saving tips. ' + (err.response?.data?.message || 'Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const predictRisk = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await aiService.predictRisk();
            setRiskPrediction(response.data);
        } catch (err) {
            setError('Failed to predict risks. ' + (err.response?.data?.message || 'Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-vh-100 bg-gradient-light d-flex flex-column">
        
            <header className="bg-white shadow-sm">
                <div className="container-fluid px-3 px-sm-5 px-lg-8 py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h1 className="fs-2 fw-bold text-gray-900 mb-0">Expense Tracker</h1>
                            <p className="small text-gray-600 mb-0">Welcome, {user?.name}!</p>
                        </div>
                        <div className="d-flex gap-3">
                            <Link
                                to="/dashboard"
                                className="btn btn-outline-secondary px-4 py-2"
                            >
                                ← Back to Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="btn btn-outline-secondary px-4 py-2"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="container-fluid px-3 px-sm-5 px-lg-8 py-4 flex-grow-1">
                <div className="mb-4">
                    <h2 className="display-6 fw-bold text-gray-900 mb-2">AI Insights</h2>
                    <p className="text-gray-600">Get personalized financial insights powered by AI</p>
                </div>

                {error && (
                    <div className="alert alert-danger border border-danger mb-4" role="alert">
                        {error}
                    </div>
                )}

                <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                        <button
                            onClick={generateInsights}
                            disabled={loading}
                            className="btn btn-primary w-100 py-4 fw-medium"
                        >
                            💡 Generate Spending Insights
                        </button>
                    </div>
                    <div className="col-12 col-md-4">
                        <button
                            onClick={getSavingTips}
                            disabled={loading}
                            className="btn btn-success w-100 py-4 fw-medium"
                        >
                            💰 Get Saving Tips
                        </button>
                    </div>
                    <div className="col-12 col-md-4">
                        <button
                            onClick={predictRisk}
                            disabled={loading}
                            className="btn btn-warning w-100 py-4 fw-medium text-white"
                        >
                            ⚠️ Predict Overspending Risk
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="bg-white rounded-3 shadow p-5">
                        <LoadingSpinner size="large" message="AI is analyzing your spending data..." />
                    </div>
                )}

                {/* Insights Display */}
                {!loading && (insights || savingTips || riskPrediction) && (
                    <div className="d-flex flex-column gap-4">
                        {insights && (
                            <div className="bg-white rounded-3 shadow p-4 p-md-5">
                                <h3 className="fs-3 fw-bold text-gray-900 mb-4">💡 Spending Insights</h3>
                                <div>
                                    <p className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{insights.insight}</p>
                                    {insights.cachedAt && (
                                        <p className="small text-muted mt-3 mb-0">
                                            Generated: {new Date(insights.cachedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {savingTips && (
                            <div className="bg-white rounded-3 shadow p-4 p-md-5">
                                <h3 className="fs-3 fw-bold text-gray-900 mb-4">💰 Saving Tips</h3>
                                <div>
                                    <p className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{savingTips.tips}</p>
                                    {savingTips.cachedAt && (
                                        <p className="small text-muted mt-3 mb-0">
                                            Generated: {new Date(savingTips.cachedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {riskPrediction && (
                            <div className="bg-white rounded-3 shadow p-4 p-md-5">
                                <h3 className="fs-3 fw-bold text-gray-900 mb-4">⚠️ Overspending Risk Prediction</h3>
                                <div>
                                    <p className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{riskPrediction.prediction}</p>
                                    {riskPrediction.cachedAt && (
                                        <p className="small text-muted mt-3 mb-0">
                                            Generated: {new Date(riskPrediction.cachedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {!loading && !insights && !savingTips && !riskPrediction && (
                    <div className="bg-white rounded-3 shadow p-5 text-center">
                        <svg className="mx-auto mb-3 text-secondary" width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="fs-5 fw-semibold text-gray-900 mb-2">No Insights Generated Yet</h3>
                        <p className="text-gray-600 mb-4">Click one of the buttons above to get personalized AI insights about your spending</p>
                        <p className="small text-muted mb-0">
                            Note: AI responses are cached for 24 hours to optimize performance
                        </p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default AIInsights;
