import React, { useState, useEffect } from 'react';
import './ExplorerShared.css';

const AndhraPradeshExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            const res = await fetch('/api/andhrapradesh/all');
            const data = await res.json();
            if (data.ok) {
                setColleges(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch AP private colleges:", error);
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
                <h1 className="explorer-title">Andhra Pradesh Private Colleges</h1>
                <p className="explorer-subtitle">B1 & B2 Quota Analysis (2024 vs 2025)</p>
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
                                    <span className="college-code">AP</span>
                                    <span className="college-type-badge">Private</span>
                                </div>
                                <h3 className="college-name">{college.collegeName}</h3>

                                <div className="fee-row">
                                    <div className="fee-item">
                                        <span>B1 (2025 R2):</span>
                                        <span className="fee-val text-blue-700">{formatRank(college.b1_2025?.r2?.rank)}</span>
                                    </div>
                                    <div className="fee-item">
                                        <span>B2 (2025 R2):</span>
                                        <span className="fee-val text-purple-700">{formatRank(college.b2_2025?.r2?.rank)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleRow(college.collegeName)}
                                className="btn-view-cutoffs"
                            >
                                {expandedRow === college.collegeName ? 'Hide History' : 'View History'}
                            </button>

                            {expandedRow === college.collegeName && (
                                <div className="expanded-details">
                                    {/* B1 Quota */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-blue"></span>
                                            B1 Quota
                                        </div>
                                        <div className="cutoff-item"><span>2024 R1:</span> <span className="cutoff-val">{formatRank(college.b1_2024?.r1?.rank)} ({college.b1_2024?.r1?.score || '-'})</span></div>
                                        <div className="cutoff-item"><span>2024 R2:</span> <span className="cutoff-val">{formatRank(college.b1_2024?.r2?.rank)} ({college.b1_2024?.r2?.score || '-'})</span></div>
                                        <div className="cutoff-item pt-2 mt-2 border-t border-dashed font-medium text-blue-700">
                                            <span>2025 R1:</span> <span className="cutoff-val">{formatRank(college.b1_2025?.r1?.rank)} ({college.b1_2025?.r1?.score || '-'})</span>
                                        </div>
                                        <div className="cutoff-item font-medium text-blue-700">
                                            <span>2025 R2:</span> <span className="cutoff-val">{formatRank(college.b1_2025?.r2?.rank)} ({college.b1_2025?.r2?.score || '-'})</span>
                                        </div>
                                    </div>

                                    {/* B2 Quota */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-purple"></span>
                                            B2 Quota
                                        </div>
                                        <div className="cutoff-item"><span>2024 R1:</span> <span className="cutoff-val">{formatRank(college.b2_2024?.r1?.rank)} ({college.b2_2024?.r1?.score || '-'})</span></div>
                                        <div className="cutoff-item"><span>2024 R2:</span> <span className="cutoff-val">{formatRank(college.b2_2024?.r2?.rank)} ({college.b2_2024?.r2?.score || '-'})</span></div>
                                        <div className="cutoff-item pt-2 mt-2 border-t border-dashed font-medium text-purple-700">
                                            <span>2025 R1:</span> <span className="cutoff-val">{formatRank(college.b2_2025?.r1?.rank)} ({college.b2_2025?.r1?.score || '-'})</span>
                                        </div>
                                        <div className="cutoff-item font-medium text-purple-700">
                                            <span>2025 R2:</span> <span className="cutoff-val">{formatRank(college.b2_2025?.r2?.rank)} ({college.b2_2025?.r2?.score || '-'})</span>
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

export default AndhraPradeshExplorer;
