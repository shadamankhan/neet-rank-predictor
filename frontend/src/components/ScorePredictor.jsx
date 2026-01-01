// frontend/src/components/ScorePredictor.jsx
import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || ''; // use '' with CRA proxy or set full URL

export default function ScorePredictor() {
  const [score, setScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault(); // critical: prevents navigation to action URL
    setError(null);
    setResult(null);

    const numeric = Number(score);
    if (Number.isNaN(numeric)) {
      setError('Please enter a valid numeric score');
      return;
    }

    setLoading(true);
    try {
      const url = `${API_BASE}/api/predict/from-score`;
      // If you use Firebase auth and backend requires token, fetch token and add Authorization.
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: numeric })
      };

      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText || 'Request failed');
      }
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'prediction failed');
      setResult(data.prediction);
    } catch (err) {
      console.error('Prediction error', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Score:
          <input type="number" value={score} onChange={e => setScore(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>Predict</button>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {result && (
        <div>
          <h4>Prediction</h4>
          <p>Estimated rank: {result.rank ?? '—'}</p>
          <p>Percentile: {result.percentile ?? '—'}%</p>
          <pre>{JSON.stringify(result.details, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
