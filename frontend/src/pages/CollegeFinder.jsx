import React, { useState } from 'react';
import { searchColleges, fetchCollegeFilters } from '../api';
import { getAuth } from "firebase/auth";

export default function CollegeFinder() {
    const [formData, setFormData] = useState({
        rank: '',
        category: 'GN',
        state: '',
        quota: ''
    });
    const [filters, setFilters] = useState({ states: [], quotas: [] });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        // Load filters
        fetchCollegeFilters().then(data => {
            if (data.ok) {
                setFilters({ states: data.states, quotas: data.quotas });
            }
        }).catch(err => console.error("Filter load error", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.rank) {
            setError("Please enter a rank");
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const payload = {
                rank: Number(formData.rank),
                category: formData.category,
                state: formData.state || undefined,
                quota: formData.quota || undefined
            };

            // Function to get token safely
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                try {
                    const token = await user.getIdToken();
                    payload.idToken = token;
                } catch (e) {
                    console.warn("Could not get token for history saving", e);
                }
            }

            const data = await searchColleges(payload);
            if (data.ok) {
                setResults(data.results);
                if (data.results.length === 0) {
                    setError("No colleges found matching your criteria.");
                }
            } else {
                setError(data.message || "Failed to fetch colleges");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
            <h1>NEET College Predictor 2026</h1>
            <p>Find colleges based on your NEET Rank and Score.</p>

            <form onSubmit={handleSubmit} style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "10px",
                marginBottom: "20px",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9"
            }}>
                <div>
                    <label style={{ display: "block", marginBottom: "5px" }}>NEET Rank *</label>
                    <input
                        type="number"
                        name="rank"
                        value={formData.rank}
                        onChange={handleChange}
                        placeholder="Enter your All India Rank"
                        style={{ width: "100%", padding: "8px" }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "5px" }}>Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "8px" }}
                    >
                        <option value="GN">General (GN)</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "5px" }}>State (Optional)</label>
                    <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "8px" }}
                    >
                        <option value="">All States</option>
                        {filters.states.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "5px" }}>Quota (Optional)</label>
                    <select
                        name="quota"
                        value={formData.quota}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "8px" }}
                    >
                        <option value="">All Quotas</option>
                        {filters.quotas.map(q => (
                            <option key={q} value={q}>{q}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: loading ? "#ccc" : "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: loading ? "not-allowed" : "pointer"
                        }}
                    >
                        {loading ? "Searching..." : "Find Colleges"}
                    </button>
                </div>
            </form>

            {error && (
                <div style={{ padding: "10px", backgroundColor: "#ffebee", color: "#c62828", marginBottom: "20px", borderRadius: "4px" }}>
                    {error}
                </div>
            )}

            {results.length > 0 && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2>Results ({results.length})</h2>
                        <button onClick={() => {
                            // Quick CSV export
                            const headers = ["College Name", "State", "Quota", "Category", "Round", "Closing Rank", "Score", "Type"];
                            const csvRows = [headers.join(",")];
                            results.forEach(r => {
                                const row = [
                                    `"${r.college_name}"`,
                                    r.state,
                                    r.quota,
                                    r.category,
                                    r.round,
                                    r.closing_rank,
                                    r.closing_score,
                                    r.type
                                ];
                                csvRows.push(row.join(","));
                            });
                            const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "college_results.csv";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }} style={{ padding: "5px 10px", cursor: "pointer" }}>
                            Download CSV
                        </button>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f0f0f0", textAlign: "left" }}>
                                    <th style={thStyle}>College Name</th>
                                    <th style={thStyle}>State</th>
                                    <th style={thStyle}>Quota</th>
                                    <th style={thStyle}>Category</th>
                                    <th style={thStyle}>Round</th>
                                    <th style={thStyle}>Closing Rank</th>
                                    <th style={thStyle}>Score</th>
                                    <th style={thStyle}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                                        <td style={tdStyle}>{item.college_name}</td>
                                        <td style={tdStyle}>{item.state || "-"}</td>
                                        <td style={tdStyle}>{item.quota || "-"}</td>
                                        <td style={tdStyle}>{item.category}</td>
                                        <td style={tdStyle}>{item.round}</td>
                                        <td style={tdStyle}>{item.closing_rank}</td>
                                        <td style={tdStyle}>{item.closing_score}</td>
                                        <td style={tdStyle}>{item.type || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: "10px", borderBottom: "2px solid #ddd" };
const tdStyle = { padding: "10px" };
