import React, { useState, useEffect } from 'react';
import './ExplorerShared.css';
import { getApiBase } from '../../apiConfig';

const DeemedExplorer = () => {
    const [colleges, setColleges] = useState([]);
    const [filteredColleges, setFilteredColleges] = useState([]);
    const [states, setStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedState, setSelectedState] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    useEffect(() => {
        filterData();
    }, [selectedState, colleges]);

    const fetchColleges = async () => {
        try {
            const res = await fetch(`${getApiBase()}/api/deemed/all`);
            const data = await res.json();
            if (data.ok) {
                setColleges(data.data);
                setStates(data.states);
            }
        } catch (error) {
            console.error("Failed to fetch deemed colleges:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let res = colleges;
        if (selectedState) {
            res = res.filter(c => c.state === selectedState);
        }
        setFilteredColleges(res);
    };

    const toggleRow = (name) => {
        setExpandedRow(expandedRow === name ? null : name);
    };

    const formatMoney = (amount) => {
        if (!amount) return '-';
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatRank = (data) => {
        if (!data || !data.rank) return '-';
        // Handle cases where rank might be combined or separate
        return data.rank;
    };

    const formatScore = (data) => {
        if (!data || !data.score) return '-';
        return data.score;
    }

    return (
        <div className="explorer-container">
            <div className="explorer-header">
                <h1 className="explorer-title">Deemed University Explorer</h1>
                <p className="explorer-subtitle">Explore fees, cutoffs, and details for Deemed Medical Colleges</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center max-w-4xl mx-auto">
                <div className="w-full md:w-64">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by State</label>
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                    >
                        <option value="">All States</option>
                        {states.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div className="ml-auto text-blue-700 font-medium text-sm bg-blue-50 px-3 py-1 rounded-full">
                    Showing {filteredColleges.length} colleges
                </div>
            </div>

            {loading ? (
                <div className="loading-box">Loading data...</div>
            ) : (
                <div className="explorer-grid">
                    {filteredColleges.map((college) => (
                        <div key={college.collegeName} className="explorer-card">
                            <div className="card-content">
                                <div className="card-header-row">
                                    <span className="college-code">{college.state}</span>
                                    <span className="college-type-badge">Est: {college.estd || '-'}</span>
                                </div>
                                <h3 className="college-name">{college.collegeName}</h3>

                                <div className="fee-row">
                                    <div className="fee-item">
                                        <span>Annual Fee:</span>
                                        <span className="fee-val text-green-700">
                                            {formatMoney(college.fee2025 || college.fee2024)}
                                            {college.increasedFee && <span className="text-xs text-red-500 ml-1">(+{formatMoney(college.increasedFee)} inc)</span>}
                                        </span>
                                    </div>
                                    <div className="fee-item">
                                        <span>Seats:</span>
                                        <span className="fee-val">{college.seats || '-'}</span>
                                    </div>
                                    <div className="fee-item pt-1 mt-1 border-t border-dashed border-gray-300">
                                        <span>2025 R1 Rank:</span>
                                        <span className="fee-val text-blue-700">{formatRank(college.cutoffs[2025].r1)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleRow(college.collegeName)}
                                className="btn-view-cutoffs"
                            >
                                {expandedRow === college.collegeName ? 'Hide Cutoffs' : 'View Cutoffs'}
                            </button>

                            {expandedRow === college.collegeName && (
                                <div className="expanded-details">
                                    {/* 2025 Cutoffs */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot dot-blue"></span>
                                            2025 Cutoffs
                                        </div>
                                        <div className="cutoff-item"><span>Round 1:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2025].r1)} ({formatScore(college.cutoffs[2025].r1)})</span></div>
                                        <div className="cutoff-item"><span>Round 2:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2025].r2)} ({formatScore(college.cutoffs[2025].r2)})</span></div>
                                        <div className="cutoff-item"><span>Round 3:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2025].r3)} ({formatScore(college.cutoffs[2025].r3)})</span></div>
                                    </div>

                                    {/* 2024 Cutoffs */}
                                    <div className="detail-group">
                                        <div className="detail-title">
                                            <span className="dot" style={{ background: '#94a3b8' }}></span>
                                            2024 Cutoffs
                                        </div>
                                        <div className="cutoff-item"><span>Round 1:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2024].r1)} ({formatScore(college.cutoffs[2024].r1)})</span></div>
                                        <div className="cutoff-item"><span>Round 2:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2024].r2)} ({formatScore(college.cutoffs[2024].r2)})</span></div>
                                        <div className="cutoff-item"><span>Round 3:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2024].r3)} ({formatScore(college.cutoffs[2024].r3)})</span></div>
                                        <div className="cutoff-item text-purple-600 font-medium"><span>Stray:</span> <span className="cutoff-val">{formatRank(college.cutoffs[2024].stray)} ({formatScore(college.cutoffs[2024].stray)})</span></div>
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

export default DeemedExplorer;
