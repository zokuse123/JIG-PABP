# 🚙 JIG Admin Dashboard

**Monitoring Operasional Jeep** — Admin dashboard berbasis React.js + Tailwind CSS.

---

## 📁 Struktur Folder

```
jig-admin/
├── public/
│   └── index.html
├── src/
│   ├── components/          # Komponen reusable
│   │   ├── Badge.jsx        # Badge status
│   │   ├── Card.jsx         # Card container
│   │   ├── FormField.jsx    # Input / Select / Textarea
│   │   ├── Modal.jsx        # Modal overlay
│   │   ├── Sidebar.jsx      # Navigasi sidebar
│   │   └── StatCard.jsx     # Kartu statistik
│   ├── data/
│   │   └── dummy.js         # Data dummy + konstanta status
│   ├── hooks/
│   │   ├── useBookings.js   # State & CRUD booking
│   │   └── useCars.js       # State & update mobil
│   ├── pages/
│   │   ├── LoginPage.jsx    # Halaman login
│   │   ├── DashboardPage.jsx
│   │   ├── BookingPage.jsx
│   │   ├── MobilPage.jsx
│   │   ├── KeuanganPage.jsx
│   │   └── SyncPage.jsx
│   ├── utils/
│   │   ├── api.js           # Axios instance + endpoint
│   │   └── format.js        # Helper format angka, tanggal, dll
│   ├── App.jsx              # Root component
│   ├── index.jsx            # Entry point
│   └── index.css            # Global styles + Tailwind
├── .env.example
├── package.json
└── tailwind.config.js
```

---

## 🚀 Cara Menjalankan

### 1. Install dependencies

```bash
cd jig-admin
npm install
```

### 2. Setup environment

```bash
cp .env.example .env
# Edit .env sesuaikan REACT_APP_API_URL
```

### 3. Jalankan development server

```bash
npm start
```

Buka [http://localhost:3000](http://localhost:3000)

**Login:** `admin` / `jig2025`

---

## ✨ Fitur

| Halaman | Fitur |
|---------|-------|
| **Dashboard** | Total pemasukan, total trip, mobil aktif, booking terbaru, status armada |
| **Booking** | List booking, filter status, search, tambah/edit/hapus, assign mobil & driver, validasi bentrok jadwal |
| **Monitoring Mobil** | Status armada (tersedia/dalam trip/perawatan), label internal/external, edit status |
| **Keuangan** | Detail harga deal, DP, sisa tagihan, fee driver, biaya tambahan, kalkulasi profit otomatis |
| **Sync Data** | Tombol sync dari Google Sheets via `GET /sync-bookings`, fallback ke dummy jika backend belum siap |

---

## 🔌 Integrasi Backend

Edit `src/utils/api.js` untuk menyesuaikan endpoint:

```js
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
```

Endpoint yang digunakan:

| Method | Path | Keterangan |
|--------|------|-----------|
| GET    | `/bookings` | Ambil semua booking |
| POST   | `/bookings` | Tambah booking |
| PUT    | `/bookings/:id` | Update booking |
| DELETE | `/bookings/:id` | Hapus booking |
| GET    | `/sync-bookings` | Sync dari Google Sheets |
| GET    | `/cars` | Ambil semua mobil |
| PUT    | `/cars/:id` | Update status mobil |

> Jika backend belum tersedia, semua operasi menggunakan **dummy data** secara otomatis (optimistic update).

---

## 🛠 Tech Stack

- **React 18** — UI framework
- **Tailwind CSS** — Styling
- **Axios** — HTTP client
- **Plus Jakarta Sans** — Font

---

## 📝 Catatan Pengembangan

- Ganti auth di `LoginPage.jsx` dengan API call sesungguhnya di produksi
- Token disimpan di `localStorage` dengan key `jig_token`
- Semua state global dikelola di `App.jsx` via custom hooks
- Tambah React Query / Zustand jika state management makin kompleks
