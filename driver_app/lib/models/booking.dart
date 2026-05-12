enum TripStatus { pending, ongoing, done }

enum PackageType { short, medium, long }

extension TripStatusExtension on TripStatus {
  String get label {
    switch (this) {
      case TripStatus.pending:
        return 'Menunggu';
      case TripStatus.ongoing:
        return 'Berlangsung';
      case TripStatus.done:
        return 'Selesai';
    }
  }

  String get value {
    switch (this) {
      case TripStatus.pending:
        return 'pending';
      case TripStatus.ongoing:
        return 'ongoing';
      case TripStatus.done:
        return 'done';
    }
  }
}

extension PackageTypeExtension on PackageType {
  String get label {
    switch (this) {
      case PackageType.short:
        return 'Short';
      case PackageType.medium:
        return 'Medium';
      case PackageType.long:
        return 'Long';
    }
  }

  String get value {
    switch (this) {
      case PackageType.short:
        return 'short';
      case PackageType.medium:
        return 'medium';
      case PackageType.long:
        return 'long';
    }
  }
}

class Booking {
  final String id;
  final String customerName;
  final PackageType package;
  final String startTime;
  final String carName;
  final String carPlate;
  TripStatus status;
  final String date;

  Booking({
    required this.id,
    required this.customerName,
    required this.package,
    required this.startTime,
    required this.carName,
    required this.carPlate,
    required this.status,
    required this.date,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'].toString(),
      customerName: json['customer_name'] ?? '',
      package: _parsePackage(json['package']),
      startTime: json['start_time'] ?? '',
      carName: json['car_name'] ?? '',
      carPlate: json['car_plate'] ?? '',
      status: _parseStatus(json['status']),
      date: json['date'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_name': customerName,
      'package': package.value,
      'start_time': startTime,
      'car_name': carName,
      'car_plate': carPlate,
      'status': status.value,
      'date': date,
    };
  }

  static TripStatus _parseStatus(String? value) {
    switch (value) {
      case 'ongoing':
        return TripStatus.ongoing;
      case 'done':
        return TripStatus.done;
      default:
        return TripStatus.pending;
    }
  }

  static PackageType _parsePackage(String? value) {
    switch (value) {
      case 'medium':
        return PackageType.medium;
      case 'long':
        return PackageType.long;
      default:
        return PackageType.short;
    }
  }
}
