import { Link } from 'react-router-dom';

const BudgetProgressCard = ({ budgets = [] }) => {
    const budgetList = Array.isArray(budgets) ? budgets : (budgets?.budgets || []);
    const warningBudgets = budgetList.filter(b => (b.percentageUsed || 0) >= 90);

    const getProgressColorClass = (percentageUsed) => {
        if (percentageUsed > 100) return 'bg-danger';
        if (percentageUsed >= 90) return 'bg-warning text-dark';
        if (percentageUsed >= 60) return 'bg-info';
        return 'bg-success';
    };

    const getStatusBadge = (percentageUsed) => {
        if (percentageUsed > 100) return { label: 'Exceeded', bg: 'bg-danger text-white' };
        if (percentageUsed >= 90) return { label: 'High Risk (>90%)', bg: 'bg-warning text-dark' };
        if (percentageUsed >= 60) return { label: 'Caution (60-90%)', bg: 'bg-info text-dark' };
        return { label: 'Safe (0-60%)', bg: 'bg-success text-white' };
    };

    return (
        <div className="bg-white rounded-3 shadow-lg p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                    <svg className="text-purple-600" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="fs-5 fw-semibold text-gray-900 mb-0">Monthly Budget Progress</h2>
                </div>
                <Link to="/budgets" className="small text-purple-600 fw-semibold text-decoration-none">
                    Manage Budgets →
                </Link>
            </div>

            {/* Warning Alert Banner */}
            {warningBudgets.length > 0 && (
                <div className="alert alert-warning border border-warning d-flex align-items-center gap-2 mb-3" role="alert">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="small fw-semibold">
                        ⚠️ Warning: {warningBudgets.length} category budget(s) exceeded or approaching limit (&ge;90%)!
                    </span>
                </div>
            )}

            {budgetList.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                    {budgetList.map((b) => {
                        const pct = b.percentageUsed || 0;
                        const badge = getStatusBadge(pct);
                        const progressBarClass = getProgressColorClass(pct);
                        const spent = b.actualSpending !== undefined ? b.actualSpending : b.actual || 0;

                        return (
                            <div key={b._id || b.category} className="p-3 border rounded-3 bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="fw-semibold text-gray-800">{b.category}</span>
                                    <span className={`badge ${badge.bg} fw-medium`}>{badge.label}</span>
                                </div>
                                <div className="d-flex justify-content-between small text-gray-600 mb-2">
                                    <span>Spent: ₹{spent} / ₹{b.monthlyLimit}</span>
                                    <span className="fw-bold">{pct}%</span>
                                </div>
                                <div className="bg-secondary bg-opacity-25 rounded-pill" style={{ height: '0.6rem' }}>
                                    <div
                                        className={`rounded-pill ${progressBarClass}`}
                                        style={{ width: `${Math.min(pct, 100)}%`, height: '100%' }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4 mb-0">No budgets set for the current month.</p>
            )}
        </div>
    );
};

export default BudgetProgressCard;
