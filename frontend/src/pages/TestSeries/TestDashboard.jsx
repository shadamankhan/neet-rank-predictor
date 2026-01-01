import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TestDashboard.css'; // Will create this next



const TestDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('free');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/test-series/dashboard')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load dashboard:", err);
                setLoading(false);
            });
    }, []);

    // Helper to render star rating or difficulty
    const renderDifficulty = (level) => {
        return <span className={`difficulty-badge ${level.toLowerCase()}`}>{level}</span>;
    };

    if (loading) return <div className="test-dashboard-container" style={{ padding: '100px', textAlign: 'center' }}>Loading Test Series...</div>;
    if (!data) return <div className="test-dashboard-container">Failed to load data.</div>;

    const { upcomingTest, categories, testBundles } = data;

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
                        <button className="btn-register">Register for Free</button>
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
                <button className="btn-analysis" onClick={() => navigate('/analysis')}>View Full Analysis →</button>
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
