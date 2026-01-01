// frontend/src/components/PredictFormWithFallback.jsx
import React, { useState } from 'react';
import { predictFromScore } from '../utils/predictApi'; // ensure this helper exists

// Simple fallback estimator (linear approx between 0-720)
function fallbackEstimate(score, year, total = 240000) {
  // crude percentile: assume uniform distribution (very rough)
  const pct = (score / 720) * 100;
  const rank = Math.round((1 - pct / 100) * total);
  return {
    ok: true,
    year,
    score,
    totalCandidates: total,
    higherCount: Math.max(0, rank - 1),
    atScoreCount: 1,
    predictedRankRange: `${Math.max(1, rank)}-${Math.max(1, rank + 10)}`,
    percentile: Number(pct.toFixed(2)),
    _fallback: true
  };
}

export default function PredictFormWithFallback({ defaultYear = 2024 }) {
  const [score, setScore] = useState('');
  const [year, setYear] = useState(defaultYear);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handlePredict() {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const resp = await predictFromScore(Number(score), Number(year));
      // backend returned success
      setResult({ ...resp, _fallback: false });
    } catch (err) {
      // do fallback if backend fails or returns known error
      console.warn('Predict API failed, using fallback:', err?.message);
      const fallback = fallbackEstimate(Number(score), Number(year));
      setResult(fallback);
      setError(`Backend predict failed: ${err?.message || 'using fallback estimate'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 720 }}>
      <h2>Distribution-based NEET Rank Predictor</h2>

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
          placeholder="Enter NEET score (0-720)"
          style={{ marginLeft: 8, width: 120 }}
        />
      </div>

      <button onClick={handlePredict} disabled={!score || loading}>
        {loading ? 'Predicting...' : 'Predict'}
      </button>

      {error && <div style={{ color: 'orange', marginTop: 12 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 16, background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
          <div><strong>{result._fallback ? 'Fallback estimate' : 'Distribution result'}</strong></div>
          <div><strong>Year:</strong> {result.year}</div>
          <div><strong>Score:</strong> {result.score}</div>
          <div><strong>Predicted Rank:</strong> {result.predictedRankRange}</div>
          <div><strong>Percentile:</strong> {result.percentile}%</div>
          <div><strong>Total Candidates:</strong> {result.totalCandidates?.toLocaleString?.() ?? result.totalCandidates}</div>
          <div><strong>Higher Count:</strong> {result.higherCount?.toLocaleString?.()}</div>
          <div><strong>At Score Count:</strong> {result.atScoreCount?.toLocaleString?.()}</div>
        </div>
      )}
    </div>
  );
}
