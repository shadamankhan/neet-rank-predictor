import React, { useState, useEffect } from "react";

// Mock ranges for slider visual
const STEPS = [
    { value: 500000, label: "₹5L" },
    { value: 1000000, label: "₹10L" },
    { value: 1500000, label: "₹15L" },
    { value: 2000000, label: "₹20L" },
    { value: 2500000, label: "₹25L+" }
];

export default function FeeSlider({ rank, results = [], onFilter }) {
    const [budget, setBudget] = useState(1500000); // Default 15L

    useEffect(() => {
        // Filter logic: Fee <= Budget AND Reachable (ClosingRank >= UserRank)
        // Since results are already filtered by server for validity (mostly), we focus on Budget here
        // We can also double check rank validity if we want strictly "Safe" options

        // Pass filtered count or items back
        if (onFilter) {
            onFilter(budget);
        }
    }, [budget, results, onFilter]);

    return (
        <div style={{ marginTop: 20, padding: 15, background: "#fff", borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>Fee Budget Filter</h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: "0.9em", color: "#666" }}>Current Budget:</span>
                <strong style={{ color: "#007bff" }}>₹{(budget / 100000).toFixed(1)} Lakhs / yr</strong>
            </div>

            <input
                type="range"
                min="10000"
                max="4500000"
                step="100000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                style={{ width: "100%", cursor: "pointer" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8em", color: "#999" }}>
                <span>₹10k</span>
                <span>₹22.5L</span>
                <span>₹45L+</span>
            </div>

            <div style={{ marginTop: 15 }}>
                <h5 style={{ margin: "0 0 5px 0", fontSize: "0.95em" }}>Affordable Options at Rank {rank}:</h5>
                {/* Visual feedback of what's available */}
                <div style={{ maxHeight: 150, overflowY: "auto", fontSize: "0.85em" }}>
                    {results.length === 0 && <span style={{ color: "#999" }}>No prediction results loaded yet.</span>}
                </div>
            </div>
        </div>
    );
}
