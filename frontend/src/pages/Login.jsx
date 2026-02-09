import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Common/Footer';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex flex-column bg-gradient-light">
            <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5 px-3">
                <div className="w-100" style={{ maxWidth: '28rem' }}>
                    <div className="bg-white p-4 p-md-5 rounded-3 shadow-lg">
                        <div>
                            <h2 className="mt-3 text-center fw-bold display-6 text-gray-900">
                                Welcome Back
                            </h2>
                            <p className="mt-2 text-center small text-gray-600">
                                Sign in to your Expense Tracker account
                            </p>
                        </div>

                        <form className="mt-4" onSubmit={handleSubmit}>
                            {error && (
                                <div className="alert alert-danger border border-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="mb-3">
                                <label htmlFor="email" className="form-label small fw-medium text-gray-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="form-control"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label small fw-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-100 py-2 fw-medium"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>

                            <div className="text-center mt-3">
                                <p className="small text-gray-600 mb-0">
                                    Don't have an account?{' '}
                                    <Link to="/register" className="text-primary text-decoration-none fw-medium">
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Login;
