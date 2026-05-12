import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF16a34a);
  static const Color primaryLight = Color(0xFF4ade80);
  static const Color primaryDark = Color(0xFF166534);
  static const Color background = Color(0xFFF9FAFB);
  static const Color surface = Colors.white;
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color divider = Color(0xFFE5E7EB);

  // Status colors
  static const Color statusPending = Color(0xFFF59E0B);
  static const Color statusOngoing = Color(0xFF3B82F6);
  static const Color statusDone = Color(0xFF16a34a);
}

class AppStrings {
  static const String appName = 'Driver App';
  static const String login = 'Masuk';
  static const String logout = 'Keluar';
  static const String schedule = 'Tugas Saya';
  static const String startTrip = 'Mulai Trip';
  static const String endTrip = 'Selesai Trip';
  static const String noSchedule = 'Tidak ada tugas trip';
}

class AppTextStyles {
  static const TextStyle heading1 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
  );

  static const TextStyle heading2 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const TextStyle body = TextStyle(
    fontSize: 14,
    color: AppColors.textPrimary,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    color: AppColors.textSecondary,
  );
}
