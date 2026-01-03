import React, { useState, useEffect } from 'react';
import './ExplorerShared.css'; // Shared styles
import { getApiBase } from '../../apiConfig';

const KarnatakaExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        const url = `${getApiBase()}/api/karnataka/all`;
        try {
            console.log("Fetching Karnataka colleges from:", url); // Debug
            const res = await fetch(url);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server returned ${res.status}: ${text.substring(0, 200)}`);
            }

            const data = await res.json();
            if (data.ok) {
                setColleges(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch karnataka colleges:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (code) => {
        setExpandedRow(expandedRow === code ? null : code);
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
            {/* Header */}
            <div className="explorer-header">
                <h1 className="explorer-title">Karnataka Private Explorer</h1>
                <p className="explorer-subtitle">Fees & Cutoffs for Private (P) and Others (Q) Quota (Non-Karnataka Eligible)</p>
                <span className="explorer-stats-badge">Showing {colleges.length} Colleges</span>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="loading-box">Loading colleges data...</div>
            ) : (
                <div className="explorer-grid">
                    {colleges.map((college) => (
                        <div key={college.code} className="explorer-card">
                            <div className="card-content">
                                <div className="card-header-row">
                                    <span className="college-code">{college.code}</span>
                                    <span className="college-type-badge">{college.type}</span>
                                </div>

                                <h3 className="college-name">{college.collegeName}</h3>

                                <div className="fee-row">
                                    <div className="fee-item">
                                        <span>Private Fee:</span>
                                        <span className="fee-val text-green-700">{formatMoney(college.fees.private)}</span>
                                    </div>
                                    <div className="fee-item">
                                        <span>Other (Q) Fee:</span>
                                        <span className="fee-val text-purple-700">{formatMoney(college.fees.other)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleRow(college.code)}
                                className="btn-view-cutoffs"
                            >
                                {expandedRow === college.code ? 'Hide Cutoffs' : 'View Cutoffs'}
                            </button>

                            {/* Expanded Details */}
                            {expandedRow === college.code && (
                                <div className="expanded-details">
                                    {/* Open Quota */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-green"></span>
                                            Open/Private Quota
                                        </div>
                                        <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.open.r1.rank)}</span></div>
                                        <div className="cutoff-item"><span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.open.r2.rank)}</span></div>
                                        <div className="cutoff-item"><span>R3 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.open.r3.rank)}</span></div>
                                    </div>

                                    {/* Other Quota */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-purple"></span>
                                            Others (Q) Quota
                                        </div>
                                        <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.other.r1.rank)}</span></div>
                                        <div className="cutoff-item"><span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.other.r2.rank)}</span></div>
                                        <div className="cutoff-item"><span>R3 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.other.r3.rank)}</span></div>
                                    </div>

                                    {/* NRI Quota */}
                                    {college.fees.nri && (
                                        <div className="detail-group">
                                            <div className="detail-title">
                                                <span className="dot dot-orange"></span>
                                                NRI Quota
                                            </div>
                                            <div className="cutoff-item"><span>Fee:</span> <span className="cutoff-val">{formatMoney(college.fees.nri)}</span></div>
                                            <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs.nri.r1.rank)}</span></div>
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

export default KarnatakaExplorer;
