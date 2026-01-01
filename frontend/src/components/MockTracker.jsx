import React, { useState, useEffect, useMemo } from 'react';
import TestArchive from './TestArchive';
import { useNavigate } from 'react-router-dom';
import { fetchMockTests, addMockTest, deleteMockTest, fetchMarksRankHistory } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl text-xs">
                <p className="font-bold text-slate-800 mb-1">{data.testName}</p>
                <p className="text-slate-500 mb-2">{new Date(data.date).toLocaleDateString()}</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                        <span className="text-slate-600">Score:</span>
                        <span className="font-bold text-slate-900">{data.score}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span className="text-slate-600">Est. Rank:</span>
                        <span className="font-bold text-blue-600">#{data.predictedRank?.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function MockTracker({ user }) {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marksData, setMarksData] = useState([]);
    const [targetRank, setTargetRank] = useState(() => {
        return localStorage.getItem(`target_rank_${user?.uid}`) || '';
    });

    const [formData, setFormData] = useState({ testName: '', score: '', date: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const [testsResp, marksResp] = await Promise.all([
                fetchMockTests(token),
                fetchMarksRankHistory() // Fetch prediction data
            ]);

            if (testsResp.ok) setTests(testsResp.tests || []);

            // Fix: Handle direct array response from fetch vs {data: ...}
            if (Array.isArray(marksResp)) {
                setMarksData(marksResp);
            } else if (marksResp && Array.isArray(marksResp.data)) {
                setMarksData(marksResp.data);
            }

        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    // --- Predictive Helpers ---
    const getRankForScore = (score) => {
        if (!marksData || marksData.length === 0) return null;
        const s = parseInt(score);
        if (isNaN(s)) return null;

        // Ensure robust comparison (handle string/number differences in marksData)
        const row = marksData.find(r => parseInt(r.marks) === s);

        let rank = null;
        if (row) {
            // NOTE: 2025 column in current dataset appears corrupted/placeholder (e.g. 464 for 620 marks).
            // Fallback to 2024 for realistic prediction.
            rank = row['2024'] || row['2023'];
        } else {
            // Closest approx
            const closest = marksData.reduce((prev, curr) => {
                return (Math.abs(parseInt(curr.marks) - s) < Math.abs(parseInt(prev.marks) - s) ? curr : prev);
            });
            rank = closest ? (closest['2024'] || closest['2023']) : null;
        }

        // Return number content
        return typeof rank === 'string' ? parseInt(rank.replace(/,/g, '')) : rank;
    };

    const getScoreForRank = (targetRank) => {
        if (!marksData || marksData.length === 0 || !targetRank) return null;
        const t = parseInt(targetRank);
        const closest = marksData.reduce((prev, curr) => {
            // Skip 2025 here too
            const prevRank = parseInt((prev['2024'] || prev['2023'] || '999999').toString().replace(/,/g, ''));
            const currRank = parseInt((curr['2024'] || curr['2023'] || '999999').toString().replace(/,/g, ''));
            return (Math.abs(currRank - t) < Math.abs(prevRank - t) ? curr : prev);
        });
        return closest ? parseInt(closest.marks) : null;
    };

    // --- Computed Stats ---
    const processedTests = useMemo(() => {
        return tests.map(t => ({
            ...t,
            predictedRank: getRankForScore(t.score),
            dateObj: new Date(t.date || Date.now())
        })).sort((a, b) => a.dateObj - b.dateObj);
    }, [tests, marksData]);

    const stats = useMemo(() => {
        if (processedTests.length === 0) return null;
        const scores = processedTests.map(t => parseInt(t.score));
        const maxScore = Math.max(...scores);
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        // Current Rank (Average of last 3 tests)
        const last3 = processedTests.slice(-3);
        const avgLast3Score = Math.round(last3.reduce((a, t) => a + parseInt(t.score), 0) / last3.length);
        const currentRank = getRankForScore(avgLast3Score) || 0;

        return { maxScore, avgScore, currentRank, avgLast3Score };
    }, [processedTests, marksData]);

    const gapAnalysis = useMemo(() => {
        if (!targetRank || !stats) return null;
        const targetInt = parseInt(targetRank);
        const neededScore = getScoreForRank(targetInt);
        const scoreGap = neededScore - stats.avgLast3Score;

        return {
            neededScore,
            scoreGap,
            status: scoreGap <= 0 ? 'achieved' : 'pending'
        };
    }, [targetRank, stats, marksData]);


    // --- Handlers ---
    const handleSaveTarget = () => {
        localStorage.setItem(`target_rank_${user.uid}`, targetRank);
        alert("Target Rank Updated!");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            await addMockTest(formData, token);
            setFormData({ testName: '', score: '', date: '' });
            // Reload specific test list only to be faster, but loadData() works
            const res = await fetchMockTests(token);
            if (res.ok) setTests(res.tests || []);
        } catch (err) {
            alert("Failed: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this record?")) return;
        try {
            const token = await user.getIdToken();
            await deleteMockTest(id, token);
            const res = await fetchMockTests(token);
            if (res.ok) setTests(res.tests || []);
        } catch (err) {
            alert("Failed: " + err.message);
        }
    };

    if (loading && tests.length === 0) return <div className="p-10 text-center">Loading Performance Data...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* 1. Header & Target Setting */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">🚀 Performance Center</h2>
                    <p className="text-slate-500 text-sm">Track your Mock Tests & Analyze Improvement</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Target Rank:</span>
                    <input
                        type="number"
                        value={targetRank}
                        onChange={(e) => setTargetRank(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-24 bg-white border border-blue-200 rounded px-2 py-1 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        onClick={handleSaveTarget}
                        className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-blue-700"
                    >
                        Set
                    </button>
                </div>
            </div>

            {/* 2. Stats & Gap Analysis Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Standing */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Current Predicted Rank</span>
                        <div className="text-3xl font-black text-slate-800">
                            #{stats.currentRank.toLocaleString()}
                        </div>
                        <span className="text-xs text-slate-500 mt-1">Based on last 3 tests avg ({stats.avgLast3Score})</span>
                    </div>

                    {/* Best Score */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Best Score</span>
                        <div className="text-3xl font-black text-green-600">
                            {stats.maxScore}
                        </div>
                        <span className="text-xs text-slate-500 mt-1">Avg Score: {stats.avgScore}</span>
                    </div>

                    {/* Gap Analysis */}
                    <div className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden ${gapAnalysis?.status === 'achieved' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                        {targetRank ? (
                            <>
                                <span className={gapAnalysis.status === 'achieved' ? "text-green-600 font-bold text-xs uppercase" : "text-orange-600 font-bold text-xs uppercase"}>
                                    {gapAnalysis.status === 'achieved' ? 'Target Achieved! 🎉' : 'Improvement Needed 🎯'}
                                </span>
                                {gapAnalysis.status !== 'achieved' ? (
                                    <>
                                        <div className="text-3xl font-black text-orange-600">
                                            +{gapAnalysis.scoreGap} Marks
                                        </div>
                                        <span className="text-xs text-orange-800 mt-1">
                                            Need <strong>{gapAnalysis.neededScore}</strong> to reach Rank #{targetRank}
                                        </span>
                                    </>
                                ) : (
                                    <div className="text-green-700 text-sm font-medium mt-1">
                                        You are on track to beat your target!
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-slate-400 text-sm">Set a Target Rank to see Gap Analysis</div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Improvement Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                    📈 Rank Improvement Trend <span className="text-xs font-normal text-slate-400">(Lower is Better)</span>
                </h3>
                <div className="h-64 w-full">
                    {processedTests.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processedTests} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    stroke="#94a3b8"
                                    fontSize={12}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    reversed={true} // Rank: Lower is higher up
                                    label={{ value: 'Predicted Rank', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="predictedRank"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                                {targetRank && (
                                    <ReferenceLine y={parseInt(targetRank)} stroke="green" strokeDasharray="3 3" label="Target" />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <span className="text-2xl mb-2">📊</span>
                            <p>Add at least 2 mock tests to see your improvement trend.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Add New Test Form (Collapsed/Compact) */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">➕ Log New Test</h3>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-end">
                    <input
                        type="text"
                        required
                        placeholder="Test Name (e.g. Major Test 5)"
                        className="flex-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                        value={formData.testName}
                        onChange={e => setFormData({ ...formData, testName: e.target.value })}
                    />
                    <input
                        type="number"
                        required
                        placeholder="Score (720)"
                        min="0"
                        max="720"
                        className="w-full md:w-32 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                        value={formData.score}
                        onChange={e => setFormData({ ...formData, score: e.target.value })}
                    />
                    <input
                        type="date"
                        className="w-full md:w-40 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full md:w-auto px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                        {submitting ? '...' : 'Add'}
                    </button>
                </form>
            </div>

            {/* 5. History List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 text-sm">
                    📜 Test History
                </div>
                <div className="divide-y divide-slate-100">
                    {processedTests.map((test) => (
                        <div key={test.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-sm border ${test.score >= 600 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                    <span>{test.score}</span>
                                    <span className="text-[10px] uppercase font-normal text-slate-400">Marks</span>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{test.testName}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span>📅 {new Date(test.date).toLocaleDateString()}</span>
                                        {test.predictedRank && (
                                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                Est. Rank #{test.predictedRank.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                {test.testId && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/test-solution/${test.id}`)}
                                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 font-medium bg-blue-50 hover:bg-blue-100 rounded"
                                        >
                                            View Solutions
                                        </button>
                                        <button
                                            onClick={() => navigate(`/exam-engine/${test.testId}`)}
                                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 font-medium bg-blue-50 hover:bg-blue-100 rounded"
                                        >
                                            Retake
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                    </>
                                )}
                                <button
                                    onClick={() => handleDelete(test.id)}
                                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 font-medium hover:bg-red-50 rounded"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    {processedTests.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">No tests recorded yet.</div>
                    )}
                </div>
            </div>

            {/* 6. Legacy Archive */}
            <TestArchive />
        </div>
    );
}
