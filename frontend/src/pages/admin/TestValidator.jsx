import React, { useState, useEffect } from 'react';
import LatexRenderer from '../../components/LatexRenderer';
import { preprocessContent, groupQuestionsIntoSections } from '../../utils/examUtils';
import { getApiBase } from '../../apiConfig';

const AdminTestValidator = () => {
    const [manualText, setManualText] = useState("");
    const [testId, setTestId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [allTests, setAllTests] = useState([]);
    const [filteredTests, setFilteredTests] = useState([]);
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Parse Query Params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlTestId = params.get('testId');
        if (urlTestId) {
            setTestId(urlTestId);
            handleLoadTest(urlTestId);
        }
        fetchAllTests();
    }, []);

    // Filter tests based on search
    useEffect(() => {
        if (!searchQuery) {
            setFilteredTests([]);
            return;
        }
        const lower = searchQuery.toLowerCase();
        const matches = allTests.filter(t => t.title.toLowerCase().includes(lower));
        setFilteredTests(matches);
    }, [searchQuery, allTests]);

    const fetchAllTests = async () => {
        try {
            const res = await fetch(`${getApiBase()}/api/test-series`);
            const data = await res.json();
            if (data.ok) {
                setAllTests(data.tests);
            }
        } catch (err) {
            console.error("Failed to load test list", err);
        }
    };

    const handleLoadTest = async (idToLoad) => {
        const targetId = idToLoad || testId;
        if (!targetId) return;
        setLoading(true);
        setError("");
        setExamData(null);

        try {
            const res = await fetch(`${getApiBase()}/api/test-series/${targetId}`);
            const data = await res.json();

            if (!data.ok) throw new Error(data.message);

            const test = data.test;
            // Apply logic exactly as ExamEngine does
            if (Array.isArray(test.questions) && !test.sections) {
                const { sections, questions } = groupQuestionsIntoSections(test.questions);
                test.sections = sections;
                test.questions = questions;
            }
            setExamData(test);
            setTestId(targetId); // Ensure sync
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectTest = (test) => {
        setTestId(test._id);
        setSearchQuery(""); // Clear search
        setFilteredTests([]);
        handleLoadTest(test._id);
    };

    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editForm, setEditForm] = useState({ statement: "", options: [] });
    const [saving, setSaving] = useState(false);

    const handleEditClick = (q) => {
        setEditingQuestion(q);
        setEditForm({
            statement: q.statement || q.question || "",
            options: q.options.map(opt => (typeof opt === 'object' ? opt.text : opt))
        });
    };


    const handleSaveQuestion = async () => {
        if (!editingQuestion) return;
        setSaving(true);
        try {
            // Reconstruct options array preserving other fields if necessary, or just text for now
            // Assuming backend expects options as objects with {text: "..."} or just update text
            // The questions.js route updates 'options' field directly. 
            // We need to be careful not to lose 'isCorrect' or 'id'.
            // For safety, let's map back to original structure updating only text.

            const updatedOptions = editingQuestion.options.map((opt, idx) => ({
                ...opt,
                text: editForm.options[idx]
            }));

            const res = await fetch(`${getApiBase()}/api/questions/${editingQuestion._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    statement: editForm.statement,
                    options: updatedOptions
                })
            });

            const data = await res.json();
            if (data.ok) {
                // Refresh test data
                await handleLoadTest(testId);
                setEditingQuestion(null);
            } else {
                alert("Failed to save: " + data.message);
            }
        } catch (err) {
            alert("Error saving: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const autoFormatText = (text) => {
        if (!text) return "";
        let formatted = text;

        // 1. Clean Double Escaped Delimiters: \\( -> \(, \\) -> \)
        formatted = formatted.replace(/\\\\([()[\]])/g, '\\$1');

        // 2. Standardize Math Keywords: 0 or more backslashes -> exactly 1 backslash
        // Added: omega, mu, nu, rho, tau, sigma, phi, psi, chi, eta, epsilon
        formatted = formatted.replace(/\\*\b(sqrt|sin|cos|tan|cot|ln|log|exp|theta|alpha|beta|gamma|delta|pi|rho|Delta|lambda|omega|mu|nu|tau|sigma|phi|psi|chi|eta|epsilon)\b/g, '\\$1');

        // 2b. Specific Physics Constants: mu0 -> \mu_0, epsilon0 -> \epsilon_0
        formatted = formatted.replace(/\\*\bmu_?0\b/g, '\\mu_0');
        formatted = formatted.replace(/\\*\bepsilon_?0\b/g, '\\epsilon_0');
        
        // 3. Fix Multi-digit Exponents AND Negative Exponents: 10^20 -> 10^{20}, 10^-3 -> 10^{-3}
        // Captures ^ followed by optional minus and 2+ digits OR minus and 1+ digit
        // Regex logic:
        // - \^(-?\d{2,}) : Matches ^20, ^-20
        // - \^(-?\d+)    : Matches ^3, ^-3 (We want to be careful not to bracket single positive digits unless user wants consistency, but standard LaTeX doesn't strictly require it. 
        //   However, user asked for 10^{-3}. 
        //   Let's target specifically: ^ then (minus sign followed by any digits) OR (two or more digits)
        formatted = formatted.replace(/\^(-\d+|\d{2,})/g, '^{$1}');

        // 4. Fix Scientific Notation 'x': 2.5 x 10 -> 2.5 \times 10
        // Looks for digit, optional space, x, optional space, 10
        formatted = formatted.replace(/(\d)\s*x\s*10/gi, '$1 \\times 10');

        // 5. Wrap in delimiters if it looks like math but has none
        const isMathLike = /[\\^_]/.test(formatted);
        const hasDelimiters = /\$.*\$|\\\(.*\\\)|\\\[.*\\\]/.test(formatted);

        if (isMathLike && !hasDelimiters) {
            formatted = `\\(${formatted}\\)`;
        }
        return formatted;
    };

    const handleAutoFormat = () => {
        setEditForm({
            ...editForm,
            statement: autoFormatText(editForm.statement),
            options: editForm.options.map(opt => autoFormatText(opt))
        });
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', paddingBottom: '100px' }}>
            <h1>Admin Test Validator</h1>
            <p>Use this tool to verify how "Subject Logic" and "Math Rendering" will appear to students.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <h3>Manual Sandbox</h3>
                    <textarea
                        rows={10}
                        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Paste corrupted text here... e.g. vecF, sin x, DeltaV"
                    />
                </div>
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h3>Live Rendered Output</h3>
                    <div style={{ fontSize: '18px', padding: '10px', background: 'white', minHeight: '100px', border: '1px dashed #aaa' }}>
                        <LatexRenderer>{preprocessContent(manualText)}</LatexRenderer>
                    </div>
                </div>
            </div>

            <hr />

            <div style={{ marginTop: '20px' }}>
                <h3>Test Scanner</h3>

                {/* Search Bar */}
                <div style={{ marginBottom: '15px', position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Find Test by Name:</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type 'Oscillations'..."
                        style={{ padding: '8px', width: '400px', border: '1px solid #aaa', borderRadius: '4px' }}
                    />
                    {filteredTests.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 10,
                            background: 'white',
                            border: '1px solid #ccc',
                            width: '400px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            {filteredTests.map(t => (
                                <div
                                    key={t._id}
                                    onClick={() => selectTest(t)}
                                    style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                    onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                                    onMouseLeave={(e) => e.target.style.background = 'white'}
                                >
                                    {t.title}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                    <label>Or Enter ID:</label>
                    <input
                        type="text"
                        value={testId}
                        onChange={(e) => setTestId(e.target.value)}
                        placeholder="Enter Test ID"
                        style={{ padding: '8px', width: '300px' }}
                    />
                    <button onClick={() => handleLoadTest()} style={{ padding: '8px 16px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Load Test</button>
                </div>

                {loading && <div>Loading...</div>}
                {error && <div style={{ color: 'red' }}>Error: {error}</div>}

                {examData && (
                    <div style={{ marginTop: '20px' }}>
                        <h4 style={{ fontSize: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>Loaded: {examData.title}</h4>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            {examData.sections && examData.sections.length > 0 ? (
                                examData.sections.map(sec => (
                                    <div key={sec} style={{ padding: '5px 10px', background: '#e0f2fe', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                                        {sec}: {examData.questions[sec].length} Qs
                                    </div>
                                ))
                            ) : (
                                <div>No sections detected (Flat list)</div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {examData.sections ? examData.sections.map(sec => (
                                <div key={sec}>
                                    <h4 style={{ background: '#eee', padding: '10px', borderLeft: '5px solid #007bff' }}>Section: {sec}</h4>
                                    {examData.questions[sec].map((q, idx) => (
                                        <div key={idx} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
                                            <button
                                                onClick={() => handleEditClick(q)}
                                                style={{ position: 'absolute', top: '10px', right: '10px', padding: '5px 10px', background: '#9333ea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                ✎ Quick Edit
                                            </button>
                                            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>Q{idx + 1}:</div>
                                            <div style={{ marginBottom: '15px', fontSize: '16px' }}>
                                                <LatexRenderer>{preprocessContent(q.statement || q.question)}</LatexRenderer>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} style={{ padding: '10px', background: '#fdfdfd', border: '1px solid #eee', borderRadius: '4px' }}>
                                                        <strong style={{ marginRight: '5px' }}>({oIdx + 1})</strong>
                                                        <LatexRenderer>{preprocessContent(opt.text || opt)}</LatexRenderer>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )) : (
                                <div>No questions loaded.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Editing Modal */}
            {editingQuestion && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>Quick Edit Question</h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Question Statement (LaTeX Supported):</label>
                            <textarea
                                value={editForm.statement}
                                onChange={e => setEditForm({ ...editForm, statement: e.target.value })}
                                style={{ width: '100%', padding: '10px', minHeight: '100px', fontFamily: 'monospace' }}
                            />
                            <div style={{ marginTop: '5px', padding: '10px', background: '#f0f9ff', border: '1px dashed #0ea5e9' }}>
                                <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold' }}>Preview:</span>
                                <LatexRenderer>{preprocessContent(editForm.statement)}</LatexRenderer>
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifySelf: 'between', alignItems: 'center', marginBottom: '5px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold' }}>Options:</label>
                                <button
                                    onClick={handleAutoFormat}
                                    style={{ fontSize: '12px', padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}
                                >
                                    ✨ Auto-Format All
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {editForm.options.map((opt, idx) => (
                                    <div key={idx}>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...editForm.options];
                                                newOpts[idx] = e.target.value;
                                                setEditForm({ ...editForm, options: newOpts });
                                            }}
                                            style={{ width: '100%', padding: '8px', fontFamily: 'monospace' }}
                                        />
                                        <div style={{ marginTop: '2px', fontSize: '12px', color: '#666' }}>
                                            <LatexRenderer>{preprocessContent(opt)}</LatexRenderer>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => setEditingQuestion(null)}
                                style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveQuestion}
                                disabled={saving}
                                style={{ padding: '10px 20px', background: saving ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTestValidator;
