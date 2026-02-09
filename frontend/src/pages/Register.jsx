import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Common/Footer';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
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

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...userData } = formData;
            console.log('Attempting registration with:', { name: userData.name, email: userData.email });
            const response = await register(userData);
            console.log('Registration successful:', response);
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration error:', err);
            console.error('Error response:', err.response?.data);
            const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed. Please try again.';
            setError(errorMessage);
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
                                Create Account
                            </h2>
                            <p className="mt-2 text-center small text-gray-600">
                                Start tracking your expenses today
                            </p>
                        </div>

                        <form className="mt-4" onSubmit={handleSubmit}>
                            {error && (
                                <div className="alert alert-danger border border-danger mb-3" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="mb-3">
                                <label htmlFor="name" className="form-label small fw-medium text-gray-700">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="form-control"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

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

                            <div className="mb-3">
                                <label htmlFor="confirmPassword" className="form-label small fw-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-100 py-2 fw-medium"
                            >
                                {loading ? 'Creating account...' : 'Sign up'}
                            </button>

                            <div className="text-center mt-3">
                                <p className="small text-gray-600 mb-0">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-primary text-decoration-none fw-medium">
                                        Sign in
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

export default Register;
