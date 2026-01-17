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

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
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
                                        <div key={idx} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>Q{idx + 1}:</div>
                                            <div style={{ marginBottom: '15px', fontSize: '16px' }}>
                                                <LatexRenderer>{preprocessContent(q.question)}</LatexRenderer>
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
        </div>
    );
};

export default AdminTestValidator;
