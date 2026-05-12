import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/booking.dart';
import '../models/driver.dart';

class ApiService {
  // Ganti dengan URL backend Anda
  static const String baseUrl = 'https://your-api.example.com/api';
  static const bool useDummyData = true; // Set false jika backend sudah siap

  String? _token;

  void setToken(String token) {
    _token = token;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  // ─── AUTH ────────────────────────────────────────────────
  Future<Driver?> login(String phone, String password) async {
    if (useDummyData) {
      await Future.delayed(const Duration(milliseconds: 800));
      // Dummy: phone: 08xx / password: apapun
      if (phone.startsWith('08')) {
        return Driver(
          id: 'D001',
          name: 'Budi Santoso',
          phone: phone,
          token: 'dummy_token_abc123',
        );
      }
      throw Exception('Nomor HP atau password salah');
    }

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: _headers,
        body: jsonEncode({'phone': phone, 'password': password}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return Driver.fromJson(data['driver'] ?? data);
      }
      throw Exception('Login gagal: ${res.statusCode}');
    } catch (e) {
      throw Exception('Tidak dapat terhubung ke server');
    }
  }

  // ─── BOOKINGS ────────────────────────────────────────────
  Future<List<Booking>> getBookings({String? date}) async {
    if (useDummyData) {
      await Future.delayed(const Duration(milliseconds: 600));
      return _dummyBookings();
    }

    try {
      final query = date != null ? '?date=$date' : '';
      final res = await http.get(
        Uri.parse('$baseUrl/bookings$query'),
        headers: _headers,
      );

      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body)['data'] ?? jsonDecode(res.body);
        return data.map((e) => Booking.fromJson(e)).toList();
      }
      throw Exception('Gagal memuat jadwal');
    } catch (e) {
      // Fallback ke dummy jika error
      return _dummyBookings();
    }
  }

  // ─── UPDATE STATUS ───────────────────────────────────────
  Future<bool> updateBookingStatus(String bookingId, TripStatus status) async {
    if (useDummyData) {
      await Future.delayed(const Duration(milliseconds: 400));
      return true; // Selalu berhasil di mode dummy
    }

    try {
      final res = await http.put(
        Uri.parse('$baseUrl/booking/$bookingId/status'),
        headers: _headers,
        body: jsonEncode({'status': status.value}),
      );
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ─── DUMMY DATA ──────────────────────────────────────────
  List<Booking> _dummyBookings() {
    final today = DateTime.now();
    final dateStr =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    return [
      Booking(
        id: 'B001',
        customerName: 'Andi Prasetyo',
        package: PackageType.short,
        startTime: '08:00',
        carName: 'Toyota Avanza',
        carPlate: 'B 1234 XYZ',
        status: TripStatus.done,
        date: dateStr,
      ),
      Booking(
        id: 'B002',
        customerName: 'Siti Rahayu',
        package: PackageType.medium,
        startTime: '10:30',
        carName: 'Honda Jazz',
        carPlate: 'D 5678 ABC',
        status: TripStatus.ongoing,
        date: dateStr,
      ),
      Booking(
        id: 'B003',
        customerName: 'Rizky Firmansyah',
        package: PackageType.long,
        startTime: '13:00',
        carName: 'Toyota Avanza',
        carPlate: 'B 1234 XYZ',
        status: TripStatus.pending,
        date: dateStr,
      ),
      Booking(
        id: 'B004',
        customerName: 'Dewi Lestari',
        package: PackageType.short,
        startTime: '16:00',
        carName: 'Daihatsu Xenia',
        carPlate: 'Z 9999 KLM',
        status: TripStatus.pending,
        date: dateStr,
      ),
    ];
  }
}
