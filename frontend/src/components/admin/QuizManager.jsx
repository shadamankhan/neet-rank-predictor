import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBase } from '../../apiConfig';
import { auth } from '../../firebase';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './QuizManager.css';

const QuizManager = () => {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState('');

    // Editing state
    const [editIndex, setEditIndex] = useState(-1);
    const [editQ, setEditQ] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await axios.get(`${getApiBase()}/api/admin/quiz`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.ok) {
                setFiles(res.data.files);
            }
        } catch (err) {
            setError('Failed to load quiz files');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadQuiz = async (filename) => {
        setLoading(true);
        setSelectedFile(filename);
        setError(null);
        setMsg('');
        setEditIndex(-1);
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await axios.get(`${getApiBase()}/api/admin/quiz/${filename}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.ok) {
                setQuestions(res.data.data);
            }
        } catch (err) {
            setError('Failed to load quiz content');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (index) => {
        setEditIndex(index);
        setEditQ({ ...questions[index] });
    };

    const handleCancel = () => {
        setEditIndex(-1);
        setEditQ(null);
    };

    const handleSaveQuestion = () => {
        const newQuestions = [...questions];
        newQuestions[editIndex] = editQ;
        setQuestions(newQuestions);
        setEditIndex(-1);
        setEditQ(null);
    };

    const handleDelete = (index) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            const newQuestions = questions.filter((_, i) => i !== index);
            setQuestions(newQuestions);
        }
    };

    const saveToServer = async () => {
        if (!selectedFile) return;
        setSaving(true);
        try {
            const token = await auth.currentUser.getIdToken();
            await axios.post(`${getApiBase()}/api/admin/quiz/${selectedFile}`, {
                data: questions
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMsg('Saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setError('Failed to save to server');
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setEditQ(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (idx, value) => {
        const newOpts = [...editQ.options];
        newOpts[idx] = value;
        setEditQ(prev => ({ ...prev, options: newOpts }));
    };

    const addNewQuestion = () => {
        const newQ = {
            id: Date.now(),
            question: "New Question",
            options: ["Option A", "Option B", "Option C", "Option D"],
            answer: 0,
            explanation: ""
        };
        const updatedQuestions = [...questions, newQ];
        setQuestions(updatedQuestions);
        setEditIndex(updatedQuestions.length - 1);
        setEditQ(newQ);
    };

    return (
        <div className="quiz-manager">
            <div className="qm-sidebar">
                <h3>Available Quizzes</h3>
                <div className="file-list">
                    {files.map(f => (
                        <div
                            key={f.filename}
                            className={`file-item ${selectedFile === f.filename ? 'active' : ''}`}
                            onClick={() => loadQuiz(f.filename)}
                        >
                            {f.displayName}
                        </div>
                    ))}
                </div>
            </div>

            <div className="qm-content">
                {!selectedFile ? (
                    <div className="empty-state">Select a file to edit</div>
                ) : (
                    <>
                        <div className="qm-header">
                            <h2>Editing: {selectedFile}</h2>
                            <div className="qm-actions">
                                <button className="add-btn" onClick={addNewQuestion}>+ Add Question</button>
                                <button className="save-btn" onClick={saveToServer} disabled={saving}>
                                    {saving ? 'Saving...' : '💾 Save Changes'}
                                </button>
                            </div>
                            {msg && <div className="success-msg">{msg}</div>}
                            {error && <div className="error-msg">{error}</div>}
                        </div>

                        <div className="questions-list">
                            {questions.map((q, idx) => (
                                <div key={idx} className="qm-card">
                                    {editIndex === idx ? (
                                        <div className="editor-form">
                                            <label>Question Text (LaTeX supported):</label>
                                            <textarea
                                                value={editQ.question}
                                                onChange={e => handleFieldChange('question', e.target.value)}
                                                rows={3}
                                            />

                                            <label>Options:</label>
                                            {(editQ.options || []).map((opt, oIdx) => (
                                                <div key={oIdx} className="opt-row">
                                                    <span>{String.fromCharCode(65 + oIdx)}.</span>
                                                    <input
                                                        value={opt}
                                                        onChange={e => handleOptionChange(oIdx, e.target.value)}
                                                    />
                                                </div>
                                            ))}

                                            <div className="meta-row">
                                                <label>
                                                    Correct Answer:
                                                    <select
                                                        value={editQ.answer || 0}
                                                        onChange={e => handleFieldChange('answer', parseInt(e.target.value))}
                                                        style={{ marginLeft: '10px', padding: '5px', borderRadius: '4px' }}
                                                    >
                                                        <option value={0}>Option A</option>
                                                        <option value={1}>Option B</option>
                                                        <option value={2}>Option C</option>
                                                        <option value={3}>Option D</option>
                                                    </select>
                                                </label>
                                            </div>

                                            <label>Explanation / Hint (Optional):</label>
                                            <textarea
                                                value={editQ.explanation || ''}
                                                onChange={e => handleFieldChange('explanation', e.target.value)}
                                                rows={2}
                                                placeholder="Enter solution explanation or hint here..."
                                            />

                                            <div className="actions-row">
                                                <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                                                <button className="save-local-btn" onClick={handleSaveQuestion}>Done</button>
                                            </div>

                                            <div className="preview-box">
                                                <strong>Preview:</strong>
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {editQ.question}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="display-row">
                                            <div className="q-preview">
                                                <span className="q-num">{idx + 1}.</span>
                                                <div className="q-body">
                                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                        {q.question}
                                                    </ReactMarkdown>
                                                    <div className="q-opts-preview">
                                                        {(q.options || []).map((o, i) => (
                                                            <span key={i} className={i === q.answer ? 'correct' : ''}>
                                                                ({String.fromCharCode(97 + i)})
                                                                <span style={{ marginLeft: '4px' }}>
                                                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: 'span' }}>
                                                                        {o}
                                                                    </ReactMarkdown>
                                                                </span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {q.explanation && (
                                                        <div className="q-explanation-preview" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6366f1' }}>
                                                            <strong>Hint/Exp: </strong>
                                                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: 'span' }}>
                                                                {q.explanation}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="card-actions">
                                                <button onClick={() => handleEdit(idx)}>✏️</button>
                                                <button onClick={() => handleDelete(idx)} className="del-btn">🗑️</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuizManager;
