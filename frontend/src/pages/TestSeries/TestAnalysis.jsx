import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './TestAnalysis.css'; // Will create this

const TestAnalysis = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                // 'id' param here is the resultId returned from submit, NOT testId
                const res = await fetch(`http://localhost:5000/api/test-series/result/${id}`);
                const data = await res.json();
                if (data.ok) {
                    // Normalize data structure if needed to match UI expectations
                    // Backend returns: { score, totalMarks, accuracy, rank (missing), percentile (missing), subjectWise: { 'Subject': { score, total, status... } } }
                    // We need to calculate status/rank purely frontend side or ensure backend sends it.
                    // Backend sends: id, testName, score, totalMarks, correct, incorrect, attempted, accuracy, subjectWise, date

                    // Let's enhance subjectWise with status on frontend if missing
                    const enhancedSubjects = {};
                    if (data.result.subjectWise) {
                        Object.entries(data.result.subjectWise).forEach(([sub, subData]) => {
                            let status = 'Average';
                            const percentage = (subData.score / subData.total) * 100;
                            if (percentage >= 80) status = 'Strong';
                            else if (percentage < 50) status = 'Weak';

                            enhancedSubjects[sub] = { ...subData, status };
                        });
                    }

                    setResult({
                        ...data.result,
                        rank: Math.floor(Math.random() * 5000) + 1, // Mock Rank for now until global leaderboard
                        percentile: ((data.result.score / data.result.totalMarks) * 100).toFixed(1),
                        timeSpent: 'N/A', // Need to pass this or store it
                        subjectWise: enhancedSubjects
                    });
                } else {
                    alert("Failed to load results");
                }
            } catch (err) {
                console.error("Error loading result:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchResult();
    }, [id]);

    if (loading) return <div className="analysis-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Generating Report...</div>;
    if (!result) return <div className="analysis-container">Result not found.</div>;

    // COLLEGE PREDICTION ALGORITHM (Simple Version)
    const getCollegePrediction = (score) => {
        if (score >= 650) return {
            chance: 'Very High',
            tier: 'Top Govt Colleges (AIIMS/MAMC)',
            color: 'green',
            msg: 'Excellent! You are on track for top-tier government seats.'
        };
        if (score >= 600) return {
            chance: 'High',
            tier: 'Govt MBBS (State Quota)',
            color: 'teal',
            msg: 'Good job! You have a strong chance for Govt seats.'
        };
        if (score >= 500) return {
            chance: 'Moderate',
            tier: 'Private MBBS (State Quota) / Top BDS',
            color: 'orange',
            msg: 'You can get good Private colleges. Push +100 marks for Govt.'
        };
        if (score >= 400) return {
            chance: 'Low for Govt',
            tier: 'Deemed Universities / Private (Mgmt)',
            color: 'red',
            msg: 'Focus on improving weak areas. Govt seat is difficult at this score.'
        };
        return {
            chance: 'Very Low',
            tier: 'Paid Seats / BDS / BAMS',
            color: 'red',
            msg: 'Need significant improvement. Analyze weak chapters thoroughly.'
        };
    };

    const prediction = getCollegePrediction(result.score);

    return (
        <div className="analysis-container">
            <header className="analysis-header">
                <button onClick={() => navigate('/test-series')} className="back-btn">← Back to Dashboard</button>
                <h1>Test Analysis & Report</h1>
            </header>

            <div className="analysis-grid">
                {/* 1. Score Card (Main Stat) */}
                <div className="score-card main-card">
                    <div className="score-circle">
                        <span className="score-val">{result.score}</span>
                        <span className="score-total">/ 720</span>
                    </div>
                    <div className="rank-info">
                        <h3>AIR (Est) #{result.rank.toLocaleString()}</h3>
                        <p>Percentile: {result.percentile}%</p>
                    </div>
                    <div className="accuracy-badge">
                        <span>🎯 Accuracy: {result.accuracy}%</span>
                    </div>
                </div>

                {/* 2. THE KILLER FEATURE: College Prediction */}
                <div className={`prediction-card ${prediction.color}`}>
                    <div className="pred-header">
                        <span className="sparkle">✨</span>
                        <h2>College Predictor</h2>
                    </div>
                    <p className="pred-subtitle">Based on this score ({result.score}), your admission chances:</p>

                    <div className="pred-result">
                        <span className="pred-tier">{prediction.tier}</span>
                        <span className="pred-chance">{prediction.chance} Chance</span>
                    </div>

                    <p className="pred-advice">💡 {prediction.msg}</p>

                    <div className="college-cta">
                        <button className="btn-counsellor" onClick={() => navigate('/predict')}>View Detailed College List</button>
                    </div>
                </div>

                {/* 3. Subject Wise Breakdown */}
                <div className="subject-card">
                    <h3>Subject Performance</h3>
                    <div className="subject-list">
                        {Object.entries(result.subjectWise).map(([sub, data]) => (
                            <div key={sub} className="subject-row">
                                <div className="sub-name">
                                    <span className="name">{sub}</span>
                                    <span className={`status-badge ${data.status.toLowerCase()}`}>{data.status}</span>
                                </div>
                                <div className="sub-bar-container">
                                    <div className="sub-bar-fill" style={{ width: `${(data.score / data.total) * 100}%`, background: data.status === 'Weak' ? '#f87171' : '#4ade80' }}></div>
                                </div>
                                <div className="sub-score">
                                    {data.score} <span className="text-muted">/ {data.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Action Area */}
            <div className="analysis-actions">
                <button className="btn-solutions" onClick={() => navigate(`/test-solution/${id}`)}>View Solutions</button>
                <button className="btn-retest" onClick={() => {
                    if (result.testId) navigate(`/exam-engine/${result.testId}`);
                    else alert("Test ID not found for retake.");
                }}>Retake Test</button>
            </div>
        </div>
    );
};

export default TestAnalysis;
