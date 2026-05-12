import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { STATUS_BOOKING } from "../data/dummy";
import { formatRupiah, formatDate, hitungProfit } from "../utils/format";
import { financeApi } from "../utils/api";

function Row({ label, value, color = "#1a1a1a", bold = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ color: "#64748b", fontWeight: 500, fontSize: 14 }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 800 : 600, fontSize: bold ? 18 : 14 }}>{value}</span>
    </div>
  );
}

const getDetailRows = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.bookings)) return res.bookings;
  if (Array.isArray(res?.details)) return res.details;
  if (Array.isArray(res?.finances)) return res.finances;
  if (Array.isArray(res?.keuangan_detail)) return res.keuangan_detail;
  if (Array.isArray(res?.data?.bookings)) return res.data.bookings;
  if (Array.isArray(res?.data?.details)) return res.data.details;
  if (Array.isArray(res?.data?.finances)) return res.data.finances;
  if (Array.isArray(res?.data?.keuangan_detail)) return res.data.keuangan_detail;
  return [];
};

const mapFinanceFromApi = (b) => ({
  id: b.id || b.booking_id,
  customer: b.nama_customer || b.customer || b.booking || "-",
  destination: b.paket || b.destination || "-",
  date: b.tanggal ? String(b.tanggal).slice(0, 10) : b.date || "",
  car: b.nama_mobil || b.car || "",
  notes: b.catatan || b.notes || "",
  hargaDeal: Number(b.harga_deal ?? b.hargaDeal) || 0,
  dp: Number(b.dp) || 0,
  feeDriver: Number(b.fee_driver ?? b.feeDriver) || 0,
  biayaTambahan: Number(b.biaya_tambahan ?? b.biayaTambahan) || 0,
  profit: Number(b.profit) || 0,
  sisa: Number(b.sisa) || 0,
  status: b.status || "pending",
});

export default function KeuanganPage() {
  const [bookings, setBookings] = useState([]);
  const [selId, setSelId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await financeApi.getAll();
        const rows = getDetailRows(res).map(mapFinanceFromApi);

        setBookings(rows);
        setSelId(rows[0]?.id || null);
      } catch (err) {
        setError(err.message || "Gagal mengambil data keuangan.");
        setBookings([]);
        setSelId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, []);

  const b = bookings.find((x) => x.id === selId);

  const profit = b ? b.profit || hitungProfit(b) : 0;
  const sisaTagihan = b ? b.sisa || b.hargaDeal - b.dp : 0;

  return (
    <div className="fade-in">
      <h2 style={{ fontWeight: 800, fontSize: 20, margin: "0 0 18px" }}>Rekap Keuangan</h2>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        {/* List booking */}
        <Card style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Pilih Booking</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 520, overflowY: "auto" }}>
            {loading && (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "10px 0" }}>
                Memuat data keuangan...
              </div>
            )}

            {!loading && error && (
              <div style={{ color: "#ef4444", fontSize: 13, padding: "10px 0" }}>
                {error}
              </div>
            )}

            {!loading &&
              !error &&
              bookings.map((bk) => (
                <button
                  key={bk.id}
                  onClick={() => setSelId(bk.id)}
                  style={{
                    textAlign: "left",
                    border: "1.5px solid",
                    borderColor: selId === bk.id ? "#16a34a" : "#e2e8f0",
                    borderRadius: 9,
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: selId === bk.id ? "#f0fdf4" : "#fff",
                    fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: selId === bk.id ? "#16a34a" : "#1a1a1a" }}>
                    {bk.customer}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {formatDate(bk.date)} · {bk.destination}
                  </div>
                </button>
              ))}

            {!loading && !error && bookings.length === 0 && (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "10px 0" }}>
                Tidak ada data keuangan
              </div>
            )}
          </div>
        </Card>

        {/* Detail keuangan */}
        {b ? (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{b.customer}</h3>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 3 }}>
                  {b.destination} · {formatDate(b.date)}
                  {b.car && <> · 🚙 {b.car}</>}
                </div>
              </div>
              <Badge status={b.status} map={STATUS_BOOKING} />
            </div>

            {/* Baris keuangan */}
            <Row label="Harga Deal" value={formatRupiah(b.hargaDeal)} color="#1a1a1a" />
            <Row label="DP Diterima" value={formatRupiah(b.dp)} color="#16a34a" />
            <Row
              label="Sisa Tagihan"
              value={formatRupiah(sisaTagihan)}
              color={sisaTagihan > 0 ? "#d97706" : "#16a34a"}
            />
            <Row label="Fee Driver" value={`- ${formatRupiah(b.feeDriver)}`} color="#ef4444" />
            <Row label="Biaya Tambahan" value={`- ${formatRupiah(b.biayaTambahan)}`} color="#ef4444" />

            {/* Profit */}
            <div style={{ paddingTop: 16, marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Estimasi Profit</span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    color: profit >= 0 ? "#16a34a" : "#ef4444",
                  }}
                >
                  {formatRupiah(profit)}
                </span>
              </div>

              <div
                style={{
                  marginTop: 10,
                  background: profit >= 0 ? "#f0fdf4" : "#fee2e2",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: profit >= 0 ? "#166534" : "#991b1b",
                  fontWeight: 500,
                }}
              >
                {profit >= 0
                  ? `✅ Margin ${b.hargaDeal ? ((profit / b.hargaDeal) * 100).toFixed(1) : "0.0"}% dari harga deal`
                  : "⚠️ Pengeluaran melebihi harga deal!"}
              </div>
            </div>

            {/* Catatan */}
            {b.notes && (
              <div style={{ marginTop: 14, background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Catatan</div>
                <div style={{ fontSize: 13, color: "#475569" }}>{b.notes}</div>
              </div>
            )}
          </Card>
        ) : (
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", minHeight: 200 }}>
            Pilih booking untuk melihat detail keuangan
          </Card>
        )}
      </div>
    </div>
  );
}
