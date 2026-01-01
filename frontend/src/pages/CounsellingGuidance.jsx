import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollegeStats } from '../api';
import "./Home.css";

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
        let result = { type: '', message: '', color: '' };

        // Default fallbacks if stats fail
        const defaults = {
            govtAIQ: 23000,
            govtState: 40000, // heuristic
            private: 100000
        };

        // Use real stats if available, else defaults
        // Note: stats object has { govtAIQ, govtState, private, deemed, bds }
        const safeLimit = stats ? (stats.govtAIQ || defaults.govtAIQ) : defaults.govtAIQ;
        const borderLimit = stats ? ((stats.govtAIQ * 1.2) || defaults.govtAIQ * 1.2) : defaults.govtAIQ * 1.2;

        // Category adjustments (heuristics based on general trends relative to GN)
        // GN: 1x, OBC: 1x, EWS: 1x, SC: 5x, ST: 6x of Air Rank roughly
        let multiplier = 1;
        if (category === 'SC') multiplier = 4.5;
        if (category === 'ST') multiplier = 6.0;

        const effectiveSafe = safeLimit * multiplier;
        const effectiveBorder = borderLimit * multiplier;

        if (r <= effectiveSafe) {
            result = {
                type: 'Safe Zone (Green)',
                message: 'You have a very high chance of getting a Govt MBBS seat through AIQ or State Quota.',
                color: '#22c55e', // Green
                bg: '#dcfce7'
            };
        } else if (r <= effectiveBorder) {
            result = {
                type: 'Borderline Zone (Yellow)',
                message: 'It is risky. You might get a seat in Stray Round, or need to look at new AIIMS/State peripherals. Have a backup (BDS/Private/Drop).',
                color: '#eab308', // Yellow
                bg: '#fef9c3'
            };
        } else {
            result = {
                type: 'Danger Zone (Red)',
                message: 'Govt MBBS is unlikely this year via AIQ. Consider State Quota (if eligible), Private Colleges, Deemed Universities, or taking a drop.',
                color: '#ef4444', // Red
                bg: '#fee2e2'
            };
        }
        setZoneResult(result);
    };

    return (
        <div className="home-container" style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', minHeight: '100vh' }}>
            <section className="hero-section" style={{ paddingBottom: '40px', background: 'transparent' }}>
                <h1 className="hero-title" style={{ color: '#333' }}>Counselling Guidance</h1>
                <p className="hero-subtitle" style={{ color: '#666' }}>Know your reality. Plan your future.</p>
            </section>

            <div className="section-container" style={{ paddingTop: '0' }}>

                {/* 1. Rank Zone Checker */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    padding: '40px',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    marginBottom: '50px'
                }}>
                    <h2 style={{ marginBottom: '25px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🚦 Check Your Safety Zone
                        {loading && <span style={{ fontSize: '0.6em', color: '#999' }}>(Loading latest stats...)</span>}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Your Rank</label>
                            <input
                                type="number"
                                placeholder="Enter Rank (e.g. 24000)"
                                value={rank}
                                onChange={(e) => setRank(e.target.value)}
                                className="score-input"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="score-input"
                                style={{ width: '100%', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                            >
                                <option value="GN">General</option>
                                <option value="OBC">OBC</option>
                                <option value="EWS">EWS</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                            </select>
                        </div>
                        <button
                            onClick={checkZone}
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(45deg, #2563eb, #3b82f6)',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            Check Status
                        </button>
                    </div>

                    {zoneResult && (
                        <div style={{
                            marginTop: '30px',
                            padding: '24px',
                            backgroundColor: zoneResult.bg,
                            borderLeft: `6px solid ${zoneResult.color}`,
                            borderRadius: '12px',
                            animation: 'fadeIn 0.5s ease-out'
                        }}>
                            <h3 style={{ color: zoneResult.color, marginBottom: '8px', fontSize: '1.25rem' }}>{zoneResult.type}</h3>
                            <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: '1.6' }}>{zoneResult.message}</p>
                        </div>
                    )}
                </div>

                {/* 2. Options Grid */}
                <h2 className="section-title" style={{ color: '#1e293b' }}>🎓 Your Available Options</h2>
                <div className="features-grid" style={{ marginBottom: '50px' }}>

                    {[
                        { title: 'Government MBBS', color: '#2563eb', cost: '₹10k - ₹1L', req: 'Top Ranks', pros: 'Low Cost, Best ROI', cons: 'Very High Competition' },
                        { title: 'Private MBBS', color: '#7c3aed', cost: '₹8L - ₹20L', req: 'Qualified', pros: 'Good Infrastructure', cons: 'Expensive' },
                        { title: 'Deemed Univ', color: '#db2777', cost: '₹18L - ₹25L+', req: 'Just Qualified', pros: 'Easy Admission', cons: 'Very Expensive' },
                        { title: 'BDS / BAMS', color: '#059669', cost: 'Moderate', req: 'Moderate Rank', pros: 'Medical Career', cons: 'Lower initial pay' }
                    ].map((opt, i) => (
                        <div key={i} className="feature-card" style={{
                            background: 'white',
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}>
                            <h3 style={{ color: opt.color, marginBottom: '15px', fontSize: '1.2rem', borderBottom: `2px solid ${opt.color}20`, paddingBottom: '10px' }}>
                                {opt.title}
                            </h3>
                            <div style={{ fontSize: '0.95rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p><strong>💰 Cost:</strong> {opt.cost}</p>
                                <p><strong>🎯 Req:</strong> {opt.req}</p>
                                <p><strong>✅ Pros:</strong> {opt.pros}</p>
                                <p><strong>⚠️ Cons:</strong> {opt.cons}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Decision Helper Hook */}
                <div style={{
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    padding: '50px 30px',
                    borderRadius: '24px',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)'
                }}>
                    <h2 style={{ color: '#1e40af', marginBottom: '15px' }}>Still Confused? Use the College Finder</h2>
                    <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#1e3a8a', maxWidth: '600px', margin: '0 auto 30px auto' }}>
                        Don't speculate. Check exactly which colleges you can get at your rank based on last year's data.
                    </p>
                    <Link to="/college-finder" className="btn-primary" style={{
                        display: 'inline-block',
                        background: '#1e40af',
                        padding: '12px 32px',
                        borderRadius: '50px',
                        fontSize: '1.1rem',
                        textDecoration: 'none'
                    }}>
                        👉 Open College Finder
                    </Link>
                </div>

                {/* Inline Animation styles */}
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default CounsellingGuidance;
