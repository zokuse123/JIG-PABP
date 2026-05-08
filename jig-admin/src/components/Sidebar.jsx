import React from "react";

const NAV_ITEMS = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "booking",   icon: "📋", label: "Booking" },
  { id: "mobil",     icon: "🚙", label: "Monitoring Mobil" },
  { id: "keuangan",  icon: "💰", label: "Keuangan" },
  { id: "sync",      icon: "🔄", label: "Sync Data" },
];

export default function Sidebar({ active, setActive, onLogout }) {
  return (
    <aside
      style={{
        width: 220,
        background: "#fff",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        boxShadow: "1px 0 0 #e2e8f0",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: "#16a34a" }}>🚙 JIG</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Operasional Jeep Admin</div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map((n) => (
          <button
            key={n.id}
            onClick={() => setActive(n.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              border: "none",
              borderRadius: 9,
              cursor: "pointer",
              marginBottom: 3,
              background: active === n.id ? "#f0fdf4" : "transparent",
              color: active === n.id ? "#16a34a" : "#475569",
              fontWeight: active === n.id ? 700 : 500,
              fontSize: 14,
              transition: "all .15s",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #f1f5f9" }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            border: "none",
            borderRadius: 9,
            cursor: "pointer",
            background: "transparent",
            color: "#ef4444",
            fontWeight: 600,
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          <span>🚪</span>Keluar
        </button>
      </div>
    </aside>
  );
}
