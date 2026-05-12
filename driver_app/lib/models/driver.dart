class Driver {
  final String id;
  final String name;
  final String phone;
  final String token;

  Driver({
    required this.id,
    required this.name,
    required this.phone,
    required this.token,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      token: json['token'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'token': token,
    };
  }
}
