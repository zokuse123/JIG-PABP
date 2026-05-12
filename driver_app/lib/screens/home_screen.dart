import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_constants.dart';
import '../models/booking.dart';
import '../models/driver.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/booking_card.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final Driver driver;

  const HomeScreen({super.key, required this.driver});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _apiService = ApiService();
  List<Booking> _bookings = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _apiService.setToken(widget.driver.token);
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final bookings = await _apiService.getBookings();
      if (mounted) {
        setState(() {
          _bookings = bookings;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Gagal memuat tugas. Tarik untuk refresh.';
          _isLoading = false;
        });
      }
    }
  }

  Future<bool> _updateStatus(String bookingId, TripStatus status) async {
    return await _apiService.updateBookingStatus(bookingId, status);
  }

  void _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text('Keluar?'),
        content: const Text('Anda akan keluar dari aplikasi. Lanjutkan?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            child: const Text('Keluar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await AuthService.clearSession();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  // Summary stats
  int get _pendingCount =>
      _bookings.where((b) => b.status == TripStatus.pending).length;
  int get _ongoingCount =>
      _bookings.where((b) => b.status == TripStatus.ongoing).length;
  int get _doneCount =>
      _bookings.where((b) => b.status == TripStatus.done).length;

  String get _todayLabel {
    final now = DateTime.now();
    return DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(now);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadBookings,
          color: AppColors.primary,
          child: CustomScrollView(
            slivers: [
              // ─── App Bar ─────────────────────────────────
              SliverToBoxAdapter(child: _buildHeader()),

              // ─── Stats ───────────────────────────────────
              if (!_isLoading && _bookings.isNotEmpty)
                SliverToBoxAdapter(child: _buildStats()),

              // ─── Schedule Label ──────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                  child: Row(
                    children: [
                      const Text(
                        'Tugas Saya',
                        style: AppTextStyles.heading2,
                      ),
                      const Spacer(),
                      if (!_isLoading)
                        Text(
                          '${_bookings.length} trip',
                          style: AppTextStyles.caption,
                        ),
                    ],
                  ),
                ),
              ),

              // ─── Content ─────────────────────────────────
              if (_isLoading)
                const SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                )
              else if (_errorMessage != null)
                SliverFillRemaining(child: _buildError())
              else if (_bookings.isEmpty)
                SliverFillRemaining(child: _buildEmpty())
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final booking = _bookings[index];
                      return BookingCard(
                        key: ValueKey(booking.id),
                        booking: booking,
                        onStatusChange: (status) =>
                            _updateStatus(booking.id, status),
                      );
                    },
                    childCount: _bookings.length,
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      color: AppColors.primary,
      child: Row(
        children: [
          // Driver avatar
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.25),
              shape: BoxShape.circle,
            ),
            child:
                const Icon(Icons.person_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Halo, ${widget.driver.name}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _todayLabel,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _logout,
            icon:
                const Icon(Icons.logout_rounded, color: Colors.white, size: 22),
            tooltip: 'Keluar',
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          _statItem('Menunggu', _pendingCount, AppColors.statusPending),
          _divider(),
          _statItem('Berlangsung', _ongoingCount, AppColors.statusOngoing),
          _divider(),
          _statItem('Selesai', _doneCount, AppColors.statusDone),
        ],
      ),
    );
  }

  Widget _statItem(String label, int count, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(label, style: AppTextStyles.caption),
        ],
      ),
    );
  }

  Widget _divider() {
    return Container(width: 1, height: 36, color: AppColors.divider);
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_available_rounded,
              size: 64, color: AppColors.primary.withOpacity(0.3)),
          const SizedBox(height: 16),
          const Text(
            'Tidak Ada Tugas',
            style: AppTextStyles.heading2,
          ),
          const SizedBox(height: 8),
          const Text(
            'Belum ada trip yang ditugaskan.',
            style: AppTextStyles.caption,
          ),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded,
                size: 64, color: Colors.red.withOpacity(0.4)),
            const SizedBox(height: 16),
            Text(_errorMessage ?? '',
                textAlign: TextAlign.center, style: AppTextStyles.body),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadBookings,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Coba Lagi'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
