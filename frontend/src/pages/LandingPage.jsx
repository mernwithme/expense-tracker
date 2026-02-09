import { useNavigate } from 'react-router-dom';
import Footer from '../components/Common/Footer';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/login');
    };

    return (
        <div className="min-vh-100 d-flex flex-column bg-gradient-light">
           
            <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3 px-sm-5 px-lg-8 py-5">
                <div className="w-100" style={{ maxWidth: '72rem' }}>
                    <div className="text-center fade-in">
                    
                        <div className="mb-5">
                            <h1 className="display-1 fw-bolder mb-4" style={{
                                fontSize: 'clamp(3rem, 10vw, 6rem)',
                                background: 'linear-gradient(to right, #7c3aed, #8b5cf6, #6366f1)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                ExpenseIQ
                            </h1>
                            <p className="fs-4 text-gray-700 fw-medium mx-auto" style={{ maxWidth: '48rem', lineHeight: '1.75' }}>
                                Smarter expense tracking and AI insights to help you stay in control of your money.
                            </p>
                        </div>

                        <div className="mb-5">
                            <button
                                onClick={handleGetStarted}
                                className="btn btn-lg btn-primary px-5 py-3 fw-bold shadow-lg position-relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(to right, #7c3aed, #6366f1)',
                                    border: 'none',
                                    borderRadius: '1rem',
                                    fontSize: '1.125rem'
                                }}
                            >
                                <span className="d-inline-flex align-items-center gap-2">
                                    Get Started
                                    <svg
                                        className="ms-1"
                                        width="24"
                                        height="24"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </span>
                            </button>
                        </div>

                        <div className="row g-4 mx-auto mb-5" style={{ maxWidth: '80rem' }}>
            
                            <div className="col-12 col-md-4">
                                <div className="bg-white p-4 p-md-5 rounded-3 shadow-lg card-hover border border-purple-200" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
                                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-3 shadow-lg" style={{ width: '3.5rem', height: '3.5rem', background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }}>
                                        <svg
                                            className="text-white"
                                            width="32"
                                            height="32"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="fs-5 fw-bold text-gray-900 mb-2">Smart Tracking</h3>
                                    <p className="text-gray-600 mb-0">
                                        Easily track your expenses with a simple interface and real-time updates, so you always know where your money’s going
                                    </p>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="bg-white p-4 p-md-5 rounded-3 shadow-lg card-hover border border-purple-200" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
                                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-3 shadow-lg" style={{ width: '3.5rem', height: '3.5rem', background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                                        <svg
                                            className="text-white"
                                            width="32"
                                            height="32"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="fs-5 fw-bold text-gray-900 mb-2">Budget Management</h3>
                                    <p className="text-gray-600 mb-0">
                                        Create budgets for different categories and get timely alerts whenever before you go over your limits
                                    </p>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="bg-white p-4 p-md-5 rounded-3 shadow-lg card-hover border border-purple-200" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
                                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-3 shadow-lg" style={{ width: '3.5rem', height: '3.5rem', background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }}>
                                        <svg
                                            className="text-white"
                                            width="32"
                                            height="32"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="fs-5 fw-bold text-gray-900 mb-2">AI Insights</h3>
                                    <p className="text-gray-600 mb-0">
                                        Receive personalized insights and smart recommendations powered by AI to help you make better financial decisions
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="row g-4 mx-auto mt-5" style={{ maxWidth: '64rem' }}>
                            <div className="col-12 col-md-4 text-center">
                                <div className="display-3 fw-bolder" style={{
                                    background: 'linear-gradient(to right, #7c3aed, #6366f1)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    100%
                                </div>
                                <div className="text-gray-700 fw-medium mt-2">Secure & Private</div>
                            </div>
                            <div className="col-12 col-md-4 text-center">
                                <div className="display-3 fw-bolder" style={{
                                    background: 'linear-gradient(to right, #7c3aed, #6366f1)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    24/7
                                </div>
                                <div className="text-gray-700 fw-medium mt-2">Real-time Tracking</div>
                            </div>
                            <div className="col-12 col-md-4 text-center">
                                <div className="display-3 fw-bolder" style={{
                                    background: 'linear-gradient(to right, #7c3aed, #6366f1)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    AI
                                </div>
                                <div className="text-gray-700 fw-medium mt-2">Powered Insights</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default LandingPage;
