// src/App.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Auth from "./Auth"; // your existing Auth component
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function likelihoodColor(pct){
  if(pct >= 80) return {background:'#d4f8d4', color:'#1a7f1a'};
  if(pct >= 50) return {background:'#fff4cc', color:'#a06d00'};
  return {background:'#ffdfe0', color:'#9b0b0b'};
}

function CollegesList({ colleges }) {
  if (!colleges || colleges.length === 0) {
    return <p style={{ color: "#666" }}>No colleges suggested for this list.</p>;
  }
  return (
    <div style={{ marginTop: 12 }}>
      <ul style={{ paddingLeft: 18 }}>
        {colleges.map((c, i) => (
          <li key={i} style={{ marginBottom: 12 }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <strong>{c.college}</strong><br/>
                <small style={{color:'#555'}}>Rank range: {Number(c.min_rank).toLocaleString()}–{Number(c.max_rank).toLocaleString()}</small>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{ padding:'6px 10px', borderRadius:8, fontWeight:700, ...likelihoodColor(c.likelihood) }}>
                  {c.likelihood}% 
                </div>
                <div style={{fontSize:12, color:'#666'}}>{c.reason}</div>
              </div>
            </div>
            <div style={{ marginTop: 6, color:'#333' }}>
              Fees/yr: ₹{c.fees_per_year ? Number(c.fees_per_year).toLocaleString() : "N/A"} • seats: {c.seats}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App(){
  const [user, setUser] = useState(null);           // from Auth component
  const [useRank, setUseRank] = useState(false);
  const [score, setScore] = useState("");
  const [rankValue, setRankValue] = useState("");
  const [category, setCategory] = useState("General");
  const [stateVal, setStateVal] = useState("Default");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auth component should call onUserChange with the user object (or null)
  function handleUserChange(u) {
    setUser(u);
  }

  useEffect(() => {
    // clear saved flag when result changes
    setSaved(false);
  }, [result]);

  async function handlePredict(e){
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const payload = useRank
        ? { rank: Number(rankValue), category, state: stateVal }
        : { score: Number(score), category, state: stateVal };

      const res = await axios.post("http://localhost:4000/api/predict", payload, { timeout: 15000 });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Prediction failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(){
    if(!user) {
      alert("Please sign in to save predictions.");
      return;
    }
    if(!result){
      alert("No prediction to save.");
      return;
    }

    try {
      const doc = {
        uid: user.uid || null,
        email: user.email || null,
        input: result.input || {},
        score: result.score ?? null,
        rank_est: result.estimated_rank ?? null,
        percentile_raw: result.estimated_percentile_raw ?? null,
        percentile_corrected: result.estimated_percentile_corrected ?? null,
        colleges_suggested: result.colleges_suggested || [],
        thresholdPercentile: result.thresholdPercentile,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "predictions"), doc);
      setSaved(true);
      alert("Prediction saved to your account.");
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save prediction: " + (e.message || e));
    }
  }

  function printReport(){
    // open a new window with printable content
    if(!result){ alert("Make a prediction first"); return; }
    const win = window.open("", "_blank");
    const html = buildReportHTML(result);
    win.document.write(html);
    win.document.close();
    win.focus();
    // give browser a moment then call print
    setTimeout(()=> win.print(), 300);
  }

  function buildReportHTML(r){
    const colleges = r.colleges_suggested || [];
    const rows = colleges.map(c => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(c.college)}</td>
        <td style="padding:6px;border:1px solid #ddd">${Number(c.min_rank).toLocaleString()}–${Number(c.max_rank).toLocaleString()}</td>
        <td style="padding:6px;border:1px solid #ddd">${c.likelihood}%</td>
        <td style="padding:6px;border:1px solid #ddd">₹${c.fees_per_year ? Number(c.fees_per_year).toLocaleString() : "N/A"}</td>
      </tr>
    `).join("");
    return `
      <html>
      <head>
        <title>NEET Prediction Report</title>
        <meta charset="utf-8"/>
      </head>
      <body style="font-family: Arial, sans-serif; padding:20px">
        <h1>NEET Prediction Report</h1>
        <p><strong>Input:</strong> Score: ${r.score ?? "—"} | Rank (input): ${r.input?.rank ?? "—"} | Category: ${escapeHtml(r.input?.category ?? "")}</p>
        <p><strong>Estimated Rank:</strong> ${Number(r.estimated_rank).toLocaleString()}</p>
        <p><strong>Percentile (raw):</strong> ${r.estimated_percentile_raw} — <strong>Corrected:</strong> ${r.estimated_percentile_corrected}</p>
        <h3>Top college suggestions</h3>
        <table style="border-collapse:collapse;width:100%;max-width:900px">${rows}</table>
        <p style="margin-top:20px;color:#666">${escapeHtml(r.note || "")}</p>
      </body>
      </html>
    `;
  }

  function escapeHtml(s){
    if(!s) return "";
    return s.toString().replace(/[&<>"'`]/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;","`":"&#96;"}[m]); });
  }

  function downloadJSON(){
    if(!result){ alert("Make a prediction first"); return; }
    const data = JSON.stringify(result, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neet_prediction_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCSV(){
    if(!result){ alert("Make a prediction first"); return; }
    const cols = result.colleges_suggested || [];
    if(!cols || cols.length === 0){ alert("No college suggestions to export"); return; }
    const header = ["college","min_rank","max_rank","likelihood","fees_per_year","seats"];
    const rows = cols.map(c => [
      `"${(c.college||"").replace(/"/g,'""')}"`,
      c.min_rank,
      c.max_rank,
      c.likelihood,
      c.fees_per_year ?? "",
      c.seats
    ].join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neet_colleges_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 840, margin: "28px auto", fontFamily: "Inter, Arial, sans-serif", padding: 16 }}>
      <h1>NEET Rank Predictor</h1>

      <Auth onUserChange={handleUserChange} />

      <form onSubmit={handlePredict} style={{ marginTop: 8 }}>
        <label style={{ display:'block', marginBottom: 8 }}>
          <input type="checkbox" checked={useRank} onChange={() => setUseRank(!useRank)} /> {" "}
          Enter Rank instead of Score
        </label>

        {!useRank ? (
          <div style={{ marginBottom: 8 }}>
            <label>Score</label><br/>
            <input type="number" value={score} onChange={e=>setScore(e.target.value)} placeholder="Enter NEET Score" required style={{ padding:8, width:220 }} />
          </div>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <label>All India Rank</label><br/>
            <input type="number" value={rankValue} onChange={e=>setRankValue(e.target.value)} placeholder="Enter AIR" required style={{ padding:8, width:220 }} />
          </div>
        )}

        <div style={{ marginBottom: 8 }}>
          <label>Category</label><br/>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{ padding:8, width:220 }}>
            <option>General</option>
            <option>OBC</option>
            <option>SC</option>
            <option>ST</option>
            <option>EWS</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>State (optional)</label><br/>
          <input value={stateVal} onChange={e=>setStateVal(e.target.value)} placeholder="Default or state name" style={{ padding:8, width:320 }}/>
        </div>

        <div>
          <button type="submit" disabled={loading} style={{ padding:'8px 12px' }}>
            {loading ? "Predicting..." : "Predict"}
          </button>
          <button type="button" onClick={()=>{ setScore(""); setRankValue(""); setResult(null); setSaved(false); }} style={{ marginLeft:10 }}>Reset</button>
        </div>
      </form>

      {result && (
        <div style={{ marginTop: 20, padding: 14, border: "1px solid #eaeaea", borderRadius: 8 }}>
          <h2>Estimate</h2>
          <p><strong>Score:</strong> {result.score ?? "—"} &nbsp; <strong>Rank (est):</strong> {result.estimated_rank ? Number(result.estimated_rank).toLocaleString() : "—"}</p>
          <p><strong>Percentile (raw):</strong> {result.estimated_percentile_raw ?? "—"}</p>
          <p><strong>Percentile (corrected):</strong> {result.estimated_percentile_corrected ?? "—"}</p>

          <div style={{ marginTop: 8, padding: 10, background:'#f6f9ff', borderRadius:6 }}>
            <strong>Threshold applied:</strong> {result.thresholdPercentile}% for {result.input?.category} — max allowed rank: {result.thresholdMaxRank ? Number(result.thresholdMaxRank).toLocaleString() : "—"}
          </div>

          <div style={{ marginTop:10, display:'flex', gap:8 }}>
            <button onClick={printReport}>Print Report</button>
            <button onClick={downloadJSON}>Download JSON</button>
            <button onClick={downloadCSV}>Download CSV</button>
            <button onClick={handleSave} disabled={!user || saved} title={user ? "Save prediction to your account" : "Sign in to save"} style={{ marginLeft: 8 }}>
              {saved ? "Saved ✓" : (user ? "Save" : "Sign in to Save")}
            </button>
          </div>

          {/* grouped lists */}
          {(() => {
            const colleges = result.colleges_suggested || [];
            const filtered = colleges.filter(c => c.likelihood && c.likelihood > 0);

            const good = filtered.filter(c => c.likelihood >= 80).slice(0,3);
            const may = filtered.filter(c => c.likelihood >= 50 && c.likelihood < 80).slice(0,3);
            const tough = filtered.filter(c => c.likelihood < 50).slice(0,3);
            const nothingToShow = (good.length + may.length + tough.length) === 0;

            return (
              <div style={{ marginTop: 14 }}>
                {nothingToShow ? (
                  <div style={{ padding: 12, background: '#fff7e6', borderRadius: 6 }}>
                    No colleges matched the category threshold. Try a better score/rank or change category.
                  </div>
                ) : (
                  <>
                    {good.length > 0 && <>
                      <h3 style={{ color: '#1a7f1a' }}>Good Chances</h3>
                      <CollegesList colleges={good} />
                    </>}
                    {may.length > 0 && <>
                      <h3 style={{ color: '#a06d00', marginTop: 14 }}>May Get</h3>
                      <CollegesList colleges={may} />
                    </>}
                    {tough.length > 0 && <>
                      <h3 style={{ color: '#9b0b0b', marginTop: 14 }}>Tough Chances</h3>
                      <CollegesList colleges={tough} />
                    </>}
                  </>
                )}
              </div>
            );
          })()}

          <p style={{ color:'#666', marginTop:12 }}>{result.note}</p>
        </div>
      )}
    </div>
  );
}
