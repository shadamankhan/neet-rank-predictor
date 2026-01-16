import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { getApiBase } from '../../apiConfig';
import './ExamEngine.css';
import LatexRenderer from '../../components/LatexRenderer';
import { preprocessContent, groupQuestionsIntoSections } from '../../utils/examUtils';

// Manual LaTeX Renderer Component to bypass plugin issues
// Local LatexRenderer removed, imported from components


const ExamEngine = ({ mode }) => {
    const navigate = useNavigate();
    const { id, resultId } = useParams(); // resultId from /test-solution/:resultId
    const isReviewMode = mode === 'review' || !!resultId;

    // CBT State
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [activeSection, setActiveSection] = useState('Physics');
    const [currentQIndex, setCurrentQIndex] = useState(0);

    // Status Map
    const [userResponse, setUserResponse] = useState({
        Physics: {},
        Chemistry: {},
        Biology: {},
        Zoology: {}
    });

    // Sidebar Toggle for mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showMobilePalette, setShowMobilePalette] = useState(false);

    // Fetch Exam Data & Result (if review)
    useEffect(() => {
        const loadEngine = async () => {
            try {
                let targetTestId = id;
                let fetchedAnswers = {};

                // 1. If Review Mode, Fetch Result First
                if (isReviewMode) {
                    const resParams = resultId || id; // resultId is priority
                    const res = await fetch(`${getApiBase()}/api/test-series/result/${resParams}`);
                    const resData = await res.json();

                    if (!resData.ok) throw new Error("Failed to load result");

                    targetTestId = resData.result.testId;
                    fetchedAnswers = resData.result.answers || {};
                }

                // 2. Fetch Test Data
                if (!targetTestId) throw new Error("Test ID not found");

                const testRes = await fetch(`${getApiBase()}/api/test-series/${targetTestId}`);
                const testData = await testRes.json();

                if (!testData.ok) throw new Error(testData.message);

                const exam = testData.test;

                // Helper to preprocess LaTeX (math) content - MOVED TO UTILS
                // const preprocessContent = (content) => ... imported


                // Adapter: Normalize Questions
                // Adapter: Normalize Questions
                const normalizeQ = (q) => {
                    // Derive correct answer index if options are objects with isCorrect
                    let derivedAnswer = q.answer;
                    if (Array.isArray(q.options) && q.options.length > 0 && typeof q.options[0] === 'object') {
                        const correctIdx = q.options.findIndex(o => o.isCorrect);
                        if (correctIdx !== -1) derivedAnswer = correctIdx;
                    }

                    return {
                        ...q,
                        // Handle 'statement' from backend being the question text
                        question: q.question || q.statement || "Question Text Missing",
                        answer: derivedAnswer,
                        // Handle options being objects { text: "...", ... } instead of strings
                        options: Array.isArray(q.options)
                            ? q.options.map(opt => (typeof opt === 'object' && opt.text) ? opt.text : opt)
                            : []
                    };
                };

                // Apply normalization to flat array or sectioned object
                if (Array.isArray(exam.questions)) {
                    exam.questions = exam.questions.map(normalizeQ);
                } else if (exam.questions && typeof exam.questions === 'object') {
                    Object.keys(exam.questions).forEach(sec => {
                        if (Array.isArray(exam.questions[sec])) {
                            exam.questions[sec] = exam.questions[sec].map(normalizeQ);
                        }
                    });
                }

                if (Array.isArray(exam.questions) && !exam.sections) {
                    // Use shared logic for grouping
                    const { sections: newSections, questions: newQs } = groupQuestionsIntoSections(exam.questions);

                    exam.sections = newSections;
                    exam.questions = newQs;

                    // Set active section to first available if not default
                    if (newSections.length > 0 && newSections.indexOf('Physics') === -1) {
                        // logic handled by state
                    }
                }

                setExamData(exam);
                if (!isReviewMode) setTimeLeft((exam.duration || 180) * 60);

                // Initialize / Restore Responses
                const initialResponse = {};
                if (exam.sections) {
                    let globalIndex = 0;
                    exam.sections.forEach(sec => {
                        initialResponse[sec] = {};
                        // Map back flat answers to section-based structure
                        exam.questions[sec].forEach((q, idx) => {
                            if (isReviewMode) {
                                const ans = fetchedAnswers[globalIndex];
                                if (ans !== undefined) {
                                    initialResponse[sec][idx] = {
                                        selectedOption: ans,
                                        status: 'answered'
                                    };
                                }
                            }
                            globalIndex++;
                        });
                    });
                    setUserResponse(initialResponse);
                    setActiveSection(exam.sections[0]);
                } else {
                    setActiveSection('General');
                }
                setLoading(false);

            } catch (err) {
                console.error("Engine Load Error:", err);
                alert(err.message);
                setLoading(false);
            }
        };

        loadEngine();
    }, [id, resultId, isReviewMode]);

    // Initial visit marking
    useEffect(() => {
        if (!examData) return;
        const currentStatus = userResponse[activeSection]?.[currentQIndex]?.status;
        if (!currentStatus || currentStatus === 'not-visited') {
            updateStatus('not-answered');
        }
    }, [activeSection, currentQIndex, examData]);

    // Timer Logic
    useEffect(() => {
        if (!examData || isReviewMode) return; // Disable timer in review mode

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    submitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [examData, isReviewMode]);

    // Format Time
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const updateStatus = (newStatus, optionIdx = null) => {
        setUserResponse(prev => ({
            ...prev,
            [activeSection]: {
                ...prev[activeSection],
                [currentQIndex]: {
                    ...prev[activeSection][currentQIndex],
                    status: newStatus,
                    selectedOption: optionIdx !== null ? optionIdx : prev[activeSection][currentQIndex]?.selectedOption
                }
            }
        }));
    };

    const handleSaveAndNext = () => {
        const currentResp = userResponse[activeSection][currentQIndex];
        if (currentResp?.selectedOption !== undefined) {
            updateStatus('answered');
        } else {
            updateStatus('not-answered');
        }

        // Move to next question
        if (currentQIndex < examData.questions[activeSection].length - 1) {
            setCurrentQIndex(prev => prev + 1);
        }
    };

    const handleMarkReview = () => {
        const currentResp = userResponse[activeSection][currentQIndex];
        if (currentResp?.selectedOption !== undefined) {
            updateStatus('marked-answered');
        } else {
            updateStatus('marked');
        }

        if (currentQIndex < examData.questions[activeSection].length - 1) {
            setCurrentQIndex(prev => prev + 1);
        }
    };

    const handleClearResponse = () => {
        setUserResponse(prev => {
            const newState = { ...prev };
            delete newState[activeSection][currentQIndex].selectedOption;
            newState[activeSection][currentQIndex].status = 'not-answered';
            return newState;
        });
    };

    const handleOptionSelect = (optIdx) => {
        updateStatus(null, optIdx); // Just update selection, status updates on save
    };

    const submitExam = async () => {
        if (!window.confirm("Are you sure you want to submit the test?")) return;

        setLoading(true);
        try {
            // Flatten responses for backend: { [qIndex]: selectedOption }
            // Since backend expects flat index matching test.questions array order.
            // But we have section-based structure in frontend state: userResponse[Section][Index]

            // We need to reconstruct the flat index.
            // We'll iterate sections in order match backend question order.
            // Assumption: examData.questions is an OBJECT with sections keys?
            // OR did we receive sections from backend?

            // Let's look at how we initialized `userResponse`.
            // We need to map `userResponse` back to a linear index if possible, OR send structured.
            // My backend implementation decided to take `answers` as { index: option }.

            // Let's try to map it.
            // We need to know the global index of each question.
            // Since `examData` came from backend `get /test/:id`.
            // In backend `get /:id` returns `test` object.
            // If `test.questions` is array, how did we get section keys in frontend?
            // Ah, the `ExamEngine` expects `questions` to be an object { Physics: [], ... }.
            // BUT backend `testSeries.js` saves questions as ARRAY.
            // THERE IS A DISCONNECT.

            // IF backend sends flat array, `ExamEngine` lines 38-45 handles it?
            // "if (data.sections ...)"
            // If data is just `test` object with flat questions, ExamEngine might break if not adapted.
            // Let's assume for this "All Related" fix that we will SEND what we have, and Backend needs to handle it.

            // Actually, to make this robust quickly:
            // Let's create a linear map of answers based on the order questions appear in the sections.
            // Assuming backend `questions` array order matches `sections` order iteration.

            const flatAnswers = {};
            let globalIndex = 0;

            // If examData.sections exists, userResponse key is section name
            if (examData.sections && examData.sections.length > 0) {
                examData.sections.forEach(sec => {
                    const sectionQs = examData.questions[sec];
                    sectionQs.forEach((q, localIdx) => {
                        const resp = userResponse[sec]?.[localIdx];
                        if (resp && resp.selectedOption !== undefined) {
                            flatAnswers[globalIndex] = resp.selectedOption;
                        }
                        globalIndex++;
                    });
                });
            } else {
                // Fallback if no sections (flat)
                // This case might not be handled by current ExamEngine UI well, but for safety:
                // ...
            }

            // UserId: Get from Firebase Auth
            const auth = getAuth();
            const user = auth.currentUser;
            const uid = user ? user.uid : "guest_user";

            const res = await fetch(`${getApiBase()}/api/test-series/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: id,
                    uid: uid,
                    answers: flatAnswers,
                    timeTaken: 180 * 60 - timeLeft // Seconds spent
                })
            });

            const result = await res.json();
            if (result.ok) {
                navigate(`/test-analysis/${result.resultId}`);
            } else {
                alert('Submission failed: ' + result.message);
                setLoading(false);
            }

        } catch (err) {
            console.error("Submission error", err);
            alert("Error submitting test");
            setLoading(false);
        }
    };

    // Render Helpers
    const getButtonClass = (index) => {
        const status = userResponse[activeSection]?.[index]?.status || 'not-visited';
        return `palette-btn ${status} ${currentQIndex === index ? 'current' : ''}`;
    };

    // Preprocess Logic Removed - using shared utility


    if (loading) return <div className="exam-engine-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading Exam Environment...</div>;
    if (!examData || !examData.questions) return <div className="exam-engine-container">Failed to load exam data. Please try again later.</div>;

    const currentQuestion = examData.questions[activeSection] ? examData.questions[activeSection][currentQIndex] : null;

    if (!currentQuestion) {
        return (
            <div className="exam-engine-container">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>No questions found for this section.</h2>
                    <button className="btn-secondary" onClick={() => window.location.reload()}>Reload</button>
                </div>
            </div>
        );
    }

    const selectedOpt = userResponse[activeSection] && userResponse[activeSection][currentQIndex] ? userResponse[activeSection][currentQIndex].selectedOption : undefined;

    // Get User Info for UI
    const auth = getAuth();
    const user = auth.currentUser;

    return (
        <div className="exam-engine-container">
            {/* 1. Header */}
            <header className="exam-header">
                <div className="exam-title">
                    <h2>{examData.title}</h2>
                </div>
                <div className="exam-info-bar">
                    <div className="student-info">
                        Candidate: <strong>{user ? user.displayName || user.email : 'Guest Student'}</strong>
                    </div>
                    {isReviewMode ? (
                        <div className="timer-box" style={{ background: '#4ade80', color: '#065f46' }}>
                            REVIEW MODE
                        </div>
                    ) : (
                        <div className={`timer-box ${timeLeft < 300 ? 'warning' : ''}`}>
                            Time Left: {formatTime(timeLeft)}
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setShowMobilePalette(!showMobilePalette)}
                    >
                        {showMobilePalette ? '✕' : '☰'}
                    </button>
                </div>
            </header>

            {/* 2. Main Body */}
            <div className="exam-body">
                {/* Left Panel: Question Area */}
                <div className="question-area">
                    {/* Subject Tabs - FILTER EMPTY SECTIONS */}
                    <div className="subject-tabs">
                        {examData.sections && examData.sections.map(sec => {
                            // Only render tab if section has questions
                            if (!examData.questions[sec] || examData.questions[sec].length === 0) return null;

                            return (
                                <button
                                    key={sec}
                                    className={`tab-btn ${activeSection === sec ? 'active' : ''}`}
                                    onClick={() => { setActiveSection(sec); setCurrentQIndex(0); }}
                                >
                                    {sec}
                                    {/* Removed 'i' icon */}
                                </button>
                            );
                        })}
                    </div>

                    {/* Question Header */}
                    <div className="question-header-bar">
                        <span className="q-label">Question {currentQIndex + 1}</span>
                        <span className="q-marks">+4, -1 Marks</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8em' }}>Report</button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="question-content-scroll">
                        <div className="q-text">
                            <LatexRenderer>{preprocessContent(currentQuestion.question)}</LatexRenderer>
                        </div>
                        <div className="options-grid">
                            {currentQuestion.options.map((opt, idx) => {
                                // Logic for Solution View
                                let optClass = `option-item `;
                                const isSelected = selectedOpt === idx;
                                const isCorrect = parseInt(currentQuestion.answer) === idx;

                                if (isReviewMode) {
                                    if (isCorrect) optClass += ' correct-answer';
                                    else if (isSelected) optClass += ' wrong-answer';
                                } else {
                                    if (isSelected) optClass += ' selected';
                                }

                                return (
                                    <div
                                        key={idx}
                                        className={optClass}
                                        onClick={() => !isReviewMode && handleOptionSelect(idx)}
                                    >
                                        <div className="opt-radio">
                                            {isReviewMode && isCorrect && '✓'}
                                            {isReviewMode && isSelected && !isCorrect && '✗'}
                                        </div>
                                        <span className="opt-text">
                                            <LatexRenderer>{preprocessContent(opt)}</LatexRenderer>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Explanation Box for Review Mode */}
                        {isReviewMode && (
                            <div className="explanation-box" style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderLeft: '4px solid #0ea5e9', borderRadius: '4px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>Explanation:</h4>
                                <div style={{ color: '#334155' }}>
                                    <LatexRenderer>{preprocessContent(currentQuestion.explanation || "No explanation provided.")}</LatexRenderer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Controls */}
                    <div className="exam-footer">
                        {!isReviewMode ? (
                            <>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="btn-secondary" onClick={handleClearResponse}>Clear Response</button>
                                    <button className="btn-warning" onClick={handleMarkReview}>Mark for Review & Next</button>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="btn-secondary" disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}>Previous</button>
                                    <button className="btn-primary" onClick={handleSaveAndNext}>Save & Next</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <button className="btn-secondary" disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}>Previous</button>
                                <button className="btn-primary" disabled={currentQIndex === examData.questions[activeSection].length - 1} onClick={() => setCurrentQIndex(prev => prev + 1)}>Next</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Palette */}
                {/* Mobile Overlay */}
                {showMobilePalette && (
                    <div className="palette-overlay" onClick={() => setShowMobilePalette(false)}></div>
                )}
                <aside className={`side-palette ${showMobilePalette ? 'open' : ''}`}>
                    <div className="palette-header">
                        <div className="user-card">
                            <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || 'G'}</div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{user?.displayName || 'Guest User'}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>NEET Aspirant</div>
                            </div>
                        </div>
                    </div>

                    <div className="legend-grid">
                        <div className="legend-item"><div className="legend-icon answered">0</div> Answered</div>
                        <div className="legend-item"><div className="legend-icon not-answered">0</div> Not Answered</div>
                        <div className="legend-item"><div className="legend-icon not-visited">0</div> Not Visited</div>
                        <div className="legend-item"><div className="legend-icon marked">0</div> Marked for Review</div>
                        <div className="legend-item"><div className="legend-icon marked-answered">0</div> Ans & Marked</div>
                    </div>

                    <div style={{ padding: '0 20px' }}>
                        <span className="section-label">Section: {activeSection}</span>
                    </div>

                    <div className="palette-scroll">
                        <div className="questions-grid">
                            {examData.questions[activeSection] && examData.questions[activeSection].map((q, idx) => {
                                // Review Mode Style Logic
                                const getReviewStyle = () => {
                                    if (!isReviewMode) return {};

                                    const resp = userResponse[activeSection]?.[idx];
                                    const correctAns = parseInt(q.answer);
                                    const isSelected = resp?.selectedOption !== undefined;

                                    if (isSelected) {
                                        if (resp.selectedOption === correctAns) {
                                            return { backgroundColor: '#22c55e', color: 'white', borderColor: '#22c55e' }; // Green
                                        } else {
                                            return { backgroundColor: '#ef4444', color: 'white', borderColor: '#ef4444' }; // Red
                                        }
                                    } else {
                                        return { backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#cbd5e1' }; // Gray
                                    }
                                };

                                return (
                                    <button
                                        key={idx}
                                        className={getButtonClass(idx)}
                                        style={getReviewStyle()}
                                        onClick={() => setCurrentQIndex(idx)}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="palette-footer">
                        {!isReviewMode ?
                            <button className="btn-submit-exam" onClick={submitExam}>Submit Test</button>
                            :
                            <button className="btn-submit-exam" onClick={() => navigate('/test-series')}>Exit Review</button>
                        }
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ExamEngine;
