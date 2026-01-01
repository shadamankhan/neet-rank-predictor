import React, { useState, useEffect } from 'react';
import './ExplorerShared.css';

const WestBengalPrivateExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            const res = await fetch('/api/westbengalprivate/all');
            const data = await res.json();
            if (data.ok) {
                setColleges(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch West Bengal private colleges:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (collegeName) => {
        setExpandedRow(expandedRow === collegeName ? null : collegeName);
    };

    const formatRank = (rank) => {
        if (!rank) return '-';
        return typeof rank === 'number' ? rank.toLocaleString() : rank;
    };

    return (
        <div className="explorer-container">
            <div className="explorer-header">
                <h1 className="explorer-title">West Bengal Private Colleges 2025</h1>
                <p className="explorer-subtitle">Management Quota Cutoffs (R1 & R2)</p>
                <span className="explorer-stats-badge">Showing {colleges.length} Colleges</span>
            </div>

            {loading ? (
                <div className="loading-box">Loading data...</div>
            ) : (
                <div className="explorer-grid">
                    {colleges.map((college, index) => (
                        <div key={index} className="explorer-card">
                            <div className="card-content">
                                <div className="card-header-row">
                                    <span className="college-code">Est: {college.estYear}</span>
                                    <span className="college-type-badge">Intake: {college.intake}</span>
                                </div>
                                <h3 className="college-name">{college.collegeName}</h3>

                                <div className="fee-row">
                                    <div className="fee-item">
                                        <span>Mgmt Fee:</span>
                                        <span className="fee-val text-green-700">{college.fees}</span>
                                    </div>
                                    <div className="fee-item">
                                        <span>R1 Rank:</span>
                                        <span className="fee-val">{formatRank(college.r1.rank)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleRow(college.collegeName)}
                                className="btn-view-cutoffs"
                            >
                                {expandedRow === college.collegeName ? 'Hide Details' : 'View Details'}
                            </button>

                            {expandedRow === college.collegeName && (
                                <div className="expanded-details">
                                    {/* Round 1 */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-blue"></span>
                                            Round 1 (2025)
                                        </div>
                                        <div className="cutoff-item"><span>Rank:</span> <span className="cutoff-val">{formatRank(college.r1.rank)}</span></div>
                                        <div className="cutoff-item"><span>Score:</span> <span className="cutoff-val">{college.r1.score || '-'}</span></div>
                                    </div>

                                    {/* Round 2 */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-purple"></span>
                                            Round 2 (2025)
                                        </div>
                                        <div className="cutoff-item"><span>Rank:</span> <span className="cutoff-val">{formatRank(college.r2.rank)}</span></div>
                                        <div className="cutoff-item"><span>Score:</span> <span className="cutoff-val">{college.r2.score || '-'}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WestBengalPrivateExplorer;
