import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Footer from '../components/Common/Footer';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    // Step management: 1 = Email, 2 = OTP, 3 = Password
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // OTP state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);

    // Resend state
    const [resendCount, setResendCount] = useState(0);
    const [cooldown, setCooldown] = useState(0);

    // UI state
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    // Handle individual OTP digit input
    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return; // Only allow digits

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            otpRefs.current[5]?.focus();
        }
    };

    // STEP 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!formData.name.trim()) {
            setError('Name is required');
            setLoading(false);
            return;
        }

        if (!formData.email.trim()) {
            setError('Email is required');
            setLoading(false);
            return;
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        try {
            await authService.sendOtp(formData.email, formData.name);
            setSuccess('Verification code sent to your email.');
            setStep(2);
            setResendCount(1);
            setCooldown(60);
            // Focus first OTP input after transition
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to send verification code.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter the complete 6-digit code');
            setLoading(false);
            return;
        }

        try {
            await authService.verifyOtp(formData.email, otpString);
            setSuccess('Email verified successfully!');
            setStep(3);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Verification failed.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (cooldown > 0 || resendCount >= 3) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await authService.resendOtp(formData.email, formData.name);
            setOtp(['', '', '', '', '', '']);
            setResendCount(prev => prev + 1);
            setCooldown(60);
            setSuccess(response.message || 'New verification code sent.');
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to resend code.';
            setError(errorMessage);

            // If cooldown info is in response, use it
            if (err.response?.data?.remainingSeconds) {
                setCooldown(err.response.data.remainingSeconds);
            }
        } finally {
            setLoading(false);
        }
    };

    // STEP 3: Complete Registration
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

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
            const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Step indicator
    const renderStepIndicator = () => (
        <div className="d-flex justify-content-center align-items-center mb-4 gap-2">
            {[1, 2, 3].map((s) => (
                <div key={s} className="d-flex align-items-center">
                    <div
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                            width: '32px',
                            height: '32px',
                            fontSize: '14px',
                            fontWeight: '600',
                            backgroundColor: step >= s ? '#0d6efd' : '#e9ecef',
                            color: step >= s ? '#fff' : '#6c757d',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {step > s ? '✓' : s}
                    </div>
                    {s < 3 && (
                        <div
                            style={{
                                width: '40px',
                                height: '2px',
                                backgroundColor: step > s ? '#0d6efd' : '#e9ecef',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    );

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
                                {step === 1 && 'Start tracking your expenses today'}
                                {step === 2 && 'Enter the verification code sent to your email'}
                                {step === 3 && 'Set your password to complete registration'}
                            </p>
                        </div>

                        {renderStepIndicator()}

                        {/* Error Alert */}
                        {error && (
                            <div className="alert alert-danger border border-danger mb-3" role="alert">
                                {error}
                            </div>
                        )}

                        {/* Success Alert */}
                        {success && (
                            <div className="alert alert-success border border-success mb-3" role="alert">
                                {success}
                            </div>
                        )}

                        {/* ============ STEP 1: Email & Name ============ */}
                        {step === 1 && (
                            <form className="mt-2" onSubmit={handleSendOtp}>
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

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-100 py-2 fw-medium"
                                >
                                    {loading ? 'Sending code...' : 'Send Verification Code'}
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
                        )}

                        {/* ============ STEP 2: OTP Verification ============ */}
                        {step === 2 && (
                            <form className="mt-2" onSubmit={handleVerifyOtp}>
                                <div className="mb-3">
                                    <label className="form-label small fw-medium text-gray-700 d-block text-center">
                                        Verification Code
                                    </label>
                                    <div className="d-flex justify-content-center gap-2" onPaste={handleOtpPaste}>
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={el => otpRefs.current[index] = el}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                className="form-control text-center fw-bold"
                                                style={{
                                                    width: '48px',
                                                    height: '52px',
                                                    fontSize: '20px',
                                                    borderRadius: '8px'
                                                }}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-center small text-gray-600 mt-2 mb-0">
                                        Sent to <strong>{formData.email}</strong>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.join('').length !== 6}
                                    className="btn btn-primary w-100 py-2 fw-medium"
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </button>

                                {/* Resend OTP */}
                                <div className="text-center mt-3">
                                    {resendCount >= 3 ? (
                                        <p className="small text-danger mb-0">
                                            Maximum resend attempts reached.
                                        </p>
                                    ) : cooldown > 0 ? (
                                        <p className="small text-gray-600 mb-0">
                                            Resend code in <strong>{cooldown}s</strong>
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 small text-primary text-decoration-none fw-medium"
                                            onClick={handleResendOtp}
                                            disabled={loading}
                                        >
                                            Resend Verification Code
                                        </button>
                                    )}
                                    {resendCount > 0 && resendCount < 3 && (
                                        <p className="small text-gray-600 mt-1 mb-0">
                                            {3 - resendCount} resend{3 - resendCount !== 1 ? 's' : ''} remaining
                                        </p>
                                    )}
                                </div>

                                {/* Back to step 1 */}
                                <div className="text-center mt-2">
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 small text-gray-600 text-decoration-none"
                                        onClick={() => {
                                            setStep(1);
                                            setOtp(['', '', '', '', '', '']);
                                            setError('');
                                            setSuccess('');
                                        }}
                                    >
                                        ← Change email
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ============ STEP 3: Password Setup ============ */}
                        {step === 3 && (
                            <form className="mt-2" onSubmit={handleRegister}>
                                <div className="mb-3">
                                    <div className="alert alert-info border border-info py-2 small mb-3">
                                        ✅ Email verified: <strong>{formData.email}</strong>
                                    </div>
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
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Register;
