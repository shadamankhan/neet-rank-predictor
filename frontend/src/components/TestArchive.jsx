import React, { useEffect, useState } from "react";
import { fetchHistory } from "../api";
import { useAuth } from "../useAuth";

/**
 * Normalize Firestore timestamp -> JS Date
 */
function toISO(ts) {
    if (!ts) return "";
    if (typeof ts === "string") {
        try { return new Date(ts).toISOString(); } catch { return ts; }
    }
    if (typeof ts === "number") {
        return new Date(ts).toISOString();
    }
    const seconds = ts._seconds ?? ts.seconds;
    const nanos = ts._nanoseconds ?? ts.nanoseconds ?? 0;
    if (typeof seconds === "number") {
        const ms = seconds * 1000 + Math.floor(nanos / 1000000);
        return new Date(ms).toISOString();
    }
    return "";
}

export default function TestArchive() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Only fetch if open to save resources
        if (isOpen && items.length === 0 && user) {
            loadHistory();
        }
    }, [isOpen, user]);

    const loadHistory = async () => {
        if (!user) return;
        setLoading(true);
        setErr(null);
        try {
            const token = await user.getIdToken();
            const h = await fetchHistory(token);
            const normalized = (h || []).map((i) => {
                const createdAtISO = toISO(i.createdAt);
                return { ...i, createdAtISO };
            }).sort((a, b) => {
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
    };

    return (
        <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl">📂</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-slate-700 text-sm">Legacy Prediction Archive</h3>
                        <p className="text-xs text-slate-500">View your old rank prediction history</p>
                    </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isOpen && (
                <div className="p-4 bg-white border-t border-slate-200 animate-fade-in">
                    {loading ? (
                        <div className="text-center py-4 text-slate-500 text-sm">Loading archive...</div>
                    ) : err ? (
                        <div className="text-center py-4 text-red-500 text-sm">Failed to load: {err}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Score</th>
                                        <th className="px-4 py-3">Predicted Rank</th>
                                        <th className="px-4 py-3">Percentile</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                        <tr><td className="px-4 py-4 text-center text-slate-400" colSpan={4}>No history found</td></tr>
                                    ) : items.map(it => (
                                        <tr key={it.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{it.createdAtISO ? new Date(it.createdAtISO).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{it.score ?? (it.input?.score ?? '')}</td>
                                            <td className="px-4 py-3 text-blue-600 font-bold">{it.predictedRank ?? it.rank_est ?? ''}</td>
                                            <td className="px-4 py-3 text-slate-600">{(it.percentile ?? it.percentile_corrected ?? it.percentile_raw) ?? ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
