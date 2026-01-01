import React from "react";

export default function ParentModeToggle({ isParentMode, onToggle }) {
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#e3f2fd", padding: "8px 12px", borderRadius: 20 }}>
            <span style={{ fontSize: "0.9em", fontWeight: isParentMode ? "normal" : "bold", cursor: "pointer", opacity: isParentMode ? 0.6 : 1 }} onClick={() => onToggle(false)}>
                🧑‍🎓 Student
            </span>

            <div
                onClick={() => onToggle(!isParentMode)}
                style={{
                    width: 36, height: 20, background: isParentMode ? "#4caf50" : "#ccc", borderRadius: 10, position: "relative", cursor: "pointer", transition: "background 0.3s"
                }}
            >
                <div style={{
                    position: "absolute", top: 2, left: isParentMode ? 18 : 2, width: 16, height: 16, background: "white", borderRadius: "50%", transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                }} />
            </div>

            <span style={{ fontSize: "0.9em", fontWeight: isParentMode ? "bold" : "normal", cursor: "pointer", opacity: isParentMode ? 1 : 0.6 }} onClick={() => onToggle(true)}>
                👨‍👩‍👦 Parent Mode
            </span>
        </div>
    );
}
