
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import expenseService from '../services/expenseService';
import Footer from '../components/Common/Footer';

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Education', 'Others'];

const AddExpense = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

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
            await expenseService.createExpense(formData);
            setSuccess('Expense added successfully!');
            setFormData({
                amount: '',
                category: 'Food',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add expense');
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
                            <h1 className="fs-2 fw-bold text-gray-900 mb-0">ExpenseIQ</h1>
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

            <main className="container px-3 px-sm-5 py-4 flex-grow-1" style={{ maxWidth: '48rem' }}>
                <div className="bg-white rounded-3 shadow p-4 p-md-5">
                    <h2 className="fs-3 fw-bold text-gray-900 mb-4">Add New Expense</h2>

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
                            <label htmlFor="amount" className="form-label small fw-medium text-gray-700">
                                Amount (₹) *
                            </label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0.00"
                            />
                        </div>

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
                            <label htmlFor="description" className="form-label small fw-medium text-gray-700">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                required
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="What was this expense for?"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="date" className="form-label small fw-medium text-gray-700">
                                Date *
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                                max={new Date().toISOString().split('T')[0]}
                                className="form-control"
                            />
                        </div>

                        <div className="d-flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary flex-fill py-3 fw-medium"
                            >
                                {loading ? 'Adding...' : 'Add Expense'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn btn-outline-secondary px-5 py-3 fw-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default AddExpense;
