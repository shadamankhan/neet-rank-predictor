import React, { useState, useEffect } from 'react';
import './ExplorerShared.css';
import { getApiBase } from '../../apiConfig';

const BiharPrivateExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            const res = await fetch(`${getApiBase()}/api/biharprivate/all`);
            const data = await res.json();
            if (data.ok) {
                setColleges(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch Bihar private colleges:", error);
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
                <h1 className="explorer-title">Bihar Private Colleges 2025</h1>
                <p className="explorer-subtitle">UR, NRI & Minority Quota Fees and Cutoffs</p>
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
                                    <span className="college-code">EST: {college.estd}</span>
                                    <span className="college-type-badge">Private</span>
                                </div>
                                <h3 className="college-name">{college.collegeName}</h3>

                                <div className="fee-row">
                                    <div className="fee-item">
                                        <span>UR Fees:</span>
                                        <span className="fee-val text-green-700">{college.ur.fees || '-'}</span>
                                    </div>
                                    <div className="fee-item">
                                        <span>UR R1 Rank:</span>
                                        <span className="fee-val">{formatRank(college.ur.r1)}</span>
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
                                    {/* UR Category */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-blue"></span>
                                            UR / General Quota
                                        </div>
                                        <div className="cutoff-item"><span>Fees:</span> <span className="cutoff-val">{college.ur.fees || '-'}</span></div>
                                        <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.ur.r1)}</span></div>
                                        <div className="cutoff-item"><span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.ur.r2)}</span></div>
                                    </div>

                                    {/* NRI Category */}
                                    {college.nri.available && (
                                        <div className="detail-group">
                                            <div className="detail-title">
                                                <span className="dot dot-orange"></span>
                                                NRI Quota
                                            </div>
                                            <div className="cutoff-item"><span>Fees:</span> <span className="cutoff-val">{college.nri.fees || '-'}</span></div>
                                            <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.nri.r1)}</span></div>
                                            <div className="cutoff-item"><span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.nri.r2)}</span></div>
                                        </div>
                                    )}

                                    {/* Other Category */}
                                    {college.other.available && (
                                        <div className="detail-group">
                                            <div className="detail-title">
                                                <span className="dot dot-purple"></span>
                                                {college.other.category || 'Other'} Quota
                                            </div>
                                            <div className="cutoff-item"><span>Fees:</span> <span className="cutoff-val">{college.other.fees || '-'}</span></div>
                                            <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.other.r1)}</span></div>
                                            <div className="cutoff-item"><span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.other.r2)}</span></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BiharPrivateExplorer;
