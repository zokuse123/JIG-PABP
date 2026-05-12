import React, { useState, useEffect, useCallback } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import FormField from "../components/FormField";
import { STATUS_BOOKING } from "../data/dummy";
import { formatRupiah, formatDate, cekBentrok } from "../utils/format";
import { bookingApi } from "../utils/api";

const EMPTY_FORM = {
  customer: "",
  phone: "",
  date: "",
  destination: "",
  car: "",
  driver: "",
  notes: "",
  hargaDeal: "",
  dp: "",
  feeDriver: "",
  biayaTambahan: "",  
  status: "pending",
};

const getBookingRows = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.bookings)) return res.bookings;
  return [];
};

const mapBookingFromApi = (b) => ({
  id: b.id,
  customer: b.nama_customer || "",
  phone: b.no_hp_customer || "",
  date: b.tanggal ? String(b.tanggal).slice(0, 10) : "",
  destination: b.paket || "",
  car: b.car || "",
  driver: b.driver || "",
  notes: b.notes || "",
  hargaDeal: Number(b.harga_deal) || 0,
  dp: Number(b.dp) || 0,
  feeDriver: Number(b.fee_driver) || 0,
  biayaTambahan: Number(b.biaya_tambahan) || 0,
  status: b.status || "pending",
});

const mapBookingToApi = (form) => ({
  nama_customer: form.customer,
  no_hp_customer: form.phone,
  paket: form.destination,
  tanggal: form.date,
  status: form.status,
  harga_deal: Number(form.hargaDeal) || 0,
});

