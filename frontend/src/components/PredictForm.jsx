// frontend/src/components/PredictForm.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function PredictForm({ defaultYear = new Date().getFullYear() }) {
  const { user, getIdToken } = useAuth();
  const [score, setScore] = useState(500);
  const [year, setYear] = useState(defaultYear);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handlePredict(e) {
    e && e.preventDefault();
    setError("");
    setResult(null);
    if (score === "" || Number.isNaN(Number(score))) {
      setError("Please enter a numeric score.");
      return;
    }
    setLoading(true);
    try {
      const body = { score: Number(score), year: Number(year) };
      const headers = { "Content-Type": "application/json" };
      if (user && getIdToken) {
        // if backend expects auth, send token
        const token = await getIdToken(true);
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("/api/predict/from-score", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      setResult(data);
    } catch (err) {
      console.error("Predict error", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 620, margin: "12px auto", padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
      <h3>Score → Percentile & Estimated Rank</h3>

      <form onSubmit={handlePredict} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 160px" }}>
          <label style={{ display: "block", fontSize: 13 }}>Score</label>
          <input type="number" min="0" max="720" value={score} onChange={(e) => setScore(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div style={{ flex: "0 0 160px" }}>
          <label style={{ display: "block", fontSize: 13 }}>Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
            <option value={2021}>2021</option>
          </select>
        </div>

        <div>
          <button type="submit" disabled={loading} style={{ padding: "8px 14px" }}>
            {loading ? "Predicting..." : "Predict"}
          </button>
        </div>
      </form>

      {error && <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 12, padding: 12, background: "#f8f9fb", borderRadius: 6 }}>
          <div><strong>Score:</strong> {result.score}</div>
          <div><strong>Year:</strong> {result.year}</div>
          <div><strong>Percentile (≤ score):</strong> {result.percentile?.toFixed?.(6) ?? result.percentile}%</div>
          <div><strong>Total candidates (year):</strong> {result.totalCandidates?.toLocaleString?.() ?? result.totalCandidates}</div>
          <div style={{ marginTop: 6 }}>
            <strong>Estimated rank range:</strong> {result.rankRange ? `${result.rankRange[0].toLocaleString()} — ${result.rankRange[1].toLocaleString()}` : "—"}
          </div>
          <div><strong>Estimate rank (mid):</strong> {result.estimateRank?.toLocaleString?.()}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>{result.note}</div>
        </div>
      )}
    </div>
  );
}
