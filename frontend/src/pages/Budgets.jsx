import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import budgetService from '../services/budgetService';
import Footer from '../components/Common/Footer';

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Education', 'Others'];

const Budgets = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [budgets, setBudgets] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        category: 'Food',
        monthlyLimit: '',
        month: new Date().toISOString().slice(0, 7) 
    });

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const response = await budgetService.getCurrentMonthBudgets();
            setBudgets(response.data || []);
        } catch (err) {
            console.error('Failed to fetch budgets:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await budgetService.setBudget(formData);
            setSuccess('Budget set successfully!');
            setFormData({
                ...formData,
                category: 'Food',
                monthlyLimit: ''
            });
            fetchBudgets();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to set budget');
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

            <main className="container-fluid px-3 px-sm-5 px-lg-8 py-4 flex-grow-1" style={{ maxWidth: '72rem' }}>
                <div className="row g-4">
                
                    <div className="col-12 col-lg-6">
                        <div className="bg-white rounded-3 shadow p-4 p-md-5">
                            <h2 className="fs-3 fw-bold text-gray-900 mb-4">Set Monthly Budget</h2>

                            {error && (
                                <div className="alert alert-danger border border-danger mb-4" role="alert">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="alert alert-success border border-success mb-4" role="alert">
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="category" className="form-label small fw-medium text-gray-700">
                                        Category *
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        required
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="monthlyLimit" className="form-label small fw-medium text-gray-700">
                                        Monthly Limit (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        id="monthlyLimit"
                                        name="monthlyLimit"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.monthlyLimit}
                                        onChange={handleChange}
                                        className="form-control"
                                        placeholder="5000.00"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="month" className="form-label small fw-medium text-gray-700">
                                        Month *
                                    </label>
                                    <input
                                        type="month"
                                        id="month"
                                        name="month"
                                        required
                                        value={formData.month}
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-100 py-3 fw-medium"
                                >
                                    {loading ? 'Setting...' : 'Set Budget'}
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="col-12 col-lg-6">
                        <div className="bg-white rounded-3 shadow p-4 p-md-5">
                            <h2 className="fs-3 fw-bold text-gray-900 mb-4">Current Month Budgets</h2>

                            {budgets.length > 0 ? (
                                <div className="d-flex flex-column gap-3">
                                    {budgets.map((budget) => (
                                        <div key={budget._id} className="border border-gray-200 rounded-3 p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h3 className="fs-5 fw-semibold text-gray-900 mb-0">{budget.category}</h3>
                                                <span className={`badge ${budget.percentageUsed > 100 ? 'bg-danger' :
                                                    budget.percentageUsed > 80 ? 'bg-warning' :
                                                        'bg-success'
                                                    }`}>
                                                    {budget.percentageUsed}% used
                                                </span>
                                            </div>
                                            <div className="mb-2">
                                                <div className="d-flex justify-content-between small text-gray-600 mb-1">
                                                    <span>₹{budget.actualSpending} / ₹{budget.monthlyLimit}</span>
                                                    <span>₹{budget.remaining} remaining</span>
                                                </div>
                                                <div className="bg-secondary bg-opacity-25 rounded-pill" style={{ height: '0.5rem' }}>
                                                    <div
                                                        className={`rounded-pill ${budget.percentageUsed > 100 ? 'bg-danger' :
                                                            budget.percentageUsed > 80 ? 'bg-warning' :
                                                                'bg-primary'
                                                            }`}
                                                        style={{ width: `${Math.min(budget.percentageUsed, 100)}%`, height: '100%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                            {budget.isOverBudget && (
                                                <p className="small text-danger mb-0 mt-2">
                                                    ⚠️ Over budget by ₹{Math.abs(budget.remaining)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <svg className="mx-auto mb-3 text-secondary" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-600 mb-2">No budgets set for this month</p>
                                    <p className="small text-muted">Set your first budget using the form</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Budgets;
