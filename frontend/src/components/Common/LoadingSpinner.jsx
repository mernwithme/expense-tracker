const LoadingSpinner = ({ size = 'medium', message }) => {
    const sizeClasses = {
        small: 'spinner-border-sm',
        medium: '',
        large: 'spinner-border spinner-border-lg'
    };

    return (
        <div className="d-flex flex-column align-items-center justify-content-center p-4">
            <div className={`spinner-border text-primary ${sizeClasses[size]}`} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            {message && <p className="mt-3 text-gray-600">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
