// frontend/src/pages/PredictPage.jsx
import React, { useState } from 'react';
import { predictFromScore } from '../utils/predictApi';

export default function PredictPage() {
  const [score, setScore] = useState('');
  const [year, setYear] = useState(2024);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePredict() {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const r = await predictFromScore(Number(score), Number(year));
      setResult(r);
    } catch (e) {
      setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 720 }}>
      <h2>NEET Rank Predictor</h2>

      <div style={{ marginBottom: 8 }}>
        <label>Year:</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ marginLeft: 8, width: 100 }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Score:</label>
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Enter NEET score (e.g., 600)"
          style={{ marginLeft: 8, width: 120 }}
        />
      </div>

      <button onClick={handlePredict} disabled={!score || loading}>
        {loading ? 'Predicting...' : 'Predict'}
      </button>

      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 16, background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
          <div><strong>Year:</strong> {result.year}</div>
          <div><strong>Score:</strong> {result.score}</div>
          <div><strong>Predicted Rank:</strong> {result.predictedRankRange}</div>
          <div><strong>Percentile:</strong> {result.percentile}%</div>
          <div><strong>Total Candidates:</strong> {result.totalCandidates.toLocaleString()}</div>
          <div><strong>Higher Count:</strong> {result.higherCount.toLocaleString()}</div>
          <div><strong>At Score Count:</strong> {result.atScoreCount.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
