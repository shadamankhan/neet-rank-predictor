import React, { useState, useEffect } from 'react';
import { parseFeeToNumber } from '../utils/feeHelper';
import './PrivateDeemedFinder.css';

// API Endpoints
const ENDPOINTS = [
    { url: '/api/deemed/all', type: 'Deemed', stateKey: 'state', feeKey: 'fee2025' }, // fallback fee2024
    { url: '/api/karnataka/all', type: 'Private', stateKey: 'Karnataka', feeKey: 'fees.private', staticState: 'Karnataka' },
    { url: '/api/keralaprivate/all', type: 'Private', stateKey: 'Kerala', feeKey: 'fees', staticState: 'Kerala' },
    { url: '/api/biharprivate/all', type: 'Private', stateKey: 'Bihar', feeKey: 'fees', staticState: 'Bihar' },
    { url: '/api/upprivate/all', type: 'Private', stateKey: 'Uttar Pradesh', feeKey: 'fees', staticState: 'Uttar Pradesh' },
    { url: '/api/westbengalprivate/all', type: 'Private', stateKey: 'West Bengal', feeKey: 'fees', staticState: 'West Bengal' },
    { url: '/api/haryanaprivate/all', type: 'Private', stateKey: 'Haryana', feeKey: 'fees', staticState: 'Haryana' },
    { url: '/api/andhrapradesh/all', type: 'Private', stateKey: 'Andhra Pradesh', feeKey: 'fees', staticState: 'Andhra Pradesh' },
    { url: '/api/tamilnadu/all', type: 'Private', stateKey: 'Tamil Nadu', feeKey: 'fees', staticState: 'Tamil Nadu' }
];

