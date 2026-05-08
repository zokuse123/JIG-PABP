import React, { useState } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import FormField from "../components/FormField";
import { STATUS_CAR } from "../data/dummy";

export default function MobilPage({ cars, updateCar }) {
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState({});

  const openEdit = (c) => { setForm({ ...c }); setModal(c.id); };

  const handleSave = async () => {
    await updateCar(modal, form);
    setModal(null);
  };

  const count = (s) => cars.filter((c) => c.status === s).length;

  return (
    <div className="fade-in">
      <h2 style={{ fontWeight: 800, fontSize: 20, margin: "0 0 18px" }}>Monitoring Armada</h2>

      {/* Stat mini */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard icon="✅" label="Tersedia"    value={count("available")}   color="#16a34a" />
        <StatCard icon="🚗" label="Dalam Trip"  value={count("on_trip")}     color="#2563eb" />
        <StatCard icon="🔧" label="Perawatan"   value={count("maintenance")} color="#d97706" />
      </div>

      {/* Car grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {cars.map((c) => (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
              <Badge status={c.status} map={STATUS_CAR} />
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Tipe: <strong>{c.type}</strong> · Tahun <strong>{c.year}</strong>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
              <span
                style={{
                  fontSize: 12,
                  background: c.label === "internal" ? "#f0fdf4" : "#eff6ff",
                  color: c.label === "internal" ? "#16a34a" : "#2563eb",
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontWeight: 600,
                }}
              >
                {c.label === "internal" ? "🏠 Internal" : "🌐 External"}
              </span>
              {c.driver && (
                <span style={{ fontSize: 12, color: "#94a3b8" }}>👤 {c.driver}</span>
              )}
            </div>
            <button
              onClick={() => openEdit(c)}
              style={{
                width: "100%",
                border: "1.5px solid #e2e8f0",
                borderRadius: 8,
                padding: "7px 0",
                cursor: "pointer",
                background: "#fff",
                fontWeight: 600,
                fontSize: 13,
                color: "#475569",
                fontFamily: "inherit",
              }}
            >
              Edit Status
            </button>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title="Edit Mobil" onClose={() => setModal(null)} width={420}>
          <div style={{ display: "grid", gap: 12 }}>
            <FormField label="Nama Mobil" value={form.name || ""} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Status"
                type="select"
                value={form.status || ""}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                options={Object.entries(STATUS_CAR).map(([k, v]) => [k, v.label])}
              />
              <FormField
                label="Label"
                type="select"
                value={form.label || ""}
                onChange={(v) => setForm((f) => ({ ...f, label: v }))}
                options={[["internal", "🏠 Internal"], ["external", "🌐 External"]]}
              />
            </div>
            <FormField label="Driver (jika ada)" value={form.driver || ""} onChange={(v) => setForm((f) => ({ ...f, driver: v }))} placeholder="Kosongkan jika tidak ada" />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => setModal(null)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "9px 20px", cursor: "pointer", background: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
            >
              Simpan
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
