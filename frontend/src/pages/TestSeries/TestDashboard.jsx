import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBase } from '../../apiConfig';
import './TestDashboard.css'; // Will create this next



const TestDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('free');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const loadDashboard = () => {
        setLoading(true);
        setError(null);
        fetch(`${getApiBase()}/api/test-series/dashboard`)
            .then(res => {
                if (!res.ok) throw new Error(res.status === 503 ? 'Server is waking up, please retry...' : `Server returned ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.ok === false) throw new Error(data.message || 'API Error');
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load dashboard:", err);
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    // Helper to render star rating or difficulty
    const renderDifficulty = (level) => {
        return <span className={`difficulty-badge ${level.toLowerCase()}`}>{level}</span>;
    };

    if (loading) return (
        <div className="test-dashboard-container" style={{ padding: '100px', textAlign: 'center' }}>
            <h2>Loading Test Series...</h2>
            <p>This may take up to 60 seconds if the free server is waking up.</p>
        </div>
    );

    if (error) return (
        <div className="test-dashboard-container" style={{ padding: '100px', textAlign: 'center', color: 'red' }}>
            <h2>❌ Connection Failed</h2>
            <p>{error}</p>
            <p>If this persists, check if the Backend URL is blocked or down.</p>
            <button
                onClick={loadDashboard}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginTop: '20px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px'
                }}
            >
                Retry Request
            </button>
        </div>
    );

    if (!data) return <div className="test-dashboard-container">No data available.</div>;

    const { upcomingTest, categories = [], testBundles = {} } = data || {};

    // Safety check: if backend returned error or data is malformed
    if (!testBundles || !categories.length) {
        // Fallback or specific error handling if needed, but safe destructuring above prevents crash
        // We can continue, or show a 'Maintenance' message if critical data is missing
        // For now, let's just ensure we don't crash in rendering
    }

    return (
        <div className="test-dashboard-container">
            {/* 1. Hero / Welcome Section */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1>Ready to Crack NEET 2026? 🚀</h1>
                    <p>Prepare Smart with <strong>Rank-Booster Test Series</strong> designed by Experts.</p>
                </div>

                {/* 1a. Upcoming Test Card (Floating) */}
                {upcomingTest && (
                    <div className="upcoming-test-card">
                        <div className="card-header">
                            <span className="badge-live">🔔 Up Next</span>
                            <span className="test-date">{upcomingTest.date}</span>
                        </div>
                        <h3>{upcomingTest.title}</h3>
                        <p className="topics">{upcomingTest.topics}</p>
                        <div className="meta-stats">
                            <span>👥 {upcomingTest.participants.toLocaleString()} Enrolled</span>
                            <span className="timer">⏳ {upcomingTest.timeLeft}</span>
                        </div>
                        <button className="btn-register" onClick={() => navigate(`/exam-engine/${upcomingTest.id}`)}>Register for Free</button>
                    </div>
                )}
            </div>

            {/* 2. Performance Strip */}
            <div className="performance-strip">
                <div className="stat-box">
                    <span className="stat-label">Last Score</span>
                    <span className="stat-value">480/720</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">AIR (Est)</span>
                    <span className="stat-value">#1540</span>
                </div>
                <div className="stat-box warning">
                    <span className="stat-label">Weak Subject</span>
                    <span className="stat-value">Physics</span>
                </div>
                <button className="btn-analysis" onClick={() => navigate('/profile')}>View Full Analysis →</button>
            </div>

            {/* 3. Main Content Area */}
            <div className="content-layout">
                {/* 3a. Sidebar / Category Pills */}
                <div className="category-nav">
                    <h3>Explore Series</h3>
                    <div className="category-list">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`cat-btn ${activeTab === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(cat.id)}
                            >
                                <span className="cat-name">{cat.name}</span>
                                <span className="cat-desc">{cat.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3b. Test Cards Grid */}
                <div className="test-grid-section">
                    <div className="section-header">
                        <h2>{categories.find(c => c.id === activeTab)?.name}</h2>
                        {activeTab !== 'free' && <button className="btn-view-all">View All Plans</button>}
                    </div>

                    <div className="cards-grid">
                        {/* Fallback if no specific data for tab yet */}
                        {(testBundles[activeTab] || []).map(test => (
                            <div key={test.id} className="test-card-pro">
                                <div className="test-card-top">
                                    <span className={`status-badge ${test.status === 'Locked' ? 'locked' : 'open'}`}>
                                        {test.status || 'Open'}
                                    </span>
                                    {test.isPremium && <span className="premium-crown">👑 Premium</span>}
                                </div>
                                <h3>{test.title}</h3>
                                <div className="test-meta">
                                    <span>📝 {test.questions} Qs</span>
                                    <span>⏱ {test.time} mins</span>
                                </div>
                                <div className="test-tags">
                                    {/* Mock tags for now */}
                                    <span className="tag">NEET 2026</span>
                                </div>
                                <div className="test-card-footer">
                                    <div className="price-info">
                                        {test.price && test.price !== 'Free' ? (
                                            <>
                                                <span className="price-original">₹2499</span>
                                                <span className="price-current">₹{test.price}</span>
                                            </>
                                        ) : (
                                            <span className="price-free">FREE</span>
                                        )}
                                    </div>
                                    <button
                                        className={`btn-action ${test.status === 'Locked' ? 'btn-buy' : 'btn-start'}`}
                                        onClick={() => test.status === 'Locked' ? alert('Redirect to Payment') : navigate(`/exam-engine/${test.id}`)}
                                    >
                                        {test.status === 'Locked' ? 'Unlock Now' : 'Start Test'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(testBundles[activeTab] || []).length === 0 && <p>No tests available in this category.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestDashboard;
