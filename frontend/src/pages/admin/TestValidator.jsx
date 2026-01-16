import React, { useState } from 'react';
import LatexRenderer from '../../components/LatexRenderer';
import { preprocessContent, groupQuestionsIntoSections } from '../../utils/examUtils';
import { getApiBase } from '../../apiConfig';

const AdminTestValidator = () => {
    const [manualText, setManualText] = useState("");
    const [testId, setTestId] = useState("");
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLoadTest = async () => {
        if (!testId) return;
        setLoading(true);
        setError("");
        setExamData(null);

        try {
            const res = await fetch(`${getApiBase()}/api/test-series/${testId}`);
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
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        <strong>Processed Internal String:</strong><br />
                        <code>{preprocessContent(manualText)}</code>
                    </div>
                </div>
            </div>

            <hr />

            <div style={{ marginTop: '20px' }}>
                <h3>Test Scanner</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={testId}
                        onChange={(e) => setTestId(e.target.value)}
                        placeholder="Enter Test ID"
                        style={{ padding: '8px', width: '300px' }}
                    />
                    <button onClick={handleLoadTest} style={{ padding: '8px 16px', cursor: 'pointer' }}>Load Test</button>
                </div>

                {loading && <div>Loading...</div>}
                {error && <div style={{ color: 'red' }}>Error: {error}</div>}

                {examData && (
                    <div>
                        <h4>Test Title: {examData.title}</h4>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            {examData.sections && examData.sections.length > 0 ? (
                                examData.sections.map(sec => (
                                    <div key={sec} style={{ padding: '5px 10px', background: '#e0f2fe', borderRadius: '4px' }}>
                                        {sec}: {examData.questions[sec].length} Qs
                                    </div>
                                ))
                            ) : (
                                <div>No sections detected (Flat list)</div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {examData.sections ? examData.sections.map(sec => (
                                <div key={sec}>
                                    <h4 style={{ background: '#eee', padding: '10px' }}>Section: {sec}</h4>
                                    {examData.questions[sec].map((q, idx) => (
                                        <div key={idx} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Q{idx + 1}:</div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <LatexRenderer>{preprocessContent(q.question)}</LatexRenderer>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} style={{ padding: '5px', background: '#fdfdfd', border: '1px solid #eee' }}>
                                                        ({oIdx + 1}) <LatexRenderer>{preprocessContent(opt.text || opt)}</LatexRenderer>
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
