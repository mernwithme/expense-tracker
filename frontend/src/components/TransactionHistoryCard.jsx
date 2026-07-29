import { useState, useEffect, useCallback } from 'react';
import expenseService from '../services/expenseService';

const CATEGORIES = ['All', 'Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Education', 'Others'];

const TransactionHistoryCard = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [deletingId, setDeletingId] = useState(null);

    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedCategory !== 'All') params.category = selectedCategory;
            const res = await expenseService.getExpenses(params);
            setExpenses(res.data?.expenses || []);
        } catch (err) {
            console.error('Failed to fetch transaction history:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense record?')) return;
        try {
            setDeletingId(id);
            await expenseService.deleteExpense(id);
            setExpenses(expenses.filter(e => e._id !== id));
        } catch (err) {
            console.error('Failed to delete expense record:', err);
            alert('Failed to delete expense record.');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredExpenses = expenses.filter(exp => {
        const query = searchQuery.toLowerCase();
        const desc = (exp.description || '').toLowerCase();
        const cat = (exp.category || '').toLowerCase();
        const merchant = (exp.merchant || '').toLowerCase();
        const amount = String(exp.amount || '');
        return desc.includes(query) || cat.includes(query) || merchant.includes(query) || amount.includes(query);
    });

    const getCategoryBadgeClass = (category) => {
        switch (category) {
            case 'Food': return 'bg-success text-white';
            case 'Travel': return 'bg-info text-dark';
            case 'Rent': return 'bg-primary text-white';
            case 'Shopping': return 'bg-purple-600 text-white';
            case 'Entertainment': return 'bg-pink-500 text-white';
            case 'Healthcare': return 'bg-danger text-white';
            case 'Bills': return 'bg-warning text-dark';
            case 'Education': return 'bg-dark text-white';
            default: return 'bg-secondary text-white';
        }
    };

    return (
        <div className="bg-white rounded-3 shadow-lg p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <div>
                    <h2 className="fs-5 fw-bold text-gray-900 mb-1">📜 Transaction & Expense History</h2>
                    <p className="small text-gray-600 mb-0">Detailed history showing where your money was spent</p>
                </div>

                <div className="d-flex flex-wrap gap-2">
                    {/* Search Input */}
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search transactions..."
                        style={{ maxWidth: '200px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {/* Category Filter */}
                    <select
                        className="form-select form-select-sm"
                        style={{ maxWidth: '160px' }}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="py-5 text-center">
                    <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                    <p className="small text-muted mb-0">Loading transaction history...</p>
                </div>
            ) : filteredExpenses.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                        <thead className="table-light">
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Category</th>
                                <th scope="col">Description / Details</th>
                                <th scope="col">Type</th>
                                <th scope="col" className="text-end">Amount (₹)</th>
                                <th scope="col" className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((exp) => {
                                const expDate = new Date(exp.date).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                });
                                const isIncome = exp.type === 'Income';

                                return (
                                    <tr key={exp._id}>
                                        <td className="fw-medium text-gray-700">{expDate}</td>
                                        <td>
                                            <span className={`badge ${getCategoryBadgeClass(exp.category)} fw-medium`}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="fw-semibold text-gray-900">{exp.description}</div>
                                            {exp.merchant && (
                                                <span className="small text-muted">Merchant: {exp.merchant}</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge rounded-pill ${isIncome ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'}`}>
                                                {isIncome ? 'Income' : 'Expense'}
                                            </span>
                                        </td>
                                        <td className={`text-end fw-bold fs-6 ${isIncome ? 'text-success' : 'text-gray-900'}`}>
                                            {isIncome ? '+' : '-'}₹{exp.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                onClick={() => handleDelete(exp._id)}
                                                disabled={deletingId === exp._id}
                                                className="btn btn-outline-danger btn-sm py-1 px-2"
                                                title="Delete expense"
                                            >
                                                {deletingId === exp._id ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-5">
                    <svg className="text-muted mb-3" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 mb-1">No transaction records found.</p>
                    <p className="small text-muted mb-0">Try clearing filters or add a new expense!</p>
                </div>
            )}
        </div>
    );
};

export default TransactionHistoryCard;
