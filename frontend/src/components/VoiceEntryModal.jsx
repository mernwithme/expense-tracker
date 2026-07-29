import { useState, useEffect } from 'react';
import voiceService from '../services/voiceService';

const VoiceEntryModal = ({ isOpen, onClose, onApplyData }) => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const rec = new SpeechRecognition();
                rec.continuous = false;
                rec.interimResults = true;
                rec.lang = 'en-US';

                rec.onresult = (event) => {
                    let current = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        current += event.results[i][0].transcript;
                    }
                    setTranscript(current);
                };

                rec.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    setListening(false);
                    setError('Voice listening error: ' + event.error);
                };

                rec.onend = () => {
                    setListening(false);
                };

                setRecognition(rec);
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) {
            setError('Web Speech API is not supported in this browser. Please type phrase below.');
            return;
        }

        if (listening) {
            recognition.stop();
            setListening(false);
        } else {
            setError('');
            setTranscript('');
            setParsedData(null);
            recognition.start();
            setListening(true);
        }
    };

    const handleParse = async () => {
        if (!transcript.trim()) {
            setError('Please speak or type an expense phrase first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await voiceService.parseVoiceExpense(transcript.trim());
            if (res.success) {
                setParsedData(res.data);
            } else {
                setError(res.message || 'Failed to parse speech');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Voice parsing error');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (parsedData && onApplyData) {
            onApplyData(parsedData);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-3">
                    <div className="modal-header bg-success text-white py-3 px-4 rounded-top-3">
                        <div className="d-flex align-items-center gap-2">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <h5 className="modal-title fw-bold mb-0">Voice Expense Entry</h5>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4 text-center">
                        {error && <div className="alert alert-danger py-2 mb-3 text-start">{error}</div>}

                        {/* Mic Button */}
                        <div className="my-4">
                            <button
                                onClick={toggleListening}
                                className={`btn rounded-circle p-4 shadow ${listening ? 'btn-danger animate-pulse' : 'btn-success'}`}
                                style={{ width: '80px', height: '80px' }}
                            >
                                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                            <p className="mt-2 fw-medium text-gray-700">
                                {listening ? 'Listening... Speak now!' : 'Click Microphone to start speaking'}
                            </p>
                        </div>

                        {/* Text box for spoken phrase / manual edit */}
                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-gray-600 text-start w-100">
                                Spoken Phrase:
                            </label>
                            <textarea
                                className="form-control"
                                rows="2"
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                placeholder='Try saying: "Spent ₹350 on Pizza today" or "Petrol ₹1200" or "Paid rent ₹8500"'
                            />
                        </div>

                        {/* Parsed Output */}
                        {parsedData && (
                            <div className="bg-light p-3 rounded-3 border text-start mb-3">
                                <h6 className="fw-bold text-gray-800 mb-2">Detected Expense Details:</h6>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Amount:</span>
                                    <span className="fw-bold text-success">₹{parsedData.amount}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Category:</span>
                                    <span className="badge bg-purple-100 text-purple-700">{parsedData.category}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Description:</span>
                                    <span className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>{parsedData.description}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer p-3 bg-white rounded-bottom-3">
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>
                            Cancel
                        </button>
                        {!parsedData ? (
                            <button
                                type="button"
                                className="btn btn-success px-4 fw-medium"
                                onClick={handleParse}
                                disabled={!transcript.trim() || loading}
                            >
                                {loading ? 'Processing...' : 'Parse Voice Entry'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary px-4 fw-medium"
                                onClick={handleApply}
                            >
                                Auto-Fill Expense Form
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceEntryModal;
