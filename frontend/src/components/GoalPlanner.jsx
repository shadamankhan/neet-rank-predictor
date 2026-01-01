import React, { useState, useEffect, useMemo } from 'react';
import { fetchMarksRankHistory, fetchMockTests } from '../api';

export default function GoalPlanner({ user }) {
    // --- State ---
    const [goal, setGoal] = useState({
        targetRank: '60000',
        targetYear: '2026',
        dailyHours: '6'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [marksData, setMarksData] = useState([]);
    const [tests, setTests] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Streak State (Local only for demo)
    const [streak, setStreak] = useState(3);

    // Coaching Quote Rotator
    const [quoteIndex, setQuoteIndex] = useState(0);
    const quotes = [
        "A clear plan beats random hard work.",
        "Rank improves when weak chapters reduce.",
        "Consistency matters more than motivation.",
        "NEET is not cracked by luck, but by clarity."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % quotes.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- Effects ---
    useEffect(() => {
        if (user) {
            // Load Goal from LocalStorage
            const savedGoal = localStorage.getItem(`user_goal_${user.uid}`);
            if (savedGoal) {
                setGoal(JSON.parse(savedGoal));
            } else {
                const oldRank = localStorage.getItem(`target_rank_${user.uid}`);
                if (oldRank) setGoal(prev => ({ ...prev, targetRank: oldRank }));
            }

            loadPerformanceData();
        }
    }, [user]);

    const loadPerformanceData = async () => {
        setLoadingData(true);
        try {
            const token = await user.getIdToken();
            const [marksResp, testsResp] = await Promise.all([
                fetchMarksRankHistory(),
                fetchMockTests(token)
            ]);

            let mData = [];
            if (Array.isArray(marksResp)) mData = marksResp;
            else if (marksResp?.data) mData = marksResp.data;
            setMarksData(mData);

            if (testsResp.ok) setTests(testsResp.tests || []);

        } catch (e) {
            console.error("Failed to load planner data", e);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSaveGoal = () => {
        localStorage.setItem(`user_goal_${user.uid}`, JSON.stringify(goal));
        localStorage.setItem(`target_rank_${user.uid}`, goal.targetRank);
        setIsEditing(false);
    };

    // --- Helpers ---
    const getScoreForRank = (rank) => {
        if (!marksData.length || !rank) return null;
        const t = parseInt(rank);
        const closest = marksData.reduce((prev, curr) => {
            const prevRank = parseInt((prev['2024'] || '999999').toString().replace(/,/g, ''));
            const currRank = parseInt((curr['2024'] || '999999').toString().replace(/,/g, ''));
            return Math.abs(currRank - t) < Math.abs(prevRank - t) ? curr : prev;
        });
        return closest ? parseInt(closest.marks) : null;
    };

    const getRankForScore = (score) => {
        if (!marksData.length) return null;
        const s = parseInt(score);
        if (isNaN(s)) return null;

        const closest = marksData.reduce((prev, curr) => {
            return (Math.abs(parseInt(curr.marks) - s) < Math.abs(parseInt(prev.marks) - s) ? curr : prev);
        });

        const r = closest ? (closest['2024'] || closest['2023']) : null;
        return r ? parseInt(r.toString().replace(/,/g, '')) : null;
    };

    // Constants for visualization
    const neededScore = getScoreForRank(goal.targetRank) || 620;

    // Calculate Current Stats from Tests
    const { currentScore, currentRank } = useMemo(() => {
        if (tests.length === 0) return { currentScore: 0, currentRank: 0 };

        // Sort by date sort of implicit or explicit needed? MockTracker sorts.
        // Let's assume passed order or simple sort.
        const sortedTests = [...tests].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        const last3 = sortedTests.slice(-3);
        const avgLast3Score = Math.round(last3.reduce((a, t) => a + parseInt(t.score), 0) / last3.length);
        const cRank = getRankForScore(avgLast3Score) || 770000; // Fallback if no data? Or maybe 0.

        return { currentScore: avgLast3Score, currentRank: cRank };
    }, [tests, marksData]);

    // Use sensible defaults if no tests taken yet
    const displayScore = currentScore || 0;
    const displayRank = currentRank || 770000; // Default Starting Rank

    const targetRankVal = goal.targetRank ? parseInt(goal.targetRank) : 60000;

    // Calc progress percents
    const scoreProgress = neededScore ? Math.min(100, (displayScore / neededScore) * 100) : 0;
    const rankGap = targetRankVal ? Math.abs(displayRank - targetRankVal) : 710000;

    // --- Render ---
    return (
        <div className="animate-fade-in space-y-8 pb-10 max-w-7xl mx-auto">

            {/* Header / Motivational Line */}
            <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">🎯 Goal & Planning</h2>
                    <p className="text-slate-500 text-sm mt-1">Design your roadmap to reach your target NEET rank.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                    <span className="text-lg">🔥</span>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Current Streak</span>
                        <span className="font-bold text-orange-800 text-sm">{streak} Days</span>
                    </div>
                </div>
            </div>

            {/* SECTION 1: GOAL CARD (Professional Gradient) */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-1 shadow-2xl overflow-hidden text-white group">
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
                <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>

                <div className="relative bg-slate-900/40 backdrop-blur-sm rounded-[20px] p-6 sm:p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="text-blue-300 font-bold tracking-widest text-xs uppercase mb-1">My Ultimate NEET Goal</div>
                            <h3 className="text-2xl sm:text-3xl font-serif font-medium text-white">
                                NEET <span className="text-blue-400">{goal.targetYear}</span>
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg transition-all backdrop-blur-md flex items-center gap-2"
                        >
                            <span>{isEditing ? 'Close' : '✏️ Edit Target'}</span>
                        </button>
                    </div>

                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in bg-black/20 p-6 rounded-xl border border-white/5">
                            <div>
                                <label className="block text-xs text-blue-300 font-bold uppercase mb-2">Target Rank</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
                                    value={goal.targetRank}
                                    onChange={e => setGoal({ ...goal, targetRank: e.target.value })}
                                    placeholder="e.g. 5000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-blue-300 font-bold uppercase mb-2">Target Year</label>
                                <select
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                                    value={goal.targetYear}
                                    onChange={e => setGoal({ ...goal, targetYear: e.target.value })}
                                >
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                    <option value="2027">2027</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-blue-300 font-bold uppercase mb-2">Daily Commitment</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
                                        value={goal.dailyHours}
                                        onChange={e => setGoal({ ...goal, dailyHours: e.target.value })}
                                        placeholder="Hrs"
                                    />
                                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500">HOURS/DAY</span>
                                </div>
                            </div>
                            <div className="md:col-span-3 pt-2 flex justify-end">
                                <button
                                    onClick={handleSaveGoal}
                                    className="py-2.5 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/50 transition-all transform active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <div>
                                <div className="text-blue-300/60 text-[10px] font-bold uppercase tracking-wider mb-1">Dream Rank</div>
                                <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                                    {goal.targetRank ? (
                                        <>
                                            <span className="text-xl align-top opacity-50 font-medium">#</span>
                                            {parseInt(goal.targetRank).toLocaleString()}
                                        </>
                                    ) : <span className="text-white/20">--</span>}
                                </div>
                            </div>
                            <div>
                                <div className="text-blue-300/60 text-[10px] font-bold uppercase tracking-wider mb-1">Required Score</div>
                                <div className="text-2xl lg:text-3xl font-bold text-white/90">
                                    {neededScore || <span className="text-white/20">--</span>}
                                    <span className="text-xs font-medium text-white/40 ml-1">/ 720</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-blue-300/60 text-[10px] font-bold uppercase tracking-wider mb-1">Daily Study (Expected)</div>
                                <div className="text-2xl lg:text-3xl font-bold text-white/90">
                                    {goal.dailyHours || <span className="text-white/20">--</span>}
                                    <span className="text-sm font-medium text-white/40 ml-1">hrs/day</span>
                                </div>
                            </div>
                            <div className="hidden lg:block border-l border-white/10 pl-6 h-full">
                                <div className="text-blue-300/60 text-[10px] font-bold uppercase tracking-wider mb-2">Time Remaining</div>
                                <div className="text-xl font-bold">~5 Months</div>
                                <div className="text-xs text-white/40 mt-1">For NEET {goal.targetYear}</div>
                            </div>
                            <div className="col-span-2 lg:col-span-4 mt-2">
                                <p className="text-xs text-blue-200/50 italic">Your target defines your preparation strategy.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 2: GOAL BREAKDOWN (NEW) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                    🧩 Your Goal, Simplified
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Total Marks Needed</div>
                        <div className="text-2xl font-black text-blue-600">+{neededScore - displayScore > 0 ? neededScore - displayScore : 0}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Months Remaining</div>
                        <div className="text-2xl font-black text-slate-700">5</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-center border-l-4 border-l-green-400">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Marks per Month</div>
                        <div className="text-2xl font-black text-green-600">+21</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-center border-l-4 border-l-indigo-400">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Marks per Test (avg)</div>
                        <div className="text-2xl font-black text-indigo-600">+7–8</div>
                    </div>
                </div>
                <div className="mt-4 text-center">
                    <p className="text-slate-400 text-sm italic">Small, consistent improvements create big rank jumps.</p>
                </div>
            </div>

            {/* SECTION 3 & 4: GAP ANALYSIS PROGRESS BARS (Updated) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Score Trajectory */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            📈 Score Trajectory
                        </h3>
                        {/* Tooltip hint in UI text not strictly button but functionality */}
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-4 bg-slate-100 rounded-full mb-10 overflow-visible group cursor-help">
                        <div className="absolute -top-6 left-0 text-xs font-bold text-slate-400">Your Current Level</div>
                        <div className="absolute -top-6 right-0 text-xs font-bold text-slate-400">Target Score</div>

                        <div
                            className="bg-blue-600 h-full rounded-full relative transition-all duration-1000 ease-out"
                            style={{ width: `${(displayScore / 720) * 100}%` }}
                        >
                            <div className="absolute -right-3 -top-9 flex flex-col items-center z-20">
                                <span className="bg-blue-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                    You: {displayScore}
                                </span>
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-800"></div>
                            </div>
                        </div>

                        {/* Target Marker */}
                        {neededScore && (
                            <>
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-green-500 z-10"
                                    style={{ left: `${(neededScore / 720) * 100}%` }}
                                ></div>
                                <div
                                    className="absolute top-6 flex flex-col items-center z-20"
                                    style={{ left: `${(neededScore / 720) * 100}%`, transform: 'translateX(-50%)' }}
                                >
                                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-green-600"></div>
                                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap mt-0">
                                        Target: {neededScore}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Hover Tooltip */}
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            This shows how far your average score is from your target.
                        </div>
                    </div>
                </div>

                {/* Rank Gap */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            🏆 Rank Gap
                        </h3>
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-400 uppercase">Current Rank</div>
                            <div className="text-xl font-bold text-slate-700">#{displayRank.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-green-600 uppercase">Goal Rank</div>
                            <div className="text-xl font-bold text-green-700">#{targetRankVal.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 text-center border-t-2 border-slate-200">
                        <div className="text-3xl font-black text-slate-800">#{rankGap.toLocaleString()}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ranks to climb</div>
                    </div>
                </div>
            </div>

            {/* SECTION 5 & 6: SUBJECT PLAN & WEAKNESS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Subject-Wise Marks Plan */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <h3 className="font-bold text-slate-800 text-lg mb-4 relative z-10">
                        🎯 Where Your Marks Will Come From
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                            <span className="font-bold text-slate-700">Biology</span>
                            <span className="font-black text-green-700 text-lg">+45 marks</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <span className="font-bold text-slate-700">Chemistry</span>
                            <span className="font-black text-yellow-700 text-lg">+35 marks</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <span className="font-bold text-slate-700">Physics</span>
                            <span className="font-black text-purple-700 text-lg">+27 marks</span>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 font-medium bg-slate-50 p-2 rounded text-center">
                        <span className="text-blue-500 mr-1">💡</span>
                        Top NEET scorers secure Biology first, then Chemistry.
                    </div>
                </div>

                {/* Weakness Action Pipeline */}
                <div className="bg-white border-l-4 border-l-red-500 border-y border-r border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-lg mb-2">
                        🚧 Your Biggest Mark Leak
                    </h3>
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <div className="text-xl font-bold text-red-600">Genetics</div>
                            <div className="text-sm font-bold text-slate-400">Accuracy: 38%</div>
                        </div>
                        <button className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-full shadow-lg shadow-red-200 transition-all flex items-center gap-1 active:scale-95">
                            <span>▶️</span> Start Fixing This
                        </button>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Action Steps</div>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-slate-400 mt-0.5">•</span> Revise NCERT line-by-line
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-slate-400 mt-0.5">•</span> Practice 40 NEET-level MCQs
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-slate-400 mt-0.5">•</span> Attempt chapter test
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* SECTION 7: MONTHLY MILESTONES */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-6">
                    🗓 Your NEET Journey Timeline
                </h3>
                <div className="relative">
                    {/* Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 hidden md:block"></div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                        {[
                            { month: 'Jan', goal: 'Score 540+', status: 'done' },
                            { month: 'Feb', goal: 'Score 570+', status: 'current' },
                            { month: 'Mar', goal: 'Score 600+', status: 'locked' },
                            { month: 'Apr', goal: 'Full Syllabus Tests', status: 'locked' },
                            { month: 'May', goal: 'Final Revision', status: 'locked' }
                        ].map((m, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3 border-4 transition-all
                                    ${m.status === 'done' ? 'bg-green-500 border-green-200 text-white' :
                                        m.status === 'current' ? 'bg-blue-600 border-blue-200 text-white scale-110 shadow-lg' :
                                            'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                    {m.status === 'done' ? '✓' : m.status === 'current' ? '⏳' : '🔒'}
                                </div>
                                <div className="text-sm font-bold text-slate-800">{m.month}</div>
                                <div className="text-xs text-slate-500 mt-1">{m.goal}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-8 text-center border-t border-slate-100 pt-4">
                    <p className="text-slate-400 text-sm font-medium">Reaching milestones on time reduces last-month pressure.</p>
                </div>
            </div>

            {/* SECTION 8 & 9: PLANNING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Weekly Priorities */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            ⚔️ This Week’s Battle Plan
                        </h3>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold uppercase border border-indigo-100">AI Suggested</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {[
                            { subject: 'Biology', title: 'Genetics', tag: 'High Yield', color: 'bg-green-100 text-green-700' },
                            { subject: 'Chemistry', title: 'Electrochemistry', tag: 'Practice', color: 'bg-yellow-100 text-yellow-700' },
                            { subject: 'Physics', title: 'Current Electricity', tag: 'Weak Area', color: 'bg-purple-100 text-purple-700' }
                        ].map((item, i) => (
                            <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center font-bold text-xs shadow-sm shrink-0`}>
                                    {item.subject.substring(0, 3)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className="font-bold text-slate-800 text-sm">{item.subject}: {item.title}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 rounded">{item.tag}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-slate-50/50 p-3 text-center border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Focus on fewer chapters. Go deeper.</p>
                    </div>
                </div>

                {/* Daily Targets & Test Target */}
                <div className="space-y-6">
                    {/* Test Target */}
                    <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <h3 className="font-bold text-white/90 text-sm mb-4 border-b border-white/20 pb-2 flex justify-between">
                            <span>🎯 Next Score Checkpoint</span>
                        </h3>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="block text-xs font-bold text-white/60 uppercase mb-1">Target Score</span>
                                <span className="text-4xl font-black text-white">580+</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs font-bold text-white/60 uppercase mb-1">Expected Rank Boost</span>
                                <span className="text-lg font-bold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                                    Top 3.5L
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 text-center">
                            <p className="text-xs text-white/60 font-medium">One strong test matters more than multiple weak attempts.</p>
                        </div>
                    </div>

                    {/* Daily Checklist */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-sm mb-4 flex justify-between items-center">
                            <span>✅ Today’s Minimum Win</span>
                            <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-2 py-1 rounded-full">Resets in 8h</span>
                        </h3>
                        <div className="space-y-3">
                            {[
                                'NCERT Biology revision',
                                '25 Chemistry MCQs',
                                '30 Physics numericals'
                            ].map((task, idx) => (
                                <label key={idx} className="flex items-center gap-3 group cursor-pointer">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" className="peer w-5 h-5 border-2 border-slate-300 rounded-lg checked:bg-green-500 checked:border-green-500 transition-colors focus:ring-0 appearance-none cursor-pointer" />
                                        <svg className="absolute w-3.5 h-3.5 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors decoration-slate-400 peer-checked:line-through peer-checked:opacity-50 peer-checked:text-slate-400">
                                        {task}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-slate-400 font-medium">Even a small win keeps momentum alive.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 11: REALITY CHECK (NEW) */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">🧠 Study Reality Check</h3>
                        <div className="text-slate-400 text-sm">Honest tracking = Real growth</div>
                    </div>
                    <div className="md:col-span-2 flex flex-col md:flex-row gap-4 items-center justify-end">
                        <div className="bg-slate-700/50 rounded-xl px-4 py-2 text-center border border-slate-600">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Required</div>
                            <div className="text-xl font-bold text-white">6 hrs/day</div>
                        </div>
                        <div className="text-slate-500 font-bold hidden md:block">vs</div>
                        <div className="bg-orange-900/30 rounded-xl px-4 py-2 text-center border border-orange-500/30">
                            <div className="text-[10px] font-bold text-orange-400 uppercase">Actual Avg</div>
                            <div className="text-xl font-bold text-orange-400">3.5 hrs/day</div>
                        </div>
                        <div className="flex-1 text-center md:text-right">
                            <p className="text-slate-300 text-sm italic">"Adding just 1 extra hour daily can change your rank significantly."</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 12: COACHING MESSAGE & FOOTER */}
            <div className="text-center pt-8 pb-4">
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent mx-auto mb-6"></div>
                <div key={quoteIndex} className="animate-fade-in">
                    <p className="font-serif italic text-lg text-slate-600">
                        “{quotes[quoteIndex]}”
                    </p>
                </div>

                {/* Plan B / Safe Rank (Subtle) */}
                <div className="mt-8 inline-block bg-slate-50 rounded-full px-6 py-2 border border-slate-200 hover:border-blue-200 transition-colors cursor-help group">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Safety Net</span>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Safe Rank: #1,20,000</span>
                    <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 mt-2 bg-slate-800 text-white text-xs p-2 rounded shadow-xl w-64 z-50">
                        Even if your dream rank slips, this plan keeps you admission-ready.
                    </div>
                </div>
            </div>

        </div>
    );
}
