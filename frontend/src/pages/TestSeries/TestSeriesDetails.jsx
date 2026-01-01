import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TestSeriesDetails.css'; // Will create this

const TestSeriesDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('schedule');
    const [seriesInfo, setSeriesInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:5000/api/test-series/${id}`)
            .then(res => res.json())
            .then(data => {
                setSeriesInfo(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load series details:", err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="series-details-container" style={{ padding: '100px', textAlign: 'center' }}>Loading Series Details...</div>;
    if (!seriesInfo) return <div className="series-details-container">Series not found.</div>;

    return (
        <div className="series-details-container">
            <button className="back-link" onClick={() => navigate('/test-series')}>← Back to Dashboard</button>

            <div className="series-header-card">
                <div className="series-info">
                    <span className="badge-premium">👑 Premium Series</span>
                    <h1>{seriesInfo.title}</h1>
                    <p>{seriesInfo.description || "Comprehensive test series for NEET aspirants."}</p>
                    <div className="feature-pills">
                        {seriesInfo.features && seriesInfo.features.map((f, i) => <span key={i}>✅ {f}</span>)}
                    </div>
                </div>
                <div className="series-action-card">
                    <div className="price-tag">
                        <span className="price-main">₹{seriesInfo.price}</span>
                        {seriesInfo.originalPrice && <span className="price-slashed">₹{seriesInfo.originalPrice}</span>}
                        {seriesInfo.originalPrice && <span className="discount-tag">OFF</span>}
                    </div>
                    <button className="btn-buy-now">Unlock Series Now</button>
                    <p className="guarantee-text">🛡️ 100% Money Back Guarantee</p>
                </div>
            </div>

            <div className="series-tabs">
                <button
                    className={`tab-btn ${activeSection === 'schedule' ? 'active' : ''}`}
                    onClick={() => setActiveSection('schedule')}
                >
                    Test Schedule ({seriesInfo.tests ? seriesInfo.tests.length : 0})
                </button>
                <button
                    className={`tab-btn ${activeSection === 'syllabus' ? 'active' : ''}`}
                    onClick={() => setActiveSection('syllabus')}
                >
                    Detailed Syllabus
                </button>
            </div>

            <div className="series-content">
                {activeSection === 'schedule' && (
                    <div className="schedule-list">
                        {seriesInfo.tests && seriesInfo.tests.map(test => (
                            <div key={test.id} className="schedule-item">
                                <div className="test-info">
                                    <span className={`status-dot ${test.status === 'Live' ? 'live' : 'upcoming'}`}></span>
                                    <div>
                                        <h4>{test.title}</h4>
                                        <span className="test-date">📅 {test.status}</span>
                                    </div>
                                </div>
                                <button className={`btn-test-action ${test.status === 'Live' ? 'start' : 'notify'}`}>
                                    {test.status === 'Live' ? 'Start Test' : 'Notify Me'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {activeSection === 'syllabus' && (
                    <div className="syllabus-view">
                        <p>Detailed syllabus PDF download unavailable in preview mode.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSeriesDetails;