export default function PrivateDeemedFinder() {
    const [allColleges, setAllColleges] = useState([]);
    const [filteredColleges, setFilteredColleges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [rank, setRank] = useState('');
    const [budgetMin, setBudgetMin] = useState(1000000);
    const [budgetMax, setBudgetMax] = useState(4500000); // Default 45 Lakhs
    const [selectedState, setSelectedState] = useState('');
    const [filterType, setFilterType] = useState('All'); // All, Private, Deemed

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        let aggregated = [];

        try {
            const promises = ENDPOINTS.map(ep =>
                fetch(ep.url).then(res => res.json().then(data => ({ ...data, source: ep })))
                    .catch(err => ({ ok: false, source: ep }))
            );

            const results = await Promise.all(promises);

            results.forEach(res => {
                if (res.ok && res.data) {
                    const source = res.source;
                    const colleges = res.data.map(c => normalizeCollege(c, source));
                    aggregated = [...aggregated, ...colleges];
                }
            });

            setAllColleges(aggregated);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    // Normalize Data Function
    const normalizeCollege = (c, source) => {
        let fee = 0;

        // Handle nested fee keys like 'fees.private'
        if (source.feeKey.includes('.')) {
            const parts = source.feeKey.split('.');
            fee = c[parts[0]] ? c[parts[0]][parts[1]] : 0;
        } else {
            // Special check for Deemed fallback
            if (source.type === 'Deemed' && !c[source.feeKey]) {
                fee = c['fee2024'] || 0;
            } else {
                fee = c[source.feeKey];
            }
        }

        // Parse fee
        const numericFee = parseFeeToNumber(fee);

        // State detection
        const state = source.staticState || c.state || c.State || 'Unknown';

        // Est. Year detection
        const estYear = c.estd || c.estYear || c.est_year || c['Year Est.'] || c['Establishment Year'] || c.founded || null;

        // Rank detection with Fallback (R1 -> R2 -> R3)
        let closingRank = 9999999;

        if (c.cutoffs) {
            // Helper to extract rank safely
            const getR = (val) => {
                if (!val) return null;
                if (typeof val === 'number') return val;
                // handle "1234" strings
                const s = val.toString().replace(/,/g, '').trim();
                const n = Number(s);
                return isNaN(n) ? null : n;
            }

            // 1. Check Deemed Structure (2025 prefer, then 2024)
            const y = c.cutoffs[2025] || c.cutoffs[2024];
            if (y) {
                if (y.r1 && getR(y.r1.rank)) closingRank = getR(y.r1.rank);
                else if (y.r2 && getR(y.r2.rank)) closingRank = getR(y.r2.rank);
                else if (y.r3 && getR(y.r3.rank)) closingRank = getR(y.r3.rank);
                else if (y.stray && getR(y.stray.rank)) closingRank = getR(y.stray.rank);
            }

            // 2. Check State Structures (Open, Mgt keys)
            // Karnataka/Haryana: cutoffs.open.r1...
            if (closingRank === 9999999 && c.cutoffs.open) {
                if (c.cutoffs.open.r1 && getR(c.cutoffs.open.r1.rank)) closingRank = getR(c.cutoffs.open.r1.rank);
                else if (c.cutoffs.open.r2 && getR(c.cutoffs.open.r2.rank)) closingRank = getR(c.cutoffs.open.r2.rank);
                else if (c.cutoffs.open.r3 && getR(c.cutoffs.open.r3.rank)) closingRank = getR(c.cutoffs.open.r3.rank);
            }

            // 3. Simple Structures (UP/Bihar/Others: cutoffs.r1...)
            if (closingRank === 9999999 && c.cutoffs.r1) {
                if (getR(c.cutoffs.r1.rank)) closingRank = getR(c.cutoffs.r1.rank);
                else if (c.cutoffs.r2 && getR(c.cutoffs.r2.rank)) closingRank = getR(c.cutoffs.r2.rank);
                else if (c.cutoffs.r3 && getR(c.cutoffs.r3.rank)) closingRank = getR(c.cutoffs.r3.rank);
            }

        } else if (c.r1 || c.r2) { // West Bengal direct keys
            const getR = (val) => val ? Number(val) : null;
            if (c.r1 && getR(c.r1.rank)) closingRank = getR(c.r1.rank);
            else if (c.r2 && getR(c.r2.rank)) closingRank = getR(c.r2.rank);
        }

        return {
            name: c.collegeName || c.college_name || c['College Name'],
            state: state,
            type: source.type,
            fee: numericFee,
            rank: closingRank, // This is an estimate for filtering
            estYear: estYear,
            raw: c
        };
    };

    const handleSearch = () => {
        let filtered = allColleges.filter(c => {
            // 1. Budget Filter
            if (c.fee < budgetMin || (budgetMax > 0 && c.fee > budgetMax)) return false;

            // 2. Type Filter
            if (filterType !== 'All' && c.type !== filterType) return false;

            // 3. State Filter
            if (selectedState && c.state !== selectedState) return false;

            // 4. Rank Filter (User Rank <= Closing Rank)
            if (rank) {
                const userRank = Number(rank);
                if (c.rank !== 9999999 && userRank > c.rank) return false;
            }

            return true;
        });

        // Sort by Fee ascending
        filtered.sort((a, b) => a.fee - b.fee);

        setFilteredColleges(filtered);
    };

    // Trigger search when data loaded or filters change? 
    useEffect(() => {
        if (allColleges.length > 0) {
            handleSearch();
        }
    }, [allColleges]);

    return (
        <div className="finder-container">
            <h1 className="finder-title">Private & Deemed College Finder</h1>
            <p className="finder-subtitle">Find best colleges within your budget (10L - 45L) & Rank</p>

            <div className="filters-panel">
                <div className="filter-group">
                    <label>Your Rank</label>
                    <input
                        type="number"
                        placeholder="e.g. 150000"
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        className="finder-input"
                    />
                </div>

                <div className="filter-group">
                    <label>Budget (Per Year)</label>
                    <div className="budget-inputs">
                        <input
                            type="number"
                            value={budgetMin}
                            onChange={(e) => setBudgetMin(Number(e.target.value))}
                            step="100000"
                        />
                        <span>to</span>
                        <input
                            type="number"
                            value={budgetMax}
                            onChange={(e) => setBudgetMax(Number(e.target.value))}
                            step="100000"
                        />
                    </div>
                    <small style={{ color: '#666' }}>Default: 10L - 45L</small>
                </div>

                <div className="filter-group">
                    <label>State</label>
                    <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="finder-select">
                        <option value="">All States</option>
                        {Array.from(new Set(allColleges.map(c => c.state))).sort().map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>College Type</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="finder-select">
                        <option value="All">All types</option>
                        <option value="Private">State Private</option>
                        <option value="Deemed">Deemed University</option>
                    </select>
                </div>

                <button onClick={handleSearch} className="btn-finder-search">Search Colleges</button>
            </div>

            {loading ? (
                <div className="loading-state">Loading data from all states...</div>
            ) : (
                <div className="results-section">
                    <h3>Found {filteredColleges.length} Colleges</h3>
                    <div className="results-grid">
                        {filteredColleges.map((col, idx) => (
                            <div key={idx} className="college-card">
                                <div className="card-header">
                                    <span className={`badge ${col.type === 'Deemed' ? 'badge-deemed' : 'badge-private'}`}>{col.type}</span>
                                    <span className="badge-state">{col.state}</span>
                                </div>
                                <h4>{col.name}</h4>
                                <div className="card-details">
                                    <div className="detail-row">
                                        <span>📅 Est:</span>
                                        <strong>{col.estYear || 'N/A'}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>💰 Fees/Year:</span>
                                        <strong>₹ {(col.fee).toLocaleString('en-IN')}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>📉 Cutoff Rank:</span>
                                        <strong>{col.rank === 9999999 ? 'N/A' : col.rank.toLocaleString()}</strong>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
