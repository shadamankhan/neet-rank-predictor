// src/components/PredictionHistory.jsx
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { fetchHistory, deletePrediction } from "../api";
import { SkeletonTable } from './Skeleton';

/**
 * Helper: convert Firestore Timestamp or plain value -> ISO string
 */
function toISODate(val) {
  if (!val) return "";
  // Check format: { _seconds, _nanoseconds } from backend sometimes comes as object
  if (val && typeof val._seconds === 'number') {
    return new Date(val._seconds * 1000).toLocaleString();
  }
  // Standard ISO string
  if (typeof val === 'string') {
    return new Date(val).toLocaleString();
  }
  return String(val);
}

// CSV helpers
function objectsToCsv(rows, fields) {
  const escape = (text) => {
    if (text === null || text === undefined) return "";
    const s = String(text);
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = fields.map((f) => escape(f.label)).join(",");
  const lines = rows.map((row) => fields.map((f) => {
    const v = typeof f.key === "function" ? f.key(row) : row[f.key];
    return escape(v);
  }).join(","));
  return [header, ...lines].join("\n");
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PredictionHistory({ refreshSignal }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const auth = getAuth();

  // Expose load function so parent can refresh if needed (optional)
  // or use the refreshSignal prop to re-trigger

  useEffect(() => {
    let mounted = true;

    async function load() {
      const user = auth.currentUser;
      if (!user) {
        if (mounted) { setHistory([]); setLoading(false); }
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await fetchHistory(token);
        if (mounted) {
          if (res.ok && Array.isArray(res.items)) {
            setHistory(res.items);
            setError(null);
          } else {
            setError("Failed to load data.");
          }
        }
      } catch (err) {
        console.error("History error:", err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => { mounted = false; };
  }, [auth.currentUser, refreshSignal]); // Re-run when user changes or signal changes

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this prediction?")) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await deletePrediction(id, token);
      // Remove from UI locally
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const handleExportCsv = () => {
    if (!history || !history.length) return;
    const fields = [
      { key: "id", label: "docId" },
      { key: (r) => toISODate(r.timestamp), label: "date" },
      { key: "score", label: "score" },
      { key: "year", label: "year" },
      { key: "predictedRank", label: "predictedRank" },
      { key: "percentile", label: "percentile" },
    ];
    const csv = objectsToCsv(history, fields);
    const filename = `history_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadTextFile(filename, csv);
  };

  // Gracefully hide if loading or no history to avoid UI clutter
  if (loading) return (
    <div style={{ padding: 20 }}>
      <h3>History</h3>
      <SkeletonTable rows={3} columns={4} />
    </div>
  );
  if (!history.length) return null; // Keep null if simply empty (no history)
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3>History</h3>
        <button onClick={handleExportCsv} style={{ height: 30 }}>Export CSV</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Date</th>
            <th style={{ padding: 8 }}>Score</th>
            <th style={{ padding: 8 }}>Rank</th>
            <th style={{ padding: 8 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map(item => (
            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{toISODate(item.timestamp)}</td>
              <td style={{ padding: 8 }}>
                {item.type === 'college_search' ? (
                  <span><strong>College Search</strong><br /><small>Rank: {item.rank} | {item.category}</small></span>
                ) : (
                  <span>{item.score} ({item.year})</span>
                )}
              </td>
              <td style={{ padding: 8 }}>
                {item.type === 'college_search' ? (
                  <span>Found: {item.resultCount}</span>
                ) : (
                  item.predictedRank
                )}
              </td>
              <td style={{ padding: 8 }}>
                <button onClick={() => handleDelete(item.id)} style={{ color: "red", cursor: "pointer", border: "none", background: "none" }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
