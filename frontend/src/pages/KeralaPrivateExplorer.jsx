import React, { useState, useEffect } from 'react';
import './ExplorerShared.css'; // Shared styles
import { getApiBase } from '../apiConfig';

const KeralaPrivateExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        const url = `${getApiBase()}/api/keralaprivate/all`;
        try {
            console.log("Fetching Kerala colleges from:", url); // Debug
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
            console.error("Failed to fetch Kerala private colleges:", error);
            setError(error.message);
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
                <h1 className="explorer-title">Kerala Private Colleges 2025</h1>
                <p className="explorer-subtitle">Fees, Estd Year & Round 1/2 Cutoffs (2025 & 2024)</p>
                <span className="explorer-stats-badge">Showing {colleges.length} Colleges</span>
            </div>

            {loading ? (
                <div className="loading-box">Loading data...</div>
            ) : error ? (
                <div className="error-box" style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '12px',
                    margin: '20px 0'
                }}>
                    <h3>⚠️ Failed to load colleges</h3>
                    <p>{error}</p>
                    <button onClick={fetchColleges} style={{
                        marginTop: '1rem',
                        padding: '8px 16px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px'
                    }}>Retry</button>
                </div>
            ) : (
                <div className="explorer-grid">
                    {colleges.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            No colleges found. Server might be down or updating.
                        </div>
                    ) : (
                        colleges.map((college, index) => (
                            <div key={index} className="explorer-card">
                                <div className="card-content">
                                    <div className="card-header-row">
                                        <span className="college-code">{college.code}</span>
                                        <span className="college-type-badge">Private</span>
                                    </div>

                                    <h3 className="college-name">{college.collegeName}</h3>

                                    <div className="fee-row">
                                        <div className="fee-item">
                                            <span>Fees:</span>
                                            <span className="fee-val text-green-700">{formatMoney(college.fees)}</span>
                                        </div>
                                        <div className="fee-item">
                                            <span>Estd:</span>
                                            <span className="fee-val">{college.estd}</span>
                                        </div>
                                        <div className="fee-item" style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px dashed #e2e8f0' }}>
                                            <span>R1 Rank (2025):</span>
                                            <span className="fee-val">{formatRank(college.cutoffs[2025].r1.rank)}</span>
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
                                        {/* 2025 Data */}
                                        <div className="detail-group">
                                            <div className="detail-title">
                                                <span className="dot dot-blue"></span>
                                                2025 Cutoffs
                                            </div>
                                            <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2025].r1.rank)}</span></div>
                                            <div className="cutoff-item"><span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2025].r2.rank)}</span></div>
                                            <div className="cutoff-item"><span>R1 Score:</span> <span className="cutoff-val">{college.cutoffs[2025].r1.score || '-'}</span></div>
                                            <div className="cutoff-item"><span>R2 Score:</span> <span className="cutoff-val">{college.cutoffs[2025].r2.score || '-'}</span></div>
                                        </div>

                                        {/* 2024 Data */}
                                        <div className="detail-group">
                                            <div className="detail-title">
                                                <span className="dot" style={{ background: '#94a3b8' }}></span>
                                                2024 Cutoffs
                                            </div>
                                            <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2024].r1.rank)}</span></div>
                                            <div className="cutoff-item"><span>R2 Rank:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2024].r2.rank)}</span></div>
                                            <div className="cutoff-item"><span>R1 Score:</span> <span className="cutoff-val">{college.cutoffs[2024].r1.score || '-'}</span></div>
                                            <div className="cutoff-item"><span>R2 Score:</span> <span className="cutoff-val">{college.cutoffs[2024].r2.score || '-'}</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default KeralaPrivateExplorer;
