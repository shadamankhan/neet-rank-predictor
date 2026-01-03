// src/pages/Predict.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { predictApi, savePredictionApi } from "../api";

export default function Predict() {
  const { user, getIdToken } = useAuth();
  const [scoreInput, setScoreInput] = useState("");
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handlePredict() {
    setMessage("");
    setEstimate(null);
    const s = Number(scoreInput);
    if (!Number.isFinite(s) || s < 0 || s > 720) {
      setMessage("Enter a valid score (0-720)");
      return;
    }
    setLoading(true);
    try {
      const res = await predictApi(s, "NEET");
      setEstimate(res);
      setMessage("Estimate ready");
      if (user) {
        const idToken = await getIdToken();
        const payload = {
          year: 2026,
          score: res.score,
          predictedRank: res.predictedRank,
          percentile: res.percentile,
          extra: { note: "Saved from frontend" }
        };
        await savePredictionApi(idToken, payload);
        setMessage((m) => m + " | Saved to history");
      }
    } catch (err) {
      console.error(err);
      setMessage("Predict error: " + (err && err.message ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <h2>Predict</h2>
      <label>
        Enter Score
        <input
          type="number"
          value={scoreInput}
          onChange={(e) => setScoreInput(e.target.value)}
          placeholder="0 - 720"
          style={{ marginLeft: 8, padding: 6, width: 120 }}
        />
      </label>

      <div style={{ marginTop: 8 }}>
        <button onClick={handlePredict} disabled={loading} style={{ padding: "8px 14px", marginRight: 8 }}>
          Estimate
        </button>
        <button onClick={() => { setScoreInput(""); setEstimate(null); }} style={{ padding: "6px 10px" }}>
          Clear
        </button>
      </div>

      {estimate && (
        <div style={{ marginTop: 12, background: "#f8f8f8", padding: 8, borderRadius: 6 }}>
          <h3>Result</h3>
          <div>Score: {estimate.score}</div>
          <div>Percentile: {estimate.percentile.toFixed(2)}</div>
          <div>Predicted Rank: {estimate.predictedRank}</div>
        </div>
      )}

      <div style={{ marginTop: 12, color: "#444" }}>{message}</div>
    </div>
  );
}
