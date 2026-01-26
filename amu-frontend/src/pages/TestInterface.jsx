import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import testData from '../data/amu_test_content.json';
import '../App.css'; // Ensure we have styles

const TestInterface = () => {
    const { testId } = useParams(); // For now, we ignore ID and show static content
    const navigate = useNavigate();
    
    // State
    const [test, setTest] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
    const [visited, setVisited] = useState({}); // { questionIndex: true }
    const [marked, setMarked] = useState({}); // { questionIndex: true }
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

    // Initial Load
    useEffect(() => {
        // Simulate Fetching
        if (testData && testData.test) {
            setTest(testData.test);
            setTimeLeft(testData.test.duration * 60);
            setVisited({ 0: true });
        }
    }, []);

    // Timer Logic
    useEffect(() => {
        if (timeLeft > 0 && !isSubmitted) {
            const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timerId);
        } else if (timeLeft === 0 && !isSubmitted && test) {
            submitTest();
        }
    }, [timeLeft, isSubmitted, test]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Navigation
    const handleNext = () => {
        if (currentQuestionIndex < test.questions.length - 1) {
            const nextIdx = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIdx);
            setVisited(prev => ({ ...prev, [nextIdx]: true }));
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleJump = (idx) => {
        setCurrentQuestionIndex(idx);
        setVisited(prev => ({ ...prev, [idx]: true }));
    };

    // Answering
    const handleOptionSelect = (optionIndex) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    };

    const handleClearResponse = () => {
        const newAnswers = { ...answers };
        delete newAnswers[currentQuestionIndex];
        setAnswers(newAnswers);
    };

    const handleMarkReview = () => {
        if (marked[currentQuestionIndex]) {
            const newMarked = { ...marked };
            delete newMarked[currentQuestionIndex];
            setMarked(newMarked);
        } else {
            setMarked(prev => ({ ...prev, [currentQuestionIndex]: true }));
        }
        handleNext();
    };

    // Submission
    const submitTest = () => {
        setIsSubmitted(true);
        window.alert("Test Submitted! (Check console for raw result object)");
        console.log("Answers:", answers);
        // Calculate Score locally for demo
        let score = 0;
        test.questions.forEach((q, idx) => {
            const userAns = answers[idx];
            if (userAns !== undefined) {
               // Assuming userAns is 0-based index and options are also 0-based in array
               // Check if the chosen option is correct
               // content.json options have "isCorrect"
               if (q.options[userAns].isCorrect) {
                   score += 1;
               } else {
                   score -= 0.25;
               }
            }
        });
        alert(`You scored: ${score} / ${test.questions.length}`);
        navigate('/dashboard');
    };


    if (!test) return <div style={{padding:'20px'}}>Loading Test...</div>;

    const currentQuestion = test.questions[currentQuestionIndex];

    // Helpers for Palette Colors
    const getPaletteClass = (idx) => {
        if (currentQuestionIndex === idx) return 'palette-btn current'; // Cursor
        if (marked[idx]) return 'palette-btn marked';
        if (answers[idx] !== undefined) return 'palette-btn answered';
        if (visited[idx]) return 'palette-btn not-answered'; // Visited but no answer
        return 'palette-btn not-visited';
    };

    return (
        <div className="test-interface">
            {/* Header */}
            <header className="test-header">
                <div className="test-title">
                    <h3>{test.title}</h3>
                </div>
                <div className="test-timer">
                    Time Left: <span className={timeLeft < 600 ? 'urgent' : ''}>{formatTime(timeLeft)}</span>
                </div>
                <div className="user-info">
                   Student
                </div>
            </header>

            {/* Main Content */}
            <div className="test-container">
                {/* Left: Question Area */}
                <div className="question-area">
                    <div className="question-header">
                        <span>Question {currentQuestionIndex + 1}</span>
                        <span className="q-tag">{currentQuestion.tags?.subject}</span>
                    </div>

                    <div className="question-text">
                        {currentQuestion.statement}
                    </div>

                    <div className="options-list">
                        {currentQuestion.options.map((opt, idx) => (
                            <label key={idx} className={`option-item ${answers[currentQuestionIndex] === idx ? 'selected' : ''}`}>
                                <input 
                                    type="radio" 
                                    name={`q-${currentQuestionIndex}`} 
                                    checked={answers[currentQuestionIndex] === idx}
                                    onChange={() => handleOptionSelect(idx)}
                                />
                                <span className="opt-label">{String.fromCharCode(65+idx)}.</span>
                                <span className="opt-text">{opt.text}</span>
                            </label>
                        ))}
                    </div>
                    
                    <div className="q-actions-footer">
                        <button className="btn-secondary" onClick={handlePrev} disabled={currentQuestionIndex === 0}>Previous</button>
                        <button className="btn-warning" onClick={handleClearResponse}>Clear Response</button>
                        <button className="btn-purple" onClick={handleMarkReview}>Mark for Review & Next</button>
                        <button className="btn-primary" onClick={handleNext} disabled={currentQuestionIndex === test.questions.length - 1}>Save & Next</button>
                    </div>
                </div>

                {/* Right: Palette */}
                <div className="question-palette-panel">
                    <div className="palette-info">
                        <div><span className="dot answered"></span> Answered</div>
                        <div><span className="dot not-answered"></span> Not Answered</div>
                        <div><span className="dot not-visited"></span> Not Visited</div>
                        <div><span className="dot marked"></span> Marked for Review</div>
                    </div>
                    
                    <div className="palette-grid">
                        {test.questions.map((_, idx) => (
                             <button 
                                key={idx} 
                                className={getPaletteClass(idx)}
                                onClick={() => handleJump(idx)}
                             >
                                 {idx + 1}
                             </button>
                        ))}
                    </div>

                    <div className="submit-section">
                        <button className="btn-submit" onClick={() => setShowConfirmSubmit(true)}>Submit Test</button>
                    </div>
                </div>
            </div>

            {/* Submit Modal */}
            {showConfirmSubmit && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Submission</h3>
                        <p>Are you sure you want to submit the test?</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowConfirmSubmit(false)}>Cancel</button>
                            <button className="btn-danger" onClick={submitTest}>Yes, Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestInterface;
