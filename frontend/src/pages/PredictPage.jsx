import React, { useState } from "react";
import { predictFromScore } from "../utils/predictApi";

export default function PredictPage() {
  const [score, setScore] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handlePredict() {
    try {
      setLoading(true);
      const r = await predictFromScore(Number(score), 2024);
      setResult(r);
      setLoading(false);
    } catch (err) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>NEET Rank Predictor</h2>

      <input
        type="number"
        value={score}
        placeholder="Enter NEET score"
        onChange={e => setScore(e.target.value)}
      />

      <button onClick={handlePredict} disabled={!score || loading}>
        {loading ? "Predicting..." : "Predict Rank"}
      </button>

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
