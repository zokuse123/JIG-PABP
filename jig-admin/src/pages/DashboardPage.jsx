import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { STATUS_BOOKING, STATUS_CAR } from "../data/dummy";
import { formatRupiah, formatDate } from "../utils/format";
import { dashboardApi, bookingApi, carApi } from "../utils/api";

export default function DashboardPage() {
  // ─── STATE ─────────────────────────────────────────────
  const [dashboard, setDashboard] = useState(null);
  const [bookingsData, setBookingsData] = useState([]);
  const [carsData, setCarsData] = useState([]);

  // ─── FETCH API ─────────────────────────────────────────
  useEffect(() => {
    dashboardApi.getSummary().then((res) => {
      setDashboard(res.data);
    });

    bookingApi.getAll().then((res) => {
      setBookingsData(res.data || []);
    });

    carApi.getAll().then((res) => {
      setCarsData(res || []);
    });
  }, []);

  // ─── SUMMARY ───────────────────────────────────────────
  const totalPemasukan =
    dashboard?.total_pemasukan || 0;

  const totalTrip =
    dashboard?.total_trip || 0;

  const mobilAktif =
    carsData.filter((c) => c.status === "on_trip").length;

  const pending =
    bookingsData.filter((b) => b.status === "pending").length;

  const recentBookings =
    [...bookingsData].reverse().slice(0, 6);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>
          Dashboard
        </h2>

        <p
          style={{
            color: "#94a3b8",
            fontSize: 13,
            margin: "4px 0 0",
          }}
        >
          Selamat datang, Admin 👋 —{" "}
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <StatCard
          icon="💵"
          label="Total Pemasukan"
          value={formatRupiah(totalPemasukan)}
          sub="Dari trip selesai"
          color="#16a34a"
        />

        <StatCard
          icon="🗂️"
          label="Total Trip"
          value={totalTrip}
          sub="Non-cancel"
          color="#2563eb"
        />

        <StatCard
          icon="🚙"
          label="Mobil Aktif"
          value={mobilAktif}
          sub="Sedang jalan"
          color="#d97706"
        />

        <StatCard
          icon="⏳"
          label="Pending"
          value={pending}
          sub="Perlu konfirmasi"
          color="#7c3aed"
        />
      </div>

      {/* Bottom Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {/* Booking terbaru */}
        <Card>
          <h3
            style={{
              fontWeight: 700,
              fontSize: 15,
              margin: "0 0 14px",
            }}
          >
            Booking Terbaru
          </h3>

          {recentBookings.map((b) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {b.nama_customer}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  {b.paket} · {formatDate(b.tanggal)}
                </div>
              </div>

              <Badge
                status={b.status}
                map={STATUS_BOOKING}
              />
            </div>
          ))}
        </Card>

        {/* Status armada */}
        <Card>
          <h3
            style={{
              fontWeight: 700,
              fontSize: 15,
              margin: "0 0 14px",
            }}
          >
            Status Armada
          </h3>

          {carsData.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {c.nama_grup}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  {c.is_external
                    ? "🌐 External"
                    : "🏠 Internal"}
                </div>
              </div>

              <Badge
                status={c.status}
                map={STATUS_CAR}
              />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}