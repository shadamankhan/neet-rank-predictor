// /frontend/src/api.js

import { getApiBase } from './apiConfig';

const API_BASE = getApiBase();

/**
 * predictServer(score)
 * - score: number OR { score: number } OR object containing numeric value
 * Returns parsed JSON from backend /api/predict
 */
// predictServer({ score, year })
export async function predictServer({ score, year }) {
  const s = Number(score);
  const y = Number(year);

  if (!Number.isFinite(s)) {
    throw new Error("predictServer: invalid score (expected number).");
  }
  if (!Number.isFinite(y)) {
    throw new Error("predictServer: invalid year (expected number).");
  }

  const url = `${API_BASE}/api/predict`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score: s, year: y })
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Prediction failed: ${resp.status} ${resp.statusText} ${txt}`);
  }

  return await resp.json();
}

export async function fetchHistory(idToken) {
  const resp = await fetch(`${API_BASE}/api/history`, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Failed to fetch history: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function deletePrediction(id, idToken) {
  const resp = await fetch(`${API_BASE}/api/history/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` }
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Delete failed: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function savePrediction(data, idToken) {
  const resp = await fetch(`${API_BASE}/api/savePrediction`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Save failed: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function searchColleges(payload) {
  const resp = await fetch(`${API_BASE}/api/colleges/find`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`College search failed: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function fetchCollegeFilters() {
  const resp = await fetch(`${API_BASE}/api/colleges/filters`);
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Failed to fetch filters: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function fetchCollegeStats() {
  const resp = await fetch(`${API_BASE}/api/colleges/stats`);
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Failed to fetch stats: ${resp.status} ${txt}`);
  }
  return resp.json();
}



export async function fetchUserQueries(idToken) {
  const resp = await fetch(`${API_BASE}/api/queries/my-queries`, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Failed to fetch queries: ${resp.status} ${txt}`);
  }
  return resp.json();
}
export async function fetchMockTests(idToken) {
  const resp = await fetch(`${API_BASE}/api/user/mock-tests`, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Failed to fetch mock tests: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function addMockTest(data, idToken) {
  const resp = await fetch(`${API_BASE}/api/user/mock-tests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Failed to add mock test: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function deleteMockTest(id, idToken) {
  const resp = await fetch(`${API_BASE}/api/user/mock-tests/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` }
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Failed to delete mock test: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function fetchMarksRankHistory() {
  const resp = await fetch(`${API_BASE}/api/analytics/marks-rank-history`);
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Failed to fetch marks history: ${resp.status} ${txt}`);
  }
  return resp.json();
}

