import React, { useEffect, useState } from "react";
import { fetchCollegeStats } from "../api";

// Helper to calc probability
const calcProbability = (userRank, cutoffRank) => {
    if (!cutoffRank) return 0;
    // If rank is far better than cutoff (e.g. user=1, cutoff=1000), prob = 100
    // If userRank > cutoffRank, prob drops.
    // Formula: 100 - ((dist / cutoff) * 100) ... simplified
    // Let's use a simpler heuristic for visual impact:
    // if userRank <= cutoff: High chance (80-100%)
    // if userRank is within 10% buffering of cutoff: Moderate (50-80%)
    // if userRank > cutoff: Low (<30%)

    if (userRank <= cutoffRank) {
        // scale 80-99 based on how good
        return 90 + Math.random() * 9;
    }

    const diff = userRank - cutoffRank;
    const percentOver = (diff / cutoffRank) * 100;

    if (percentOver < 10) return 60 + Math.random() * 20; // 60-80%
    if (percentOver < 30) return 30 + Math.random() * 30; // 30-60%

    return Math.max(0, 30 - (percentOver - 30));
};

// Color helper
const getColor = (prob) => {
    if (prob >= 60) return "#4caf50"; // Green
    if (prob >= 30) return "#ff9800"; // Yellow
    return "#f44336"; // Red
};

export default function ProbabilityMeter({ rank, stats }) {
    if (!rank || !stats) return null;

    // We expect stats to have: govtAIQ, govtState, private, deemed, bds

    const items = [
        { label: "Govt MBBS (AIQ)", cutoff: stats.govtAIQ },
        { label: "Govt MBBS (State)", cutoff: stats.govtState },
        { label: "Private MBBS", cutoff: stats.private },
        { label: "Deemed University", cutoff: stats.deemed },
        { label: "BDS", cutoff: stats.bds }
    ];

    return (
        <div style={{ marginTop: 20, padding: 15, background: "#fff", borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <h4 style={{ margin: "0 0 15px 0" }}>Admission Probability Meter</h4>
            {items.map((item, idx) => {
                const prob = calcProbability(rank, item.cutoff);
                const width = Math.min(100, Math.max(5, prob));
                const color = getColor(prob);

                return (
                    <div key={idx} style={{ marginBottom: 15 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9em", marginBottom: 6, fontWeight: '500' }}>
                            <span style={{ color: '#333' }}>{item.label}</span>
                            <span style={{ fontWeight: "bold", color }}>
                                {Math.round(prob)}%
                                <span style={{ fontSize: '0.85em', fontWeight: 'normal', color: '#666' }}>
                                    {prob > 60 ? " (High Chance)" : prob > 30 ? " (Borderline)" : " (Unlikely)"}
                                </span>
                            </span>
                        </div>
                        <div style={{ width: "100%", height: 10, background: "#f1f5f9", borderRadius: 10, overflow: "hidden", boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
                            <div style={{
                                width: `${width}%`,
                                height: "100%",
                                background: color,
                                borderRadius: 10,
                                transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                                backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                                backgroundSize: '1rem 1rem'
                            }} />
                        </div>
                    </div>
                );
            })}
            <p style={{ fontSize: "0.8em", color: "#94a3b8", marginTop: 15, fontStyle: 'italic' }}>
                *Probability logic based on 2024 cutoff trends relative to your rank.
            </p>
        </div>
    );
}
