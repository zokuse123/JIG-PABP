import React, { useState } from "react";
import Card from "../components/Card";

const STATE = { idle: "idle", loading: "loading", success: "success", error: "error" };

export default function SyncPage({ syncFromSheets, loading }) {
  const [state, setState]     = useState(STATE.idle);
  const [result, setResult]   = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = async () => {
    setState(STATE.loading);
    setResult(null);
    try {
      const res = await syncFromSheets();
      setResult(res);
      setLastSync(new Date().toLocaleString("id-ID"));
      setState(STATE.success);
    } catch {
      setState(STATE.error);
    }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontWeight: 800, fontSize: 20, margin: "0 0 18px" }}>Sinkronisasi Data</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 800 }}>
        {/* Sync Card */}
        <Card>
          <h3 style={{ fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>Sync dari Google Sheets</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>
            Tarik data booking terbaru dari Google Sheets melalui endpoint API backend.
          </p>

          {/* Status messages */}
          {state === STATE.success && (
            <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#166534", fontWeight: 600 }}>
              ✅ Sync berhasil!{" "}
              {result?.simulated
                ? "1 data simulasi ditambahkan (backend belum tersedia)."
                : `${result?.count || 0} data baru diterima.`}
            </div>
          )}
          {state === STATE.error && (
            <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991b1b", fontWeight: 600 }}>
              ❌ Gagal terhubung ke server. Pastikan backend berjalan.
            </div>
          )}

          {/* Tombol Sync */}
          <button
            onClick={handleSync}
            disabled={state === STATE.loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 22px",
              fontWeight: 700,
              fontSize: 14,
              cursor: state === STATE.loading ? "not-allowed" : "pointer",
              opacity: state === STATE.loading ? 0.75 : 1,
              fontFamily: "inherit",
              transition: "opacity .15s",
            }}
          >
            <span style={{ display: "inline-block" }} className={state === STATE.loading ? "spin" : ""}>🔄</span>
            {state === STATE.loading ? "Mengambil data..." : "Sync Sekarang"}
          </button>

          {lastSync && (
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
              Terakhir sync: {lastSync}
            </p>
          )}
        </Card>

        {/* Info Card */}
        <Card style={{ background: "#f8fafc" }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, margin: "0 0 14px" }}>Info Endpoint</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Method",  "GET"],
              ["Endpoint", "/sync-bookings"],
              ["Base URL", process.env.REACT_APP_API_URL || "http://localhost:5000/api"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", width: 72, flexShrink: 0 }}>{k}</span>
                <code style={{ fontSize: 12, background: "#e2e8f0", borderRadius: 5, padding: "2px 8px", color: "#1a1a1a" }}>{v}</code>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, padding: "12px", background: "#fef9c3", borderRadius: 8, fontSize: 12, color: "#854d0e" }}>
            💡 <strong>Backend belum siap?</strong> Tidak masalah — data dummy digunakan secara otomatis sebagai fallback.
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: "#64748b", marginBottom: 8 }}>Expected Response Format</div>
            <pre style={{ fontSize: 11, background: "#1e293b", color: "#86efac", borderRadius: 8, padding: "12px", overflow: "auto" }}>
{`[
  {
    "id": 101,
    "customer": "Nama Customer",
    "phone": "081234567890",
    "date": "2025-05-15",
    "destination": "Kawah Putih",
    "hargaDeal": 850000,
    "dp": 300000,
    "status": "pending"
  }
]`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
