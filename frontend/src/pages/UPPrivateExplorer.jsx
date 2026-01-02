import React, { useState, useEffect } from 'react';
import './ExplorerShared.css';
import { getApiBase } from '../../apiConfig';

const UPPrivateExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            const res = await fetch(`${getApiBase()}/api/upprivate/all`);
            const data = await res.json();
            if (data.ok) {
                setColleges(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch UP private colleges:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (collegeName) => {
        setExpandedRow(expandedRow === collegeName ? null : collegeName);
    };

    const formatMoney = (amount) => {
        if (!amount) return '-';
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatRank = (rank) => {
        if (!rank) return '-';
        return typeof rank === 'number' ? rank.toLocaleString() : rank;
    };

    return (
        <div className="explorer-container">
            <div className="explorer-header">
                <h1 className="explorer-title">UP Private Colleges 2025</h1>
                <p className="explorer-subtitle">Budget, Round 1 & Round 2 Cutoffs</p>
                <span className="explorer-stats-badge">Showing {colleges.length} Colleges</span>
            </div>

            {loading ? (
                <div className="loading-box">Loading data...</div>
            ) : (
                <div className="explorer-grid">
                    {colleges.map((college, index) => (
                        <div key={index} className="explorer-card">
                            <div className="card-content">
                                <h3 className="college-name">{college.collegeName}</h3>

                                <div className="fee-row">
                                    <div className="fee-item">
                                        <span>Budget:</span>
                                        <span className="fee-val text-green-700">{formatMoney(college.fees)}</span>
                                    </div>
                                    <div className="fee-item">
                                        <span>R1 Rank (2025):</span>
                                        <span className="fee-val">{formatRank(college.cutoffs.r1.rank)}</span>
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
                                            <span className="dot dot-green"></span>
                                            Round 1 (2025)
                                        </div>
                                        <div className="cutoff-item"><span>Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.r1.rank)}</span></div>
                                        <div className="cutoff-item"><span>Score:</span> <span className="cutoff-val">{college.cutoffs.r1.score || '-'}</span></div>
                                    </div>

                                    {/* Round 2 */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-purple"></span>
                                            Round 2 (2025)
                                        </div>
                                        <div className="cutoff-item"><span>Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.r2.rank)}</span></div>
                                        <div className="cutoff-item"><span>Score:</span> <span className="cutoff-val">{college.cutoffs.r2.score || '-'}</span></div>
                                        <div className="cutoff-item" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>
                                            <span>Change (R1→R2):</span>
                                            <span className={`cutoff-val ${(college.cutoffs.scoreChange || 0) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {college.cutoffs.scoreChange > 0 ? '+' : ''}{college.cutoffs.scoreChange || '-'}
                                            </span>
                                        </div>
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

export default UPPrivateExplorer;
