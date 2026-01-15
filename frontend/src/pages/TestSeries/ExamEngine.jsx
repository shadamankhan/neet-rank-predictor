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

// Manual LaTeX Renderer Component to bypass plugin issues
const LatexRenderer = ({ children }) => {
    // If children is not a string, render as is
    if (typeof children !== 'string') return <>{children}</>;

    // Split by $ delimiter. 
    // Even indices (0, 2, 4...) are TEXT. Odd indices (1, 3, 5...) are MATH.
    const parts = children.split('$');

    return (
        <span>
            {parts.map((part, index) => {
                // Determine if this segment is math
                // A segment is math if it's odd-indexed AND not empty
                const isMath = index % 2 === 1;

                if (isMath) {
                    try {
                        const html = katex.renderToString(part, {
                            throwOnError: false,
                            displayMode: false
                        });
                        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
                    } catch (e) {
                        return <span key={index} className="katex-error">{part}</span>;
                    }
                } else {
                    // Render generic Markdown-like features for text parts (Bold only for now)
                    // We can use a simple split for bold (**text**)
                    const textParts = part.split(/(\*\*.*?\*\*)/g);
                    return (
                        <span key={index}>
                            {textParts.map((t, i) => {
                                if (t.startsWith('**') && t.endsWith('**')) {
                                    return <strong key={i}>{t.slice(2, -2)}</strong>;
                                }
                                return t;
                            })}
                        </span>
                    );
                }
            })}
        </span>
    );
};

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

                // Helper to preprocess LaTeX (math) content
                const preprocessContent = (content) => {
                    if (!content) return "";
                    // If content has [ ] or ( ) delimiters for math, ensure they are formatted for remark-math (usually $...$ or $$...$$)
                    // Basic normalizers:
                    let processed = content
                        .replace(/\\\[/g, '$$$') // Replace \[ with $$
                        .replace(/\\\]/g, '$$$') // Replace \] with $$
                        .replace(/\\\(/g, '$')   // Replace \( with $
                        .replace(/\\\)/g, '$');  // Replace \) with $

                    // Fix: If there are literal $ that are NOT part of math (rare in this context, but possible)
                    // ideally we assume $ is math.

                    // Specific fix for "there are $ appearing":
                    // This implies $ is being treated as text. remark-math needs $ to be spaced or distinct? 
                    // Or maybe escaping issue. 
                    // If the user says "there are $ appearing", it means they see "$E=mc^2$" instead of the formula.
                    // This happens if remark-math is NOT transforming it.
                    // CAUSE: remark-math requires specific spacing or configuration, 
                    // OR the $ are escaped like \$ in the source.

                    // Unescape string keys if they were double escaped
                    processed = processed.replace(/\\\$/g, '$');

                    return processed;
                };

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
                    const qs = exam.questions;
                    let newSections = [];
                    let newQs = {};


                    // Strategy 1: Group by 'tags.subject' or 'subject' key if present in data
                    // Check if *any* question has a subject defined
                    const hasSubject = qs.some(q => q.subject || (q.tags && q.tags.subject));

                    if (hasSubject) {
                        qs.forEach(q => {
                            // Normalize subject source
                            const sub = q.subject || (q.tags && q.tags.subject) || 'General';

                            // Capitalize first letter for consistency
                            const safeSub = sub.charAt(0).toUpperCase() + sub.slice(1);

                            if (!newQs[safeSub]) {
                                newQs[safeSub] = [];
                            }
                            // Add to section list if new
                            if (newSections.indexOf(safeSub) === -1) {
                                newSections.push(safeSub);
                            }

                            newQs[safeSub].push(q);
                        });

                        // Force update active section to first available if current default 'Physics' doesn't exist
                        if (newSections.length > 0 && newSections.indexOf('Physics') === -1) {
                            // This side-effect needs to be handled in useEffect, but we'll set default state logic later
                            // For now, let the component render cycle handle it or default to first section
                        }
                    }
                    // Strategy 2: Standard NEET Split (180 Qs -> 45 each)
                    else if (qs.length === 180) {
                        newSections = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
                        newQs['Physics'] = qs.slice(0, 45);
                        newQs['Chemistry'] = qs.slice(45, 90);
                        newQs['Botany'] = qs.slice(90, 135);
                        newQs['Zoology'] = qs.slice(135, 180);
                    }
                    // Strategy 3: Standard NEET New Pattern (200 Qs -> 50 each)
                    else if (qs.length === 200) {
                        newSections = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
                        newQs['Physics'] = qs.slice(0, 50);
                        newQs['Chemistry'] = qs.slice(50, 100);
                        newQs['Botany'] = qs.slice(100, 150);
                        newQs['Zoology'] = qs.slice(150, 200);
                    }
                    // Strategy 4: Fallback
                    else {
                        newSections = ['General'];
                        newQs['General'] = qs;
                    }


                    exam.sections = newSections;
                    exam.questions = newQs;

                    // Set active section to first available if not default
                    if (newSections.length > 0 && newSections.indexOf('Physics') === -1) {
                        // We need to update the state, but we are in logic processing.
                        // Ideally checking if activeSection is valid, else switch.
                        // Since this runs in useEffect, we can force a state update if needed, but activeSection is state.
                        // Better approach: Derived state or effect later?
                        // Let's just mutate the logic here to match activeSection if possible? No.
                        // We will add a check in render or another useEffect to reset activeSection if invalid.
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

    // Math Preprocessor
    const preprocessContent = (text) => {
        if (text === null || text === undefined) return "";

        // Ensure text is a string to prevent .replace errors
        let processed = String(text);

        // Strategy: Protect existing math tokens first, then process plain text, then restore.
        const tokens = [];
        const generateToken = (idx) => `__MATH_TOKEN_${idx}__`;

        // 1. Extract existing LaTeX delimiters \( ... \) and $ ... $
        // Normalize everything to $...$ for our manual renderer
        processed = processed.replace(/(\\\(.*?\\\)|\\\[.*?\\\]|\$.*?\$)/g, (match) => {
            const token = generateToken(tokens.length);
            let normalized = match;
            if (match.startsWith('\\(') && match.endsWith('\\)')) normalized = '$' + match.slice(2, -2) + '$';
            if (match.startsWith('\\[') && match.endsWith('\\]')) normalized = '$' + match.slice(2, -2) + '$';
            tokens.push(normalized);
            return token;
        });

        // 2. Handle Greek Letters written as text (e.g. "lambda", "pi")
        // Use $ ... $ for manual renderer
        const greekMap = ['alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda', 'pi', 'sigma', 'omega', 'mu', 'nu', 'rho', 'tau', 'epsilon'];
        const greekRegex = new RegExp(`\\\\b(${greekMap.join('|')})\\\\b`, 'gi');
        processed = processed.replace(greekRegex, (match) => {
            if (match.includes('__MATH_TOKEN_')) return match;
            return `$${match.toLowerCase()}$`;
        });

        // SPECIAL FIX: Unescape literal `$\omega$` or `\$omega`
        // Convert explicitly broken `$\omega$` patterns to `\(\omega\)`
        // If we see `$\word$` where word is greek, force it.
        processed = processed.replace(/\$\s*\\?(\w+)\s*\$/g, (match, word) => {
            const lower = word.toLowerCase();
            if (greekMap.includes(lower)) return `$${lower}$`;
            return match;
        });

        // Genric Unescape: Convert `\$` to `$` (just in case)
        processed = processed.replace(/\\\$/g, '$');

        // 3. Handle Integrals and Sums appearing as raw text "\int" or "\sum"
        processed = processed.replace(/(\\int.*?dx|\\int[^=]+=[^$]+|s\s*=\s*\\int.*)/gi, (match) => {
            if (match.includes('__MATH_TOKEN_')) return match;
            return `$${match}$`;
        });


        // 3.5. Detect Full Equations: "P = V0 I0", "v = 3t^2", "v = u + at"
        processed = processed.replace(/\b([a-zA-Z])\s*=\s*([0-9a-zA-Z\s\+\-\^._\\{}]+(?:\s?\(.*?\))?)/g, (match) => {
            if (match.includes('__MATH_TOKEN_')) return match;
            if (match.includes('$') || match.includes('\\(')) return match; // Already has math delimiters

            // Verify it looks like math (has =, +, -, ^, or variable assignment)
            if (!/[=+\-^]/.test(match)) return match;

            const token = generateToken(tokens.length);
            tokens.push(`$${match}$`);
            return token;
        });

        // 4. Handle Complex Ions/Charges: CO3^2-, PO4^3-, O^2-
        // Pattern: Formula + optional ^ + number + sign
        processed = processed.replace(/\b([A-Z][a-z]?\d*)\^?(\d*[+-])\b/g, (match, formula, charge) => {
            if (match.includes('__MATH_TOKEN_')) return match;
            const fmtFormula = formula.replace(/(\d+)/g, '_{$1}');
            return `$${fmtFormula}^{${charge}}$`;
        });

        // 6. Detect Chemical Species with Coefficients and States: 3H2(g)
        processed = processed.replace(/\b(\d*)([A-Z][a-zA-Z0-9]*)(\((?:g|l|s|aq)\))?/g, (match, coeff, formula, state) => {
            if (match.includes('__MATH_TOKEN_')) return match;
            const hasNumber = /\d/.test(formula);
            const hasState = !!state;
            if (!hasNumber && !hasState) return match;

            const fmtFormula = formula.replace(/(\d+)/g, '_{$1}');
            const part1 = coeff ? coeff : '';
            const part3 = state ? state : '';
            return `$${part1}${fmtFormula}${part3}$`;
        });

        // 7. Handle Simple Chemical Formulas (fallback)
        processed = processed.replace(/\b(?=[A-Za-z]*\d)[A-Z][A-Za-z0-9]*\b/g, (match) => {
            if (match.includes('__MATH_TOKEN_') || match.includes('$')) return match;
            if (match.length > 10) return match;
            const formatted = match.replace(/(\d+)/g, '_{$1}');
            return `$${formatted}$`;
        });

        // 8. Handle implicit math with carets (e.g., m/s^2, 10^5, h/lambda^2)
        processed = processed.replace(/([a-zA-Z0-9/]+\^[a-zA-Z0-9-]+)/g, (match) => {
            if (match.includes('__MATH_TOKEN_')) return match;
            return `$${match}$`;
        });

        // 9. Restore tokens
        tokens.forEach((tokenVal, idx) => {
            processed = processed.replace(generateToken(idx), tokenVal);
        });

        return processed;
    };

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
