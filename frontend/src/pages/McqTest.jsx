import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import axios from 'axios';
import './McqTest.css';

const McqTest = ({ subject = 'chemistry' }) => {
  const { filename } = useParams();
  const navigate = useNavigate();

  const baseUrl = subject === 'physics'
    ? 'http://localhost:5000/api/physics-pyq'
    : 'http://localhost:5000/api/chemistry-pyq';

  // State
  const [questionCount, setQuestionCount] = useState(45);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState('questions'); // 'questions', 'key', 'interactive'
  const [parsedData, setParsedData] = useState(null);

  useEffect(() => {
    // Check if parsed data exists
    const checkParsed = async () => {
      try {
        const res = await axios.get(`${baseUrl}/${filename}/parsed`);
        if (res.data.ok) {
          setParsedData(res.data.data);
          // Optional: Auto-switch to interactive if available? No, let user choose.
        }
      } catch (err) {
        console.log("No parsed data found");
      }
    };
    checkParsed();
  }, [filename, baseUrl]);

  const handleSelect = (qIndex, option) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    if (!window.confirm("Are you sure you want to submit? You can't change answers after this.")) return;
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  // URLs
  // The filename is already the clean PDF (e.g., "AMINES_New_Clean.pdf")
  // So we just fetch it directly. The legacy route masks footers but our clean PDF is already clean.
  const questionsUrl = `${baseUrl}/${filename}`;
  // Key URL might not be relevant for clean PDFs as they don't have the key page appended usually.
  // But we can keep it if we want to support legacy behavior or just hide the button.
  const keyUrl = `${baseUrl}/${filename}/key`;

  const currentPdfUrl = viewMode === 'key' ? keyUrl : questionsUrl;

  const backPath = subject === 'physics' ? '/physics-pyq' : '/chemistry-pyq';

  return (
    <div className="mcq-test-container">
      {/* Left Panel: Content (PDF or Interactive) */}
      <div className="pdf-panel">
        <div className="panel-header">
          <button className="back-btn" onClick={() => navigate(backPath)}>← Back</button>
          <h2 title={filename}>{filename.split('-')[0].trim()}...</h2>

          <div className="view-toggles">
            <button
              className={`toggle-btn ${viewMode === 'questions' ? 'active' : ''}`}
              onClick={() => setViewMode('questions')}
            >
              📄 PDF
            </button>

            <button
              className={`toggle-btn ${viewMode === 'interactive' ? 'active' : ''} ${!parsedData ? 'disabled' : ''}`}
              onClick={() => parsedData && setViewMode('interactive')}
              disabled={!parsedData}
              title={parsedData ? "Switch to Interactive Quiz" : "Interactive mode not available for this chapter"}
            >
              ✨ Interactive
            </button>

            {isSubmitted && (
              <button
                className={`toggle-btn ${viewMode === 'key' ? 'active' : ''}`}
                onClick={() => setViewMode('key')}
              >
                🔑 Answer Key
              </button>
            )}
          </div>
        </div>

        <div className="content-frame-wrapper">
          {viewMode === 'interactive' && parsedData ? (
            <div className="interactive-mode">
              {parsedData.map((q, idx) => (
                <div key={q.id} className="interactive-q-card">
                  <div className="q-text">
                    <span className="q-idx">{idx + 1}.</span>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {q.question}
                    </ReactMarkdown>
                  </div>
                  <div className="q-options">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="q-option">
                        <div className="opt-label">{String.fromCharCode(65 + optIdx)}.</div>
                        <div className="opt-content">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {opt}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                  {isSubmitted && (
                    <div className="q-solution">
                      <strong>Correct Answer: {String.fromCharCode(65 + q.correctAnswer)}</strong>
                      <p>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {q.solution}
                        </ReactMarkdown>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <iframe
              src={currentPdfUrl}
              title="Viewer"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          )}
        </div>
      </div>

      {/* Right Panel: OMR Sheet */}
      <div className="omr-panel">
        {/* Configuration Header */}
        <div className="omr-header">
          {!isSubmitted ? (
            <div className="config-row">
              <label>Total Questions:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              />
            </div>
          ) : (
            <h3>Results</h3>
          )}
        </div>

        <div className="questions-list">
          {Array.from({ length: questionCount }, (_, i) => i + 1).map((qNum) => (
            <div key={qNum} className="question-row">
              <span className="q-num">{qNum}.</span>
              <div className="options-group">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <button
                    key={opt}
                    className={`omr-circle ${answers[qNum] === opt ? 'selected' : ''} ${isSubmitted ? 'disabled' : ''}`}
                    onClick={() => handleSelect(qNum, opt)}
                    disabled={isSubmitted}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="omr-footer">
          {!isSubmitted ? (
            <button className="submit-test-btn" onClick={handleSubmit}>
              Submit Test
            </button>
          ) : (
            <div className="results-summary">
              <h4>Attempted: {Object.keys(answers).length} / {questionCount}</h4>
              <p className="note">
                {viewMode === 'interactive' ? 'Solutions are shown above.' : 'Switch to "Answer Key" tab to cross-check.'}
              </p>
              <button
                className="reset-btn"
                onClick={() => { setIsSubmitted(false); setAnswers({}); setViewMode('questions'); }}
              >
                Reset / New Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default McqTest;
