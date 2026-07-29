import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Common/Footer';
import TransactionHistoryCard from '../components/TransactionHistoryCard';

const ExpenseHistory = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                            <Link to="/expenses/new" className="btn btn-primary px-4 py-2">
                                + Add New Expense
                            </Link>
                            <Link to="/dashboard" className="btn btn-outline-secondary px-4 py-2">
                                ← Back to Dashboard
                            </Link>
                            <button onClick={handleLogout} className="btn btn-outline-secondary px-4 py-2">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container-fluid px-3 px-sm-5 px-lg-8 py-4 flex-grow-1">
                <TransactionHistoryCard />
            </main>

            <Footer />
        </div>
    );
};

export default ExpenseHistory;
