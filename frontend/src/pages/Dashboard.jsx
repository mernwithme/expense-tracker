import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import analyticsService from '../services/analyticsService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import Footer from '../components/Common/Footer';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await analyticsService.getDashboardAnalytics();
            setAnalytics(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    const getBudgetStatus = (percentageUsed) => {
        if (percentageUsed <= 60) return 'safe';
        if (percentageUsed <= 80) return 'caution';
        return 'danger';
    };

    const getStatusColors = (status) => {
        const colors = {
            safe: {
                bg: 'bg-emerald-100',
                text: 'text-emerald-700',
                icon: 'text-emerald-600',
                progress: 'bg-emerald-500',
                border: 'border-emerald-200'
            },
            caution: {
                bg: 'bg-amber-100',
                text: 'text-amber-700',
                icon: 'text-amber-600',
                progress: 'bg-amber-500',
                border: 'border-amber-200'
            },
            danger: {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: 'text-red-600',
                progress: 'bg-red-500',
                border: 'border-red-200'
            }
        };
        return colors[status];
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-light">
                <LoadingSpinner size="large" message="Loading dashboard..." />
            </div>
        );
    }

    const currentMonth = analytics?.currentMonth || {};
    const categoryTotals = analytics?.categoryTotals || [];
    const monthlyTrend = analytics?.monthlyTrend || [];
    const topCategories = analytics?.topCategories || [];

    const budgetPercentage = currentMonth.budgetPercentageUsed || 0;
    const budgetStatus = getBudgetStatus(budgetPercentage);
    const statusColors = getStatusColors(budgetStatus);

    return (
        <div className="min-vh-100 bg-gradient-light d-flex flex-column">
        
            <header className="bg-white shadow-sm">
                <div className="container-fluid px-3 px-sm-5 px-lg-8 py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h1 className="fs-2 fw-bold text-gray-900 mb-0">ExpenseIQ</h1>
                            <p className="small text-gray-600 mb-0">Welcome, {user?.name}!</p>
                        </div>
                        <div className="d-flex gap-3">
                            <Link
                                to="/expenses"
                                className="btn btn-primary px-4 py-2"
                            >
                                Manage Expenses
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
                {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

                <div className="row g-4 mb-4">
        
                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="bg-white rounded-3 shadow-lg p-4 card-hover">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="small fw-medium text-gray-600 mb-1">Total Spent</p>
                                    <p className="fs-3 fw-bold text-gray-900 mb-1">₹{currentMonth.total || 0}</p>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{currentMonth.expenseCount || 0} transactions</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-3">
                                    <svg className="text-purple-600" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="bg-white rounded-3 shadow-lg p-4 card-hover">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="small fw-medium text-gray-600 mb-1">Budget</p>
                                    <p className="fs-3 fw-bold text-gray-900 mb-1">₹{currentMonth.totalBudget || 0}</p>
                                    <p className={`mb-0 fw-semibold ${statusColors.text}`} style={{ fontSize: '0.75rem' }}>
                                        {budgetPercentage.toFixed(1)}% used
                                    </p>
                                </div>
                                <div className={`${statusColors.bg} p-3 rounded-3`}>
                                    <svg className={`${statusColors.icon}`} width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Budget Progress Bar */}
                            <div className="mt-3">
                                <div className="bg-secondary bg-opacity-25 rounded-pill" style={{ height: '0.5rem' }}>
                                    <div
                                        className={`rounded-pill progress-bar ${statusColors.progress}`}
                                        style={{ width: `${Math.min(budgetPercentage, 100)}%`, height: '100%' }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="bg-white rounded-3 shadow-lg p-4 card-hover">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="small fw-medium text-gray-600 mb-1">Remaining</p>
                                    <p className={`fs-3 fw-bold mb-1 ${statusColors.text}`}>
                                        ₹{currentMonth.budgetRemaining || 0}
                                    </p>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>This month</p>
                                </div>
                                <div className={`${statusColors.bg} p-3 rounded-3`}>
                                    <svg className={`${statusColors.icon}`} width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="bg-white rounded-3 shadow-lg p-4 card-hover border border-2 border-purple-200">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <p className="small fw-medium text-gray-600 mb-0">Top Category</p>
                                        <span className="badge bg-purple-100 text-purple-700 fw-semibold">
                                            #1
                                        </span>
                                    </div>
                                    <p className="fs-3 fw-bold text-purple-700 mb-1">
                                        {topCategories[0]?.category || 'N/A'}
                                    </p>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>₹{topCategories[0]?.total || 0}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-3">
                                    <svg className="text-purple-600" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3 shadow-lg p-4 mb-4">
                    <h2 className="fs-5 fw-semibold text-gray-900 mb-3">Quick Actions</h2>
                    <div className="row g-3">
                        <div className="col-12 col-md-4">
                            <Link
                                to="/expenses/new"
                                className="d-flex align-items-center p-3 border border-2 border-secondary border-opacity-25 border-dashed rounded-3 text-decoration-none"
                                style={{ transition: 'all 0.2s' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--bs-primary)';
                                    e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(108, 117, 125, 0.25)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <svg className="text-secondary me-3" width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-gray-700 fw-medium">Add New Expense</span>
                            </Link>
                        </div>

                        <div className="col-12 col-md-4">
                            <Link
                                to="/budgets"
                                className="d-flex align-items-center p-3 border border-2 border-secondary border-opacity-25 border-dashed rounded-3 text-decoration-none"
                                style={{ transition: 'all 0.2s' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--bs-primary)';
                                    e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(108, 117, 125, 0.25)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <svg className="text-secondary me-3" width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-700 fw-medium">Set Budgets</span>
                            </Link>
                        </div>

                        <div className="col-12 col-md-4">
                            <Link
                                to="/insights"
                                className="d-flex align-items-center p-3 border border-2 border-secondary border-opacity-25 border-dashed rounded-3 text-decoration-none"
                                style={{ transition: 'all 0.2s' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--bs-primary)';
                                    e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(108, 117, 125, 0.25)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <svg className="text-secondary me-3" width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span className="text-gray-700 fw-medium">AI Insights</span>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3 shadow-lg p-4 mb-4">
                    <h2 className="fs-5 fw-semibold text-gray-900 mb-3">Category Breakdown</h2>

                    {categoryTotals.length > 0 ? (
                        <div className="d-flex flex-column gap-3">
                            {categoryTotals.map((category, index) => {
                                const isTopCategory = index === 0;
                                const percentage = (category.total / currentMonth.total) * 100 || 0;

                                return (
                                    <div
                                        key={category.category}
                                        className={`p-3 rounded-3 ${isTopCategory
                                            ? 'category-highlight'
                                            : 'bg-gray-50 border border-gray-200'
                                            }`}
                                    >
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={`small fw-semibold ${isTopCategory ? 'text-purple-700' : 'text-gray-700'
                                                    }`}>
                                                    {category.category}
                                                </span>
                                                {isTopCategory && (
                                                    <span className="badge bg-purple-600 text-white fw-bold">
                                                        TOP
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`small fw-bold ${isTopCategory ? 'text-purple-700' : 'text-gray-900'
                                                }`}>
                                                ₹{category.total}
                                            </span>
                                        </div>
                                        <div className="bg-secondary bg-opacity-25 rounded-pill" style={{ height: '0.75rem' }}>
                                            <div
                                                className={`rounded-pill progress-bar ${isTopCategory ? 'bg-purple-600' : 'bg-secondary'
                                                    }`}
                                                style={{ width: `${percentage}%`, height: '100%' }}
                                            ></div>
                                        </div>
                                        <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.75rem' }}>
                                            {percentage.toFixed(1)}% of total spending
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-5 mb-0">No expenses recorded yet</p>
                    )}
                </div>

                {monthlyTrend.length > 0 && (
                    <div className="bg-white rounded-3 shadow-lg p-4">
                        <h2 className="fs-5 fw-semibold text-gray-900 mb-3">Monthly Trend</h2>
                        <div className="d-flex align-items-end justify-content-between gap-2" style={{ height: '200px' }}>
                            {monthlyTrend.map((month, index) => {
                                const maxTotal = Math.max(...monthlyTrend.map(m => m.total));
                                const heightPercent = (month.total / maxTotal) * 100;

                                return (
                                    <div key={index} className="flex-fill d-flex flex-column align-items-center">
                                        <div className="w-100 d-flex flex-column align-items-center justify-content-end flex-fill">
                                            <span className="small fw-medium text-gray-700 mb-1">₹{month.total}</span>
                                            <div
                                                className="w-100 rounded-top"
                                                style={{
                                                    background: 'linear-gradient(to top, #7c3aed, #a78bfa)',
                                                    height: `${heightPercent}%`,
                                                    minHeight: '20px',
                                                    transition: 'all 0.3s'
                                                }}
                                                title={`${month.monthName}: ₹${month.total}`}
                                            ></div>
                                        </div>
                                        <span className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>{month.monthName}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Dashboard;
