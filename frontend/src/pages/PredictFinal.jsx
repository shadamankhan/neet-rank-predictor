// frontend/src/pages/PredictFinal.jsx
import React, { useEffect, useState } from 'react';
import { predictFromScore } from '../utils/predictApi';
import { fmtNumber, fmtShort, fmtPercent } from '../utils/formatters';

import { getApiBase } from '../apiConfig';

export default function PredictFinal() {
  const [score, setScore] = useState('');
  const [year, setYear] = useState('');
  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch available years from backend (falls back to manual if unavailable)
  useEffect(() => {
    (async () => {
      setLoadingYears(true);
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/admin/list-years`);
        if (!res.ok) throw new Error('no list-years');
        const json = await res.json();
        if (json?.ok && Array.isArray(json.years) && json.years.length) {
          // sort ascending, then default to latest
          const ys = json.years.map(y => String(y)).sort();
          setYears(ys);
          setYear(ys[ys.length - 1]);
        } else {
          setYears([]);
        }
      } catch (e) {
        // ignore: let user enter year manually
        setYears([]);
      } finally {
        setLoadingYears(false);
      }
    })();
  }, []);

  function validateScore(s) {
    if (s === '' || s === null) return 'Enter a score';
    const n = Number(s);
    if (!Number.isFinite(n)) return 'Score must be a number';
    if (n < 0 || n > 720) return 'Score must be between 0 and 720';
    return null;
  }

  async function onPredict(e) {
    e?.preventDefault?.();
    setError('');
    setResult(null);

    const vErr = validateScore(score);
    if (vErr) { setError(vErr); return; }
    if (!year) { setError('Select or enter a year'); return; }

    setLoading(true);
    try {
      const resp = await predictFromScore(Number(score), Number(year));
      if (!resp?.ok) {
        throw new Error(resp?.message || 'Predict API returned error');
      }
      setResult(resp);
    } catch (err) {
      setError(err?.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }

  function renderResultCard() {
    if (!result) return null;
    const [low, high] = String(result.predictedRankRange).split('-').map(x => Number(x.replace(/[^\d]/g, '')) || 0);
    return (
      <div style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 8,
        boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
        background: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{result._fallback ? 'Fallback estimate' : 'Distribution result'}</div>
            <div style={{ color: '#666', marginTop: 6 }}>Year: {result.year} • Score: {result.score}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{fmtShort(low)}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Rank (best). Range: {result.predictedRankRange}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
          <div style={{ padding: 10, borderRadius: 8, background: '#f8f9fb' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Percentile</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtPercent(result.percentile)}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 8, background: '#f8f9fb' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Total candidates</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtNumber(result.totalCandidates)}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 8, background: '#f8f9fb' }}>
            <div style={{ fontSize: 12, color: '#666' }}>At-score count</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtNumber(result.atScoreCount)}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#555' }}>
          <strong>Note:</strong> Rank range shows best–worst possible rank for this score (inclusive). Lower is better.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 820, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 6 }}>NEET Rank Predictor</h1>
      <p style={{ color: '#444', marginTop: 0 }}>Enter your NEET score and select the year. This uses distribution-based prediction if available.</p>

      <form onSubmit={onPredict} style={{ display: 'grid', gridTemplateColumns: '220px 160px 160px auto', gap: 12, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#333', marginBottom: 6 }}>Year</label>
          {loadingYears ? (
            <div style={{ padding: 10, color: '#666' }}>Loading years...</div>
          ) : years.length ? (
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: 8, width: '100%' }}>
              <option value="">Select year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          ) : (
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Enter year (e.g. 2024)" style={{ padding: 8, width: '100%' }} />
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#333', marginBottom: 6 }}>Score</label>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="0 - 720"
            min={0}
            max={720}
            style={{ padding: 8, width: '100%' }}
          />
        </div>

        <div style={{ alignSelf: 'center' }}>
          <button type="submit" disabled={loading} style={{
            padding: '10px 16px',
            background: '#0b63ff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}>
            {loading ? 'Predicting...' : 'Predict'}
          </button>
        </div>

        <div style={{ alignSelf: 'center', color: 'red' }}>
          {error && <div>{error}</div>}
        </div>
      </form>

      {renderResultCard()}
    </div>
  );
}
