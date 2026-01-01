import React, { useEffect, useState } from 'react';
import { getApiBase } from '../apiConfig';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './RankAnalysis.css';

const YEARS = ['2025', '2024', '2023', '2022', '2021', '2020'];
const COLORS = {
    '2025': '#ef4444', // Red for latest
    '2024': '#f97316', // Orange
    '2023': '#eab308', // Yellow
    '2022': '#22c55e', // Green
    '2021': '#06b6d4', // Cyan
    '2020': '#3b82f6', // Blue
};

export default function RankAnalysis() {
    const [trends, setTrends] = useState([]);
    const [stats, setStats] = useState([]);
    const [aiqData, setAiqData] = useState([]);
    const [marksHistory, setMarksHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [visibleYears, setVisibleYears] = useState(['2025', '2024', '2023']);

    // Marks Analyzer State
    const [selectedMarks, setSelectedMarks] = useState('');
    const [analyzedRow, setAnalyzedRow] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const base = getApiBase();
                // Use allSettled to prevent one failure from breaking everything
                const results = await Promise.allSettled([
                    axios.get(`${base}/api/analytics/rank-trends`),
                    axios.get(`${base}/api/stats/exam-overview`),
                    axios.get(`${base}/api/analytics/aiq-cutoffs`),
                    axios.get(`${base}/api/analytics/marks-rank-history`)
                ]);

                const [trendsRes, statsRes, aiqRes, marksRes] = results;

                if (trendsRes.status === 'fulfilled') {
                    setTrends(trendsRes.value.data);
                } else {
                    console.error("Trends API failed", trendsRes.reason);
                }

                if (statsRes.status === 'fulfilled') {
                    setStats(statsRes.value.data);
                } else {
                    console.error("Stats API failed", statsRes.reason);
                }

                if (aiqRes.status === 'fulfilled') {
                    setAiqData(aiqRes.value.data);
                } else {
                    console.error("AIQ API failed", aiqRes.reason);
                }

                if (marksRes.status === 'fulfilled') {
                    setMarksHistory(marksRes.value.data);
                } else {
                    console.error("Marks History API failed", marksRes.reason);
                }

            } catch (err) {
                console.error("Unexpected error in fetchData", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleYear = (year) => {
        setVisibleYears(prev =>
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
    };

    const handleAnalyzeMarks = (marks) => {
        setSelectedMarks(marks);
        const row = marksHistory.find(r => r.marks === parseInt(marks));
        setAnalyzedRow(row || null);
    };

    if (loading) return <div className="text-center p-10">Loading Data...</div>;

    return (
        <div className="rank-analysis-container">
            <header className="analysis-header">
                <h1>Rank Analysis (2020 - 2025)</h1>
                <p>Comprehensive analysis of NEET trends over the last 6 years.</p>
                <p className="text-sm font-bold text-green-600 mt-2">✨ Powered by Real Data (Including 2025 Actuals)</p>
            </header>

            {/* Exam Statistics Section */}
            <section>
                <h2 className="text-xl font-bold mb-4">Exam Statistics Overview</h2>
                <div className="stats-grid">
                    {stats.slice(0, 6).reverse().map((stat, idx) => (
                        <div key={idx} className="stat-card">
                            <h3>{stat["Exam Year"]}</h3>
                            <div className="mb-2">
                                <span className="text-sm text-gray-500">Applicants</span>
                                <div className="stat-value">{stat["Registered (Lakh)"]} L</div>
                            </div>
                            <div className="mb-2">
                                <span className="text-sm text-gray-500">Qualified</span>
                                <div className="stat-value text-green-600">{stat["Qualified (Lakh)"]} L</div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Gen Cutoff</span>
                                <div className="font-bold">{stat["Gen Marks"]}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Rank vs Marks Trend Graph */}
            <section className="chart-section">
                <h2 className="text-xl font-bold mb-4 text-center">Marks vs Rank Inflation (2016-2025)</h2>
                <p className="text-center text-gray-500 mb-6">Comparing how many marks were needed for the same rank across different years.</p>

                <div className="chart-controls">
                    {YEARS.slice(0, 6).map(year => (
                        <label key={year} className="year-toggle">
                            <input
                                type="checkbox"
                                checked={visibleYears.includes(year)}
                                onChange={() => toggleYear(year)}
                            />
                            <span style={{ color: COLORS[year], fontWeight: 'bold' }}>{year}</span>
                        </label>
                    ))}
                </div>

                <div className="responsive-chart-container" style={{ width: '100%', minHeight: '300px' }}>
                    {trends.length > 0 ? (
                        <ResponsiveContainer width="99%" height="100%" debounce={300}>
                            <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="rank"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tickCount={6}
                                    label={{ value: 'Rank', position: 'insideBottom', offset: -10 }}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    domain={[300, 720]}
                                    label={{ value: 'Marks', angle: -90, position: 'insideLeft' }}
                                    tick={{ fontSize: 12 }}
                                    width={40}
                                />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px' }} />
                                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px' }} />
                                {YEARS.map(year => (
                                    visibleYears.includes(year) && (
                                        <Line
                                            key={year}
                                            type="monotone"
                                            dataKey={year}
                                            stroke={COLORS[year]}
                                            strokeWidth={year === '2025' ? 3 : 2}
                                            dot={false}
                                            name={`'${year.slice(2)}`}
                                        />
                                    )
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-full text-gray-500">Loading Trend Data...</div>
                    )}
                </div>
            </section>

            {/* AIQ 15% Trends */}
            <section className="chart-section">
                <h2 className="text-xl font-bold mb-4 text-center">AIQ 15% Cutoff Trends</h2>
                <p className="text-center text-gray-500 mb-6 text-sm">Closing ranks (Lower is Better)</p>
                <div className="responsive-chart-container" style={{ width: '100%', minHeight: '300px' }}>
                    {aiqData.length > 0 ? (
                        <ResponsiveContainer width="99%" height="100%" debounce={300}>
                            <LineChart data={aiqData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                                <YAxis reversed={true} width={45} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line type="monotone" dataKey="GEN_UR" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} name="Gen" />
                                <Line type="monotone" dataKey="OBC" stroke="#f59e0b" strokeWidth={2} name="OBC" />
                                <Line type="monotone" dataKey="EWS" stroke="#10b981" strokeWidth={2} name="EWS" />
                                <Line type="monotone" dataKey="SC" stroke="#8b5cf6" strokeWidth={2} name="SC" />
                                <Line type="monotone" dataKey="ST" stroke="#ec4899" strokeWidth={2} name="ST" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-full text-gray-500">Loading AIQ Data...</div>
                    )}
                </div>
            </section>

            {/* Marks Analyzer Tool */}
            <section className="chart-section" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <h2 className="text-xl font-bold mb-2 text-center text-blue-800">Marks History Analyzer</h2>
                <p className="text-center text-blue-600 mb-6">See exactly what Rank a specific score got in previous years.</p>

                <div className="marks-selector-container">
                    <select
                        className="premium-dropdown"
                        value={selectedMarks}
                        onChange={(e) => handleAnalyzeMarks(e.target.value)}
                    >
                        <option value="">Select Marks to Analyze...</option>
                        {marksHistory.map(row => (
                            <option key={row.marks} value={row.marks}>{row.marks} Marks</option>
                        ))}
                    </select>
                </div>

                {analyzedRow && (
                    <div className="analyzer-results">
                        <div className="analyzer-grid">
                            {[2020, 2021, 2022, 2023, 2024, 2025].map(year => {
                                const rank = analyzedRow[year.toString()];
                                const isInflation = year >= 2024;
                                return (
                                    <div key={year} className={`year-card ${isInflation ? 'inflation' : 'stable'}`}>
                                        <div className="year-label">{year}</div>
                                        <div className="rank-value">
                                            {rank ? `#${rank.toLocaleString()}` : 'N/A'}
                                        </div>
                                        <div className="rank-tag">
                                            {year === 2025 ? 'Latest' : 'Historical'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="trend-insight">
                            <div className="insight-icon">⚠️</div>
                            <div className="insight-text">
                                <strong>Rank Inflation Alert:</strong>
                                {analyzedRow['2025'] && analyzedRow['2020'] ? (
                                    <span>
                                        For the same score of <strong>{selectedMarks}</strong>, the rank has worsened by
                                        <span className="highlight-bad"> {(analyzedRow['2025'] / analyzedRow['2020']).toFixed(1)}x </span>
                                        since 2020.
                                    </span>
                                ) : (
                                    <span> Rank has critically increased for the same score in recent years.</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Detailed Data Table (Marks vs Historical Ranks) */}
            <section className="chart-section">
                <h2 className="text-xl font-bold mb-4">Detailed Data Table: Marks vs Rank History</h2>
                <div className="table-section" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ position: 'sticky', top: 0 }}>Marks</th>
                                {visibleYears.map(year => (
                                    <th key={year} style={{ position: 'sticky', top: 0 }}>{year} Rank</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {marksHistory.map((row, index) => (
                                <tr key={index}>
                                    <td className="font-bold">{row.marks}</td>
                                    {visibleYears.map(year => (
                                        <td key={year}>
                                            {row[year] ? `#${row[year].toLocaleString()}` : '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
