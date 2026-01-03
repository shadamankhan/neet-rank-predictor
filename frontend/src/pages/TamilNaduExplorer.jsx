import React, { useState, useEffect } from 'react';
import './ExplorerShared.css';
import { getApiBase } from '../apiConfig';

const TamilNaduExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            const res = await fetch(`${getApiBase()}/api/tamilnadu/all`);
            const data = await res.json();
            if (data.ok) {
                setColleges(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch TN private colleges:", error);
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

    // Helper to check if quota has valid data
    const hasData = (data) => data && (data.r1.rank || data.r2.rank);

    const QuotaDetail = ({ title, data, dotColor }) => {
        if (!hasData(data)) return null;
        return (
            <div className="detail-group">
                <div className="detail-title">
                    <span className={`dot ${dotColor}`}></span>
                    {title}
                </div>
                <div className="cutoff-item"><span>R1 Rank:</span> <span className="cutoff-val">{formatRank(data.r1.rank)}</span></div>
                <div className="cutoff-item"><span>R1 Score:</span> <span className="cutoff-val">{data.r1.score || '-'}</span></div>
                <div className="cutoff-item mt-2 pt-2 border-t border-dashed">
                    <span>R2 Rank:</span> <span className="cutoff-val">{formatRank(data.r2.rank)}</span>
                </div>
                <div className="cutoff-item"><span>R2 Score:</span> <span className="cutoff-val">{data.r2.score || '-'}</span></div>
            </div>
        );
    };

    return (
        <div className="explorer-container">
            <div className="explorer-header">
                <h1 className="explorer-title">Tamil Nadu Private Colleges 2025</h1>
                <p className="explorer-subtitle">MQ, NRI & Minority Quota Cutoffs</p>
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
                                    <span className="college-type-badge">Private</span>
                                </div>
                                <h3 className="college-name">{college.collegeName}</h3>

                                <div className="fee-row">
                                    <div className="fee-item">
                                        <span>MQ Fees:</span>
                                        <span className="fee-val text-green-700">{college.fees.mq ? `₹${college.fees.mq}` : '-'}</span>
                                    </div>
                                    <div className="fee-item">
                                        <span>MQ R1 Rank:</span>
                                        <span className="fee-val">{formatRank(college.mq.r1.rank)}</span>
                                    </div>
                                    <div className="fee-item text-xs text-gray-400">
                                        NRI Fees: {college.fees.nri ? `₹${college.fees.nri}` : '-'}
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
                                    <QuotaDetail title="Management (MQ)" data={college.mq} dotColor="dot-blue" />
                                    <QuotaDetail title="NRI Quota" data={college.nri} dotColor="dot-orange" />
                                    <QuotaDetail title="Christian Minority (CMQ)" data={college.minority.cmq} dotColor="dot-purple" />
                                    <QuotaDetail title="Telugu Minority (TMQ)" data={college.minority.tmq} dotColor="dot-green" />
                                    <QuotaDetail title="Malayalam Minority (MMQ)" data={college.minority.mmq} dotColor="dot-pink" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TamilNaduExplorer;