export default function BookingPage({ cars = [] }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [bentrok, setBentrok] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await bookingApi.getAll();
      const rows = getBookingRows(res);
      setBookings(rows.map(mapBookingFromApi));
    } catch (err) {
      setError(err.message || "Gagal mengambil data booking.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    const keyword = search.toLowerCase();
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch =
      !search ||
      b.customer.toLowerCase().includes(keyword) ||
      b.destination?.toLowerCase().includes(keyword);

    return matchStatus && matchSearch;
  });

  const handleFormChange = useCallback(
    (key, val) => {
      setForm((prev) => {
        const updated = { ...prev, [key]: val };

        if (key === "date" || key === "car") {
          setBentrok(cekBentrok(bookings, updated.date, updated.car, modal?.id));
        }

        return updated;
      });
    },
    [bookings, modal]
  );

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setBentrok(false);
    setModal({ mode: "add" });
  };

  const openEdit = (b) => {
    setForm({
      ...EMPTY_FORM,
      ...b,
      hargaDeal: b.hargaDeal,
      dp: b.dp,
      feeDriver: b.feeDriver,
      biayaTambahan: b.biayaTambahan,
    });
    setBentrok(false);
    setModal({ mode: "edit", id: b.id });
  };

  const handleSave = async () => {
    try {
      const payload = mapBookingToApi(form);

      if (modal.mode === "add") {
        await bookingApi.create(payload);
      } else {
        await bookingApi.update(modal.id, payload);
      }

      setModal(null);
      await fetchBookings();
    } catch (err) {
      setError(err.message || "Gagal menyimpan booking.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus booking ini?")) return;

    try {
      await bookingApi.delete(id);
      await fetchBookings();
    } catch (err) {
      setError(err.message || "Gagal menghapus booking.");
    }
  };

  const availCars = cars.filter((c) => c.status !== "maintenance");

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>Manajemen Booking</h2>
        <button
          onClick={openAdd}
          style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Tambah Booking
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "8px 14px", fontSize: 14, width: 260, outline: "none", fontFamily: "inherit" }}
          placeholder="Cari customer / destinasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Status */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", ...Object.keys(STATUS_BOOKING)].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              border: "1.5px solid",
              borderColor: filterStatus === s ? "#16a34a" : "#e2e8f0",
              borderRadius: 20,
              padding: "4px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: filterStatus === s ? "#16a34a" : "#fff",
              color: filterStatus === s ? "#fff" : "#475569",
              fontFamily: "inherit",
            }}
          >
            {s === "all" ? "Semua" : STATUS_BOOKING[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Customer", "Tanggal", "Destinasi", "Mobil / Driver", "Harga Deal", "Status", "Aksi"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Memuat data booking...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "#ef4444" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.map((b) => (
                  <tr key={b.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{b.customer}</div>
                      <div style={{ color: "#94a3b8", fontSize: 11 }}>{b.phone}</div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{formatDate(b.date)}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{b.destination}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 12 }}>
                        {b.car || <span style={{ color: "#94a3b8" }}>Belum assign</span>}
                      </div>
                      {b.driver && <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.driver}</div>}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#16a34a" }}>
                      {formatRupiah(b.hargaDeal)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Badge status={b.status} map={STATUS_BOOKING} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => openEdit(b)}
                          style={{ fontSize: 12, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "4px 10px", cursor: "pointer", background: "#fff", color: "#475569", fontWeight: 600, fontFamily: "inherit" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          style={{ fontSize: 12, border: "1.5px solid #fee2e2", borderRadius: 7, padding: "4px 10px", cursor: "pointer", background: "#fff", color: "#ef4444", fontWeight: 600, fontFamily: "inherit" }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Tidak ada data booking
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Add/Edit */}
      {modal && (
        <Modal
          title={modal.mode === "add" ? "Tambah Booking" : "Edit Booking"}
          onClose={() => setModal(null)}
        >
          {/* Bentrok Warning */}
          {bentrok && (
            <div style={{ background: "#fef9c3", border: "1.5px solid #fde047", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#854d0e", fontWeight: 600 }}>
              Jadwal bentrok! Mobil <strong>{form.car}</strong> sudah digunakan pada <strong>{form.date}</strong>.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Nama Customer *" value={form.customer} onChange={(v) => handleFormChange("customer", v)} placeholder="Nama lengkap" required />
            <FormField label="No. HP" value={form.phone} onChange={(v) => handleFormChange("phone", v)} placeholder="08xxx" />
            <FormField label="Tanggal *" type="date" value={form.date} onChange={(v) => handleFormChange("date", v)} required />
            <FormField label="Destinasi" value={form.destination} onChange={(v) => handleFormChange("destination", v)} placeholder="Kawah Putih, dll" />

            <FormField
              label="Assign Mobil"
              type="select"
              value={form.car || ""}
              onChange={(v) => handleFormChange("car", v)}
              options={[
                ["", "-- Pilih Mobil --"],
                ...availCars.map((c) => {
                  const carName = c.name || c.nama_grup || "";
                  return [carName, carName];
                }),
              ]}
            />

            <FormField label="Assign Driver" value={form.driver || ""} onChange={(v) => handleFormChange("driver", v)} placeholder="Nama driver" />

            <FormField
              label="Status"
              type="select"
              value={form.status}
              onChange={(v) => handleFormChange("status", v)}
              options={Object.entries(STATUS_BOOKING).map(([k, v]) => [k, v.label])}
            />

            <FormField label="Harga Deal (Rp)" type="number" value={form.hargaDeal} onChange={(v) => handleFormChange("hargaDeal", v)} placeholder="0" />
            <FormField label="DP (Rp)" type="number" value={form.dp} onChange={(v) => handleFormChange("dp", v)} placeholder="0" />
            <FormField label="Fee Driver (Rp)" type="number" value={form.feeDriver} onChange={(v) => handleFormChange("feeDriver", v)} placeholder="0" />
            <FormField label="Biaya Tambahan (Rp)" type="number" value={form.biayaTambahan} onChange={(v) => handleFormChange("biayaTambahan", v)} placeholder="0" />
          </div>

          <div style={{ marginTop: 12 }}>
            <FormField label="Catatan" type="textarea" value={form.notes || ""} onChange={(v) => handleFormChange("notes", v)} placeholder="Catatan tambahan..." />
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
              disabled={bentrok}
              style={{
                background: bentrok ? "#86efac" : "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "9px 20px",
                fontWeight: 700,
                fontSize: 14,
                cursor: bentrok ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {modal.mode === "add" ? "Tambah" : "Simpan"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
