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
        <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "120px 20px 40px",
            minHeight: "80vh",
            fontFamily: "'Inter', sans-serif"
        }}>

            {/* Header Section */}
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{
                    fontSize: "2.5rem",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "15px"
                }}>
                    State Quota College Finder
                </h1>
                <p style={{
                    fontSize: "1.1rem",
                    color: "var(--text-secondary)",
                    maxWidth: "600px",
                    margin: "0 auto",
                    lineHeight: "1.6"
                }}>
                    Enter your rank to discover MBBS colleges available under State Quota (85%) & AIQ (15%). Filter by category, quota, and state.
                </p>
            </div>

            <div style={{
                background: "var(--bg-card)",
                padding: "30px",
                borderRadius: "20px",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
                border: "1px solid var(--border)",
                marginBottom: "40px"
            }}>
                <form onSubmit={handleSubmit} style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "20px",
                    alignItems: "end"
                }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-secondary)", fontSize: "0.9rem" }}>NEET All India Rank *</label>
                        <input
                            type="number"
                            name="rank"
                            value={formData.rank}
                            onChange={handleChange}
                            placeholder="e.g. 25000"
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid var(--border)",
                                fontSize: "1rem",
                                background: "var(--bg-main)",
                                color: "var(--text-primary)"
                            }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid var(--border)",
                                fontSize: "1rem",
                                background: "var(--bg-main)",
                                color: "var(--text-primary)"
                            }}
                        >
                            <option value="GN">General (GN)</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-secondary)", fontSize: "0.9rem" }}>State (Optional)</label>
                        <select
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid var(--border)",
                                fontSize: "1rem",
                                background: "var(--bg-main)",
                                color: "var(--text-primary)"
                            }}
                        >
                            <option value="">All States</option>
                            {filters.states.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Quota (Optional)</label>
                        <select
                            name="quota"
                            value={formData.quota}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid var(--border)",
                                fontSize: "1rem",
                                background: "var(--bg-main)",
                                color: "var(--text-primary)"
                            }}
                        >
                            <option value="">All Quotas</option>
                            {filters.quotas.map(q => (
                                <option key={q} value={q}>{q}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "12px",
                                backgroundColor: loading ? "#94a3b8" : "var(--primary)",
                                color: "white",
                                border: "none",
                                borderRadius: "10px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontWeight: "700",
                                fontSize: "1rem",
                                transition: "all 0.2s"
                            }}
                        >
                            {loading ? "Analyzing..." : "Find Colleges 🔍"}
                        </button>
                    </div>
                </form>

                {error && (
                    <div style={{
                        padding: "16px",
                        backgroundColor: "#fef2f2",
                        color: "#dc2626",
                        marginTop: "20px",
                        borderRadius: "10px",
                        border: "1px solid #fecaca",
                        textAlign: "center"
                    }}>
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)" }}>
                            Found <span style={{ color: "var(--primary)" }}>{results.length}</span> Colleges
                        </h2>
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
                        }} style={{
                            padding: "8px 16px",
                            cursor: "pointer",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--text-secondary)",
                            fontWeight: "500"
                        }}>
                            📥 Download CSV
                        </button>
                    </div>
                    <div style={{ overflowX: "auto", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid var(--border)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--bg-card)" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
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
                                    <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ ...tdStyle, fontWeight: "600", color: "var(--primary)" }}>{item.college_name}</td>
                                        <td style={tdStyle}>{item.state || "-"}</td>
                                        <td style={tdStyle}>{item.quota || "-"}</td>
                                        <td style={tdStyle}>{item.category}</td>
                                        <td style={tdStyle}>{item.round}</td>
                                        <td style={{ ...tdStyle, fontWeight: "700" }}>{item.closing_rank}</td>
                                        <td style={tdStyle}>{item.closing_score}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                background: item.type === "Govt" ? "#dcfce7" : "#fff1f2",
                                                color: item.type === "Govt" ? "#166534" : "#9f1239",
                                                fontSize: "0.8rem",
                                                fontWeight: "600"
                                            }}>
                                                {item.type || "Pvt"}
                                            </span>
                                        </td>
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

const thStyle = { padding: "16px", borderBottom: "1px solid var(--border)", color: "#64748b", fontWeight: "600", fontSize: "0.9rem", textTransform: "uppercase" };
const tdStyle = { padding: "16px", color: "var(--text-primary)", fontSize: "0.95rem" };
