import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './PdfTestInterface.css'; // Will create this next

const PdfTestInterface = () => {
    const { filename } = useParams();
    const navigate = useNavigate();

    // State
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: optionIndex }
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [viewMode, setViewMode] = useState('pdf');

    // Load PDF URL: http://localhost:5000/data/quizzes/FILENAME
    const pdfUrl = `http://localhost:5000/data/quizzes/${filename}`;

    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                // Fetch JSON data for answer key
                // The backend route /api/chemistry-pyq/:filename/parsed logic matches:
                // filename.pdf -> filename.json
                const response = await axios.get(`http://localhost:5000/api/chemistry-pyq/${filename}/parsed`);
                if (response.data.ok) {
                    setQuestions(response.data.data);
                } else {
                    setError('Failed to load quiz data');
                }
            } catch (err) {
                console.error(err);
                setError('Error fetching quiz data');
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();
    }, [filename]);

    const handleOptionSelect = (qIndex, optIndex) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({
            ...prev,
            [qIndex]: optIndex
        }));
    };

    const handleSubmit = () => {
        if (!window.confirm("Are you sure you want to submit?")) return;

        let calculatedScore = 0;
        questions.forEach((q, index) => {
            const userAns = userAnswers[index];
            // Assuming q.answer is 0-based index or string letter
            // Our data cleaning ensured 0-based index in `answer` field
            if (userAns !== undefined && userAns === q.answer) {
                calculatedScore += 4;
            } else if (userAns !== undefined && userAns !== q.answer) {
                calculatedScore -= 1;
            }
        });
        setScore(calculatedScore);
        setIsSubmitted(true);
    };

    if (loading) return <div className="loading-screen">Loading Test Interface...</div>;
    if (error) return <div className="error-screen">{error}</div>;

    return (
        <div className="pdf-test-container">
            {/* Left Panel: Content (PDF or Interactive) */}
            <div className="pdf-panel">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <button className="back-btn" onClick={() => navigate('/chemistry-pyq-pdf')} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>← Back</button>
                    <div className="view-toggles" style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className={`toggle-btn ${viewMode === 'pdf' ? 'active' : ''}`}
                            onClick={() => setViewMode('pdf')}
                            style={{
                                padding: '6px 16px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                background: viewMode === 'pdf' ? '#3b82f6' : 'white',
                                color: viewMode === 'pdf' ? 'white' : '#64748b',
                                cursor: 'pointer'
                            }}
                        >
                            📄 PDF
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'interactive' ? 'active' : ''}`}
                            onClick={() => setViewMode('interactive')}
                            style={{
                                padding: '6px 16px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                background: viewMode === 'interactive' ? '#3b82f6' : 'white',
                                color: viewMode === 'interactive' ? 'white' : '#64748b',
                                cursor: 'pointer'
                            }}
                        >
                            ✨ Interactive
                        </button>
                    </div>
                </div>

                <div className="content-frame-wrapper" style={{ height: 'calc(100% - 60px)', overflowY: 'auto', position: 'relative' }}>
                    {viewMode === 'pdf' ? (
                        <iframe
                            src={pdfUrl}
                            title="Question Paper"
                            width="100%"
                            height="100%"
                            className="pdf-frame"
                            style={{ border: 'none' }}
                        />
                    ) : (
                        <div className="interactive-mode" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                            {questions.map((q, idx) => (
                                <div key={idx} className="interactive-q-card" style={{ marginBottom: '24px', padding: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div className="q-text" style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e293b' }}>
                                        <span style={{ fontWeight: 'bold', marginRight: '8px', color: '#3b82f6' }}>{idx + 1}.</span>
                                        <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
                                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {q.question}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <div className="q-options" style={{ display: 'grid', gap: '12px' }}>
                                        {q.options && q.options.map((opt, optIdx) => {
                                            const isSelected = userAnswers[idx] === optIdx;
                                            const isCorrect = isSubmitted && q.answer === optIdx;
                                            const isWrong = isSubmitted && isSelected && q.answer !== optIdx;

                                            let bg = '#f8fafc';
                                            let border = '1px solid #f1f5f9';
                                            let color = '#64748b';

                                            if (isSubmitted) {
                                                if (isCorrect) {
                                                    bg = '#dcfce7';
                                                    border = '1px solid #86efac';
                                                    color = '#15803d';
                                                } else if (isWrong) {
                                                    bg = '#fee2e2';
                                                    border = '1px solid #fca5a5';
                                                    color = '#b91c1c';
                                                } else if (isSelected) {
                                                    // Selected but neutral (shouldn't happen if answers are correct/wrong)
                                                    // But just in case
                                                }
                                            } else {
                                                if (isSelected) {
                                                    bg = '#eff6ff';
                                                    border = '1px solid #60a5fa';
                                                    color = '#1e3a8a';
                                                }
                                            }

                                            return (
                                                <div
                                                    key={optIdx}
                                                    className="q-option"
                                                    onClick={() => !isSubmitted && handleOptionSelect(idx, optIdx)}
                                                    style={{
                                                        display: 'flex',
                                                        gap: '12px',
                                                        padding: '12px',
                                                        background: bg,
                                                        borderRadius: '8px',
                                                        border: border,
                                                        cursor: isSubmitted ? 'default' : 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: '600', color: color, minWidth: '24px' }}>{String.fromCharCode(65 + optIdx)}.</div>
                                                    <div className="opt-content">
                                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                            {opt}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {isSubmitted && (
                                        <div className="q-solution" style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                                            <strong style={{ display: 'block', marginBottom: '8px', color: '#16a34a' }}>Correct Answer: {String.fromCharCode(65 + (q.answer === undefined ? -1 : q.answer))}</strong>
                                            <div className="solution-text" style={{ color: '#1e293b' }}>
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {q.solution || q.explanation || "No detailed solution available."}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: OMR & Tools */}
            <div className="omr-panel">
                <div className="omr-header">
                    <h2>Answer Sheet</h2>
                    {isSubmitted && (
                        <div className="score-display">
                            Score: <span className={score >= 0 ? "positive" : "negative"}>{score}</span> / {questions.length * 4}
                        </div>
                    )}
                </div>

                <div className="omr-grid">
                    <div className="omr-grid-header">
                        <span>Q.No</span>
                        <span>A</span>
                        <span>B</span>
                        <span>C</span>
                        <span>D</span>
                    </div>
                    {questions.map((q, index) => {
                        const qNum = index + 1;
                        const userSel = userAnswers[index];
                        const correctAns = q.answer;

                        let statusClass = "";
                        if (isSubmitted) {
                            if (userSel === correctAns) statusClass = "correct";
                            else if (userSel !== undefined && userSel !== correctAns) statusClass = "wrong";
                            else statusClass = "unattempted";
                        }

                        return (
                            <div key={index} className={`omr-row ${statusClass}`}>
                                <span className="q-num">{qNum}</span>
                                {[0, 1, 2, 3].map((optIdx) => {
                                    let bubbleClass = "bubble";
                                    if (userSel === optIdx) bubbleClass += " selected";
                                    if (isSubmitted && correctAns === optIdx) bubbleClass += " correct-answer";

                                    return (
                                        <div
                                            key={optIdx}
                                            className={bubbleClass}
                                            onClick={() => handleOptionSelect(index, optIdx)}
                                        >
                                            {String.fromCharCode(65 + optIdx)}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                <div className="omr-footer">
                    {!isSubmitted ? (
                        <button className="submit-btn" onClick={handleSubmit}>Submit Test</button>
                    ) : (
                        <button className="retake-btn" onClick={() => window.location.reload()}>Retake Test</button>
                    )}
                    <button className="close-btn" onClick={() => navigate('/chemistry-pyq-pdf')}>Exit</button>
                </div>
            </div>
        </div>
    );
};

export default PdfTestInterface;
