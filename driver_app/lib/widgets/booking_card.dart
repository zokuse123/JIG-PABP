import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import '../models/booking.dart';
import 'common_widgets.dart';

class BookingCard extends StatefulWidget {
  final Booking booking;
  final Future<bool> Function(TripStatus) onStatusChange;

  const BookingCard({
    super.key,
    required this.booking,
    required this.onStatusChange,
  });

  @override
  State<BookingCard> createState() => _BookingCardState();
}

class _BookingCardState extends State<BookingCard> {
  bool _isLoading = false;

  Future<void> _changeStatus(TripStatus newStatus) async {
    setState(() => _isLoading = true);
    final success = await widget.onStatusChange(newStatus);
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (success) widget.booking.status = newStatus;
      });

      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal memperbarui status. Coba lagi.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = widget.booking;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── Header ──────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: _headerColor(booking.status).withOpacity(0.05),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(14)),
              border: Border(
                left: BorderSide(
                  color: _headerColor(booking.status),
                  width: 4,
                ),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(Icons.access_time_rounded,
                          size: 16, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        booking.startTime,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      PackageBadge(package: booking.package),
                    ],
                  ),
                ),
                StatusBadge(status: booking.status),
              ],
            ),
          ),

          // ─── Content ─────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Customer name
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        color: AppColors.primary,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        booking.customerName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(color: AppColors.divider, height: 1),
                const SizedBox(height: 12),

                // Car info
                InfoRow(
                  icon: Icons.directions_car_rounded,
                  label: 'Mobil',
                  value: '${booking.carName} - ${booking.carPlate}',
                ),
                const SizedBox(height: 6),
                InfoRow(
                  icon: Icons.local_shipping_rounded,
                  label: 'Paket',
                  value: booking.package.label,
                ),

                // ─── Action Button ────────────────────────
                if (booking.status != TripStatus.done) ...[
                  const SizedBox(height: 14),
                  _buildActionButton(booking.status),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(TripStatus currentStatus) {
    if (currentStatus == TripStatus.pending) {
      return PrimaryButton(
        label: 'Mulai Trip',
        icon: Icons.play_arrow_rounded,
        isLoading: _isLoading,
        onPressed: () => _changeStatus(TripStatus.ongoing),
      );
    } else if (currentStatus == TripStatus.ongoing) {
      return PrimaryButton(
        label: 'Selesai Trip',
        icon: Icons.check_circle_rounded,
        isLoading: _isLoading,
        color: AppColors.statusOngoing,
        onPressed: () => _showEndTripDialog(),
      );
    }
    return const SizedBox.shrink();
  }

  void _showEndTripDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text('Selesaikan Trip?'),
        content: Text(
          'Konfirmasi bahwa trip untuk ${widget.booking.customerName} telah selesai.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _changeStatus(TripStatus.done);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            child: const Text('Ya, Selesai',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Color _headerColor(TripStatus status) {
    switch (status) {
      case TripStatus.pending:
        return AppColors.statusPending;
      case TripStatus.ongoing:
        return AppColors.statusOngoing;
      case TripStatus.done:
        return AppColors.statusDone;
    }
  }
}
