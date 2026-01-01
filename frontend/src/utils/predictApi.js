// frontend/src/utils/predictApi.js
export async function predictFromScore(score, year = 2024) {
  const base = import.meta.env.VITE_API_BASE || '';
  const res = await fetch(`${base}/api/predict/from-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, year })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Predict API error');
  }
  return res.json();
}
