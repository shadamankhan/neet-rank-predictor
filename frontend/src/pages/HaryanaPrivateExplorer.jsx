import React, { useState, useEffect } from 'react';
import './ExplorerShared.css';
import { getApiBase } from '../apiConfig';

const HaryanaPrivateExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            const res = await fetch(`${getApiBase()}/api/haryanaprivate/all`);
            const data = await res.json();
            if (data.ok) {
                setColleges(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch Haryana private colleges:", error);
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
                <h1 className="explorer-title">Haryana Private Colleges 2025</h1>
                <p className="explorer-subtitle">Open & Management Quota Cutoffs (R1 & R2)</p>
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
                                    {college.notes && <span className="college-type-badge bg-orange-100 text-orange-800">{college.notes}</span>}
                                </div>
                                <h3 className="college-name">{college.collegeName}</h3>

                                <div className="fee-row">
                                    <div className="fee-item">
                                        <span>Fees:</span>
                                        <span className="fee-val text-green-700">{college.fees}</span>
                                    </div>
                                    <div className="fee-item">
                                        <span>Open R1:</span>
                                        <span className="fee-val">{formatRank(college.open.r1.rank)}</span>
                                    </div>
                                    <div className="fee-item text-xs text-gray-500 italic border-t pt-1 mt-1 border-gray-200">
                                        Hostel: {college.hostelFees || 'N/A'}
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
                                    {/* Open Quota */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-blue"></span>
                                            Open Quota
                                        </div>
                                        <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.open.r1.rank)}</span></div>
                                        <div className="cutoff-item"><span>R1 Score:</span> <span className="cutoff-val">{college.open.r1.score || '-'}</span></div>

                                        <div className="cutoff-item mt-2 pt-2 border-t border-dashed">
                                            <span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.open.r2.rank)}</span>
                                        </div>
                                        <div className="cutoff-item"><span>R2 Score:</span> <span className="cutoff-val">{college.open.r2.score || '-'}</span></div>
                                    </div>

                                    {/* Management Quota */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-purple"></span>
                                            Management Quota
                                        </div>
                                        <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.mgt.r1.rank)}</span></div>
                                        <div className="cutoff-item"><span>R1 Score:</span> <span className="cutoff-val">{college.mgt.r1.score || '-'}</span></div>

                                        <div className="cutoff-item mt-2 pt-2 border-t border-dashed">
                                            <span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.mgt.r2.rank)}</span>
                                        </div>
                                        <div className="cutoff-item"><span>R2 Score:</span> <span className="cutoff-val">{college.mgt.r2.score || '-'}</span></div>
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

export default HaryanaPrivateExplorer;
