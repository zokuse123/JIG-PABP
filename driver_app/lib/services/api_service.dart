import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/booking.dart';
import '../models/driver.dart';

class ApiService {
  // IP local network backend Express. Pastikan HP dan laptop satu Wi-Fi.
  static const String baseUrl = 'http://192.168.18.5:3000/mobile';
  static const bool useDummyData = false;

  String? _token;

  void setToken(String token) {
    _token = token;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  dynamic _decode(http.Response res) {
    if (res.body.isEmpty) return null;
    return jsonDecode(res.body);
  }

  String _errorMessage(http.Response res, String fallback) {
    try {
      final data = _decode(res);
      if (data is Map<String, dynamic>) {
        return data['message'] ?? data['error'] ?? fallback;
      }
      return fallback;
    } catch (_) {
      return fallback;
    }
  }

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
        final data = _decode(res);
        return Driver.fromJson(data['driver'] ?? data);
      }
      throw Exception(_errorMessage(res, 'Nomor HP atau password salah'));
    } catch (e) {
      if (e is Exception) rethrow;
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
        Uri.parse('$baseUrl/trips$query'),
        headers: _headers,
      );

      if (res.statusCode == 200) {
        final body = _decode(res);
        final List data =
            body is Map<String, dynamic> ? (body['data'] ?? []) : body;
        return data.map((e) => Booking.fromJson(e)).toList();
      }
      throw Exception(_errorMessage(res, 'Gagal memuat tugas'));
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Tidak dapat terhubung ke server');
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
        Uri.parse('$baseUrl/trip/$bookingId/status'),
        headers: _headers,
        body: jsonEncode({'status': status.value}),
      );
      if (res.statusCode == 200) return true;
      return false;
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
