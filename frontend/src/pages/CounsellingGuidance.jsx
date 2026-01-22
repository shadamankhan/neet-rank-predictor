import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollegeStats } from '../api';

const CounsellingGuidance = () => {
    const [rank, setRank] = useState('');
    const [category, setCategory] = useState('GN');
    const [zoneResult, setZoneResult] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Fetch real stats
        fetchCollegeStats().then(data => {
            if (data.ok) {
                setStats(data.stats);
            }
        }).catch(err => console.error("Failed to load stats", err))
            .finally(() => setLoading(false));
    }, []);

    const checkZone = () => {
        if (!rank) return;
        const r = Number(rank);
        let result = { type: '', message: '', color: '', bg: '', border: '' };

        // Default fallbacks if stats fail
        const defaults = {
            govtAIQ: 23000,
            govtState: 40000, // heuristic
            private: 100000
        };

        // Use real stats if available, else defaults
        const safeLimit = stats ? (stats.govtAIQ || defaults.govtAIQ) : defaults.govtAIQ;
        const borderLimit = stats ? ((stats.govtAIQ * 1.2) || defaults.govtAIQ * 1.2) : defaults.govtAIQ * 1.2;

        // Category adjustments
        let multiplier = 1;
        if (category === 'SC') multiplier = 4.5;
        if (category === 'ST') multiplier = 6.0;

        const effectiveSafe = safeLimit * multiplier;
        const effectiveBorder = borderLimit * multiplier;

        if (r <= effectiveSafe) {
            result = {
                type: 'Safe Zone (Green)',
                message: 'You have a very high chance of getting a Govt MBBS seat through AIQ or State Quota.',
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-200'
            };
        } else if (r <= effectiveBorder) {
            result = {
                type: 'Borderline Zone (Yellow)',
                message: 'It is risky. You might get a seat in Stray Round, or need to look at new AIIMS/State peripherals. Have a backup (BDS/Private/Drop).',
                color: 'text-yellow-600',
                bg: 'bg-yellow-50',
                border: 'border-yellow-200'
            };
        } else {
            result = {
                type: 'Danger Zone (Red)',
                message: 'Govt MBBS is unlikely this year via AIQ. Consider State Quota (if eligible), Private Colleges, Deemed Universities, or taking a drop.',
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-200'
            };
        }
        setZoneResult(result);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            <section className="text-center pt-28 pb-10 px-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Counselling Guidance</h1>
                <p className="text-slate-600 text-lg">Know your reality. Plan your future.</p>
            </section>

            <div className="max-w-5xl mx-auto px-5">

                {/* 1. Rank Zone Checker */}
                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 md:p-10 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3 relative z-10">
                        <span>🚦</span> Check Your Safety Zone
                        {loading && <span className="text-xs font-normal text-slate-400 ml-2 animate-pulse">(Loading stats...)</span>}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative z-10">
                        <div>
                            <label className="block mb-2 font-semibold text-slate-600">Your Rank</label>
                            <input
                                type="number"
                                placeholder="Enter Rank (e.g. 24000)"
                                value={rank}
                                onChange={(e) => setRank(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-semibold text-slate-600">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                            >
                                <option value="GN">General / OBC / EWS</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                            </select>
                        </div>
                        <button
                            onClick={checkZone}
                            disabled={loading}
                            className="h-[50px] bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200"
                        >
                            Check Status
                        </button>
                    </div>

                    {zoneResult && (
                        <div className={`mt-8 p-6 rounded-xl border-l-4 ${zoneResult.bg} ${zoneResult.border} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                            <h3 className={`font-bold text-lg mb-2 ${zoneResult.color}`}>{zoneResult.type}</h3>
                            <p className="text-slate-700 leading-relaxed">{zoneResult.message}</p>
                        </div>
                    )}
                </div>

                {/* 2. Options Grid */}
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span>🎓</span> Your Available Options
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { title: 'Govt MBBS', color: 'text-blue-600', border: 'border-blue-100', cost: '₹10k - ₹1L', req: 'Top Ranks', pros: 'Low Cost, Best ROI', cons: 'Very High Competition' },
                        { title: 'Private MBBS', color: 'text-purple-600', border: 'border-purple-100', cost: '₹8L - ₹20L', req: 'Qualified', pros: 'Good Infrastructure', cons: 'Expensive' },
                        { title: 'Deemed Univ', color: 'text-pink-600', border: 'border-pink-100', cost: '₹18L - ₹25L+', req: 'Just Qualified', pros: 'Easy Admission', cons: 'Very Expensive' },
                        { title: 'BDS / BAMS', color: 'text-emerald-600', border: 'border-emerald-100', cost: 'Moderate', req: 'Moderate Rank', pros: 'Medical Career', cons: 'Lower initial pay' }
                    ].map((opt, i) => (
                        <div key={i} className={`bg-white rounded-2xl p-6 shadow-sm border ${opt.border} hover:shadow-md transition-all hover:-translate-y-1`}>
                            <h3 className={`font-bold text-lg mb-4 pb-3 border-b border-slate-100 ${opt.color}`}>
                                {opt.title}
                            </h3>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p><strong className="text-slate-800">💰 Cost:</strong> {opt.cost}</p>
                                <p><strong className="text-slate-800">🎯 Req:</strong> {opt.req}</p>
                                <p><strong className="text-slate-800">✅ Pros:</strong> {opt.pros}</p>
                                <p><strong className="text-slate-800">⚠️ Cons:</strong> {opt.cons}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Decision Helper Hook */}
                <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 p-10 rounded-3xl border border-blue-100 shadow-sm">
                    <h2 className="text-2xl font-bold text-blue-900 mb-4">Still Confused? Use the College Finder</h2>
                    <p className="text-lg text-blue-800 max-w-2xl mx-auto mb-8">
                        Don't speculate. Check exactly which colleges you can get at your rank based on last year's data.
                    </p>
                    <Link to="/college-finder" className="inline-block bg-blue-700 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-800 shadow-lg shadow-blue-200 transition-all hover:-translate-y-1">
                        👉 Open College Finder
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default CounsellingGuidance;
