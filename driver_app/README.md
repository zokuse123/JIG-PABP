# Driver App 🚗

Aplikasi mobile untuk driver — manajemen jadwal trip harian.

## Fitur

- **Login Driver** — dengan nomor HP & password
- **Halaman Utama** — tampilkan jadwal trip hari ini
- **Kartu Booking** — nama customer, paket, jam mulai, info mobil
- **Status Trip** — pending → ongoing → selesai
- **Statistik** — ringkasan status trip di atas
- **Auto-login** — sesi tersimpan, langsung masuk saat buka ulang
- **Dummy Data** — mode demo tanpa backend

---

## Cara Jalankan

```bash
# 1. Install dependencies
flutter pub get

# 2. Jalankan di device/emulator
flutter run
```

**Demo login:** Nomor HP awalan `08` + password apapun (min. 4 karakter)

---

## Struktur Project

```
lib/
├── constants/
│   └── app_constants.dart     # Warna, teks style, string
├── models/
│   ├── booking.dart           # Model booking & enum status/paket
│   └── driver.dart            # Model driver
├── screens/
│   ├── splash_screen.dart     # Splash + cek sesi
│   ├── login_screen.dart      # Halaman login
│   └── home_screen.dart       # Dashboard utama
├── services/
│   ├── api_service.dart       # HTTP client + dummy data
│   └── auth_service.dart      # Simpan/baca sesi login
├── widgets/
│   ├── booking_card.dart      # Card trip dengan tombol aksi
│   └── common_widgets.dart    # Badge, button, info row
└── main.dart                  # Entry point
```

---

## Integrasi Backend

Edit `lib/services/api_service.dart`:

```dart
// 1. Ganti URL backend
static const String baseUrl = 'https://your-api.example.com/api';

// 2. Matikan mode dummy
static const bool useDummyData = false;
```

### API yang digunakan:

| Method | Endpoint             | Keterangan            |
|--------|----------------------|-----------------------|
| POST   | `/login`             | Login driver          |
| GET    | `/bookings`          | Ambil jadwal hari ini |
| PUT    | `/booking/:id/status`| Update status trip    |

### Contoh response `GET /bookings`:
```json
{
  "data": [
    {
      "id": "B001",
      "customer_name": "Andi Prasetyo",
      "package": "short",
      "start_time": "08:00",
      "car_name": "Toyota Avanza",
      "car_plate": "B 1234 XYZ",
      "status": "pending",
      "date": "2025-01-15"
    }
  ]
}
```

### Contoh body `PUT /booking/:id/status`:
```json
{
  "status": "ongoing"
}
```

---

## Warna Status

| Status      | Warna     |
|-------------|-----------|
| Menunggu    | Kuning    |
| Berlangsung | Biru      |
| Selesai     | Hijau     |

## Paket

| Paket  | Warna  |
|--------|--------|
| Short  | Ungu   |
| Medium | Oranye |
| Long   | Biru   |

---

## Dependencies

```yaml
http: ^1.2.0              # HTTP requests
shared_preferences: ^2.2.2 # Simpan sesi login
intl: ^0.19.0             # Format tanggal
```
