// frontend/src/History.jsx
import React, { useEffect, useState } from "react";
import { getHistory } from "./api";

/**
 * Normalize Firestore timestamp -> JS Date
 * Accepts:
 *  - { _seconds: number, _nanoseconds: number }
 *  - { seconds: number, nanoseconds: number }
 *  - ISO string / Date string
 *  - number (unix ms)
 */
function toISO(ts) {
  if (!ts) return "";
  if (typeof ts === "string") {
    try { return new Date(ts).toISOString(); } catch { return ts; }
  }
  if (typeof ts === "number") {
    return new Date(ts).toISOString();
  }
  // Firestore v9 compatibility: check _seconds or seconds
  const seconds = ts._seconds ?? ts.seconds;
  const nanos = ts._nanoseconds ?? ts.nanoseconds ?? 0;
  if (typeof seconds === "number") {
    const ms = seconds * 1000 + Math.floor(nanos / 1000000);
    return new Date(ms).toISOString();
  }
  return "";
}

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const h = await getHistory();
        // normalize and sort newest first
        const normalized = (h || []).map((i) => {
          const createdAtISO = toISO(i.createdAt);
          return { ...i, createdAtISO };
        }).sort((a,b) => {
          if (!a.createdAtISO && !b.createdAtISO) return 0;
          if (!a.createdAtISO) return 1;
          if (!b.createdAtISO) return -1;
          return new Date(b.createdAtISO) - new Date(a.createdAtISO);
        });
        setItems(normalized);
      } catch (e) {
        console.warn("history load failed:", e?.message || e);
        setErr(e?.message || String(e));
        setItems([]);
      } finally { setLoading(false); }
    })();
  }, []);

  function downloadCSV() {
    const headers = ['id','createdAt','score','predictedRank','percentile','email'];
    const rows = items.map(i => {
      const date = i.createdAtISO || "";
      const score = i.score ?? "";
      const rank = i.predictedRank ?? i.rank_est ?? "";
      const pct = i.percentile ?? i.percentile_corrected ?? i.percentile_raw ?? "";
      const email = i.email ?? "";
      // escape commas/quotes by wrapping fields in quotes and escaping quotes
      const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
      return [i.id, date, score, rank, pct, email].map(esc).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'predictions.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h3>History</h3>

      <div style={{ marginBottom: 8 }}>
        <button onClick={downloadCSV} disabled={items.length===0}>Download CSV</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : err ? (
        <div style={{ color: 'crimson' }}>Failed to load history: {err}</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px 6px' }}>Date</th>
                <th style={{ padding: '8px 6px' }}>Score</th>
                <th style={{ padding: '8px 6px' }}>Predicted Rank</th>
                <th style={{ padding: '8px 6px' }}>Percentile</th>
                <th style={{ padding: '8px 6px' }}>Email</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td style={{ padding: 8 }} colSpan={5}>No history found</td></tr>
              ) : items.map(it => (
                <tr key={it.id} style={{ borderBottom: '1px solid #f4f4f4' }}>
                  <td style={{ padding: '8px 6px', whiteSpace: 'nowrap' }}>{it.createdAtISO ? new Date(it.createdAtISO).toLocaleString() : '-'}</td>
                  <td style={{ padding: '8px 6px' }}>{it.score ?? (it.input?.score ?? '')}</td>
                  <td style={{ padding: '8px 6px' }}>{it.predictedRank ?? it.rank_est ?? ''}</td>
                  <td style={{ padding: '8px 6px' }}>{(it.percentile ?? it.percentile_corrected ?? it.percentile_raw) ?? ''}</td>
                  <td style={{ padding: '8px 6px' }}>{it.email ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
