import React, { useState } from "react";

// Kredensial default — ganti dengan auth backend di produksi
const VALID_USER = "admin";
const VALID_PASS = "jig2025";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    // Simulasi async (ganti dengan API call di produksi)
    await new Promise((r) => setTimeout(r, 600));
    if (username === VALID_USER && password === VALID_PASS) {
      localStorage.setItem("jig_token", "dummy-token-123");
      onLogin();
    } else {
      setError("Username atau password salah.");
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      }}
    >
      <div
        className="fade-in"
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "40px 36px",
          width: 360,
          boxShadow: "0 4px 24px rgba(22,163,74,.12)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🚙</div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: "#16a34a", margin: 0 }}>JIG Admin</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Monitoring Operasional Jeep</p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 13,
              marginBottom: 14,
              fontWeight: 500,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Username</label>
          <input
            style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Password</label>
          <input
            type="password"
            style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#86efac" : "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "11px 0",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "background .15s",
          }}
        >
          {loading ? "Memverifikasi..." : "Masuk"}
        </button>

        <p style={{ marginTop: 14, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
          Demo: <strong>admin</strong> / <strong>jig2025</strong>
        </p>
      </div>
    </div>
  );
}
