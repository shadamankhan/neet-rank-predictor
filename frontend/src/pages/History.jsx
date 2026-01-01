// src/pages/History.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { historyApi } from "../api";

function parseCreatedAt(item) {
  if (!item) return null;
  if (item.createdAt && typeof item.createdAt === "string") {
    const d = new Date(item.createdAt);
    return isNaN(d.getTime()) ? null : d;
  }
  if (item.createdAt && item.createdAt.toDate) {
    try { return item.createdAt.toDate(); } catch (e) {}
  }
  if (item.createdAt && item.createdAt._seconds) return new Date(item.createdAt._seconds * 1000);
  if (item.createdAtRaw && item.createdAtRaw._seconds) return new Date(item.createdAtRaw._seconds * 1000);
  if (item.createdAtRaw && typeof item.createdAtRaw === "string") {
    const d = new Date(item.createdAtRaw);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
function formatDateForDisplay(item) {
  const d = parseCreatedAt(item);
  if (!d) return "—";
  return d.toLocaleString();
}
function safeNumber(n) {
  if (n === null || n === undefined) return "—";
  const x = Number(n);
  return Number.isFinite(x) ? x : "—";
}

export default function History() {
  const { user, getIdToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadHistory() {
    setMessage("");
    if (!user) {
      setMessage("Log in to view history");
      return;
    }
    setLoading(true);
    try {
      const idToken = await getIdToken();
      const hist = await historyApi(idToken);
      setHistory(hist);
      setMessage("History loaded");
    } catch (err) {
      console.error(err);
      setMessage("History error: " + (err && err.message ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  function toCsvSafe(history) {
    const headers = ["id","uid","email","score","predictedRank","percentile","createdAt"];
    const rows = (history || []).map(h => {
      let iso = "";
      try {
        if (!h) return ["", "", "", "", "", "", ""];
        if (h.createdAt && typeof h.createdAt === "string") {
          const d = new Date(h.createdAt);
          if (!isNaN(d.getTime())) iso = d.toISOString();
        } else if (h.createdAt && h.createdAt.toDate) {
          try { iso = h.createdAt.toDate().toISOString(); } catch (e) {}
        } else if (h.createdAt && h.createdAt._seconds) {
          iso = new Date(h.createdAt._seconds * 1000).toISOString();
        } else if (h.createdAtRaw && typeof h.createdAtRaw === "string") {
          const d = new Date(h.createdAtRaw);
          if (!isNaN(d.getTime())) iso = d.toISOString();
        } else if (h.createdAtRaw && h.createdAtRaw._seconds) {
          iso = new Date(h.createdAtRaw._seconds * 1000).toISOString();
        }
      } catch (e) {
        iso = "";
      }
      const score = (h && (h.score !== undefined && h.score !== null)) ? String(h.score) : "";
      const pr = (h && h.predictedRank) ? String(h.predictedRank) : "";
      const pct = (h && (h.percentile !== undefined && h.percentile !== null)) ? String(h.percentile) : "";
      return [
        h?.id || "",
        h?.uid || "",
        h?.email || "",
        score,
        pr,
        pct,
        iso
      ];
    });
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
      .join("\r\n");
    return csv;
  }

  function downloadCSV() {
    try {
      if (!history || history.length === 0) {
        setMessage("No history to download");
        return;
      }
      const csv = toCsvSafe(history);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", "neet_history.csv");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage("CSV downloaded");
    } catch (err) {
      console.error("CSV download failed:", err);
      setMessage("CSV download failed: " + (err && err.message ? err.message : String(err)));
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <h2>History</h2>

      <div style={{ marginBottom: 8 }}>
        <button onClick={loadHistory} disabled={loading} style={{ padding: "6px 10px", marginRight: 8 }}>History</button>
        <button onClick={downloadCSV} style={{ padding: "6px 10px" }}>Download CSV</button>
      </div>

      <div>
        {history.length === 0 ? (
          <div>[]</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ddd" }}>When</th>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ddd" }}>Score</th>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ddd" }}>Percentile</th>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ddd" }}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>{formatDateForDisplay(h)}</td>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>{safeNumber(h.score)}</td>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>
                    {typeof h.percentile !== "undefined" && h.percentile !== null ? Number(h.percentile).toFixed(2) : "—"}
                  </td>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>{h.predictedRank || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 12, color: "#444" }}>{message}</div>
    </div>
  );
}
