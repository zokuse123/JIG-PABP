import React from "react";
import Card from "./Card";

/**
 * Kartu statistik di Dashboard
 */
export default function StatCard({ icon, label, value, sub, color = "#16a34a" }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: color + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>
            {value}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </Card>
  );
}
