const Footer = () => {
    return (
        <div className="foot">
            <footer className="bg-gray-50 border-top border-gray-200 mt-auto py-3">
                <div className="container-fluid px-4 px-sm-5 px-lg-8">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                        <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 small text-gray-600 mb-2">
                            <span className="fw-semibold text-gray-800">ExpenseIQ</span>
                            <span className="d-none d-sm-inline">•</span>
                            <span>Developed by Nithish Kumar </span>
                            <span className="d-none d-sm-inline">•</span>
                            <div className="d-flex align-items-center gap-2">
                                <a
                                    href="https://github.com/mernwithme"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-decoration-none"
                                    aria-label="GitHub Profile"
                                >
                                    GitHub
                                </a>
                                <span>•</span>
                                <a
                                    href="https://mernwithme.github.io/Personal-Portfolio/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-decoration-none"
                                    aria-label="Portfolio Website"
                                >
                                    Portfolio
                                </a>
                            </div>

                            <span className="d-none d-sm-inline">•</span>
                            <span>© 2026</span>
                        </div>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                            All data is stored locally and securely.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Footer;
