import { useState, useEffect } from 'react';
import aiService from '../services/aiService';

const AIChatModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const exampleQuestions = [
        "Where did I spend the most this month?",
        "How much did I save?",
        "Compare this month with last month.",
        "Predict next month's expenses.",
        "Give me ways to reduce spending."
    ];

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        try {
            const res = await aiService.getChatHistory();
            if (res.success && res.data.history.length > 0) {
                const formatted = [];
                res.data.history.reverse().forEach(h => {
                    formatted.push({ sender: 'user', text: h.prompt });
                    formatted.push({ sender: 'ai', text: h.response });
                });
                setMessages(formatted);
            } else {
                setMessages([
                    {
                        sender: 'ai',
                        text: 'Hello! I am your ExpenseIQ AI Financial Assistant. Ask me anything about your spending, savings, budget, or future predictions!'
                    }
                ]);
            }
        } catch (err) {
            console.error('Failed to load chat history:', err);
        }
    };

    const handleSend = async (qText) => {
        const textToSend = qText || query;
        if (!textToSend.trim()) return;

        const newMsgList = [...messages, { sender: 'user', text: textToSend }];
        setMessages(newMsgList);
        setQuery('');
        setLoading(true);
        setError('');

        try {
            const res = await aiService.sendChatMessage(textToSend);
            if (res.success) {
                setMessages([...newMsgList, { sender: 'ai', text: res.data.response }]);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'AI Assistant is currently unavailable.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg rounded-3">
                    <div className="modal-header bg-primary text-white py-3 px-4 rounded-top-3">
                        <div className="d-flex align-items-center gap-2">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <h5 className="modal-title fw-bold mb-0">ExpenseIQ AI Assistant</h5>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4" style={{ height: '420px', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
                        {error && (
                            <div className="alert alert-danger py-2 mb-3">{error}</div>
                        )}

                        <div className="d-flex flex-column gap-3">
                            {messages.map((m, index) => (
                                <div
                                    key={index}
                                    className={`d-flex ${m.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                                >
                                    <div
                                        className={`p-3 rounded-3 shadow-sm style-msg ${
                                            m.sender === 'user'
                                                ? 'bg-primary text-white ms-5'
                                                : 'bg-white text-gray-800 me-5 border'
                                        }`}
                                        style={{ maxWidth: '80%', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="d-flex justify-content-start">
                                    <div className="p-3 bg-white text-muted border rounded-3 d-flex align-items-center gap-2">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                        <span>AI is analyzing your finances...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Example Quick Questions */}
                    <div className="px-4 py-2 bg-white border-top border-bottom">
                        <p className="small text-muted mb-2 fw-semibold">Suggested Questions:</p>
                        <div className="d-flex flex-wrap gap-2">
                            {exampleQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(q)}
                                    disabled={loading}
                                    className="btn btn-outline-secondary btn-sm rounded-pill"
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="modal-footer p-3 bg-white rounded-bottom-3">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="w-100 d-flex gap-2"
                        >
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ask AI about your spending, budget, or savings..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={loading}
                            />
                            <button type="submit" className="btn btn-primary px-4 fw-medium" disabled={loading || !query.trim()}>
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatModal;
