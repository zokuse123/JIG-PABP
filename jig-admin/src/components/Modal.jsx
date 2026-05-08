import React, { useEffect } from "react";

/**
 * Modal overlay reusable
 */
export default function Modal({ title, onClose, children, width = 560 }) {
  // Tutup dengan tombol ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="fade-in"
        style={{
          background: "#fff",
          borderRadius: 14,
          width: `min(${width}px, 100%)`,
          maxHeight: "90vh",
          overflow: "auto",
          padding: 24,
          boxShadow: "0 8px 32px rgba(0,0,0,.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#f1f5f9",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 18,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
