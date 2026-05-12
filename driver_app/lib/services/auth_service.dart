import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/driver.dart';

class AuthService {
  static const String _keyDriver = 'driver_data';
  static const String _keyToken = 'auth_token';

  static Driver? _currentDriver;

  static Driver? get currentDriver => _currentDriver;

  static Future<void> saveSession(Driver driver) async {
    _currentDriver = driver;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyDriver, jsonEncode(driver.toJson()));
    await prefs.setString(_keyToken, driver.token);
  }

  static Future<Driver?> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final driverJson = prefs.getString(_keyDriver);
    if (driverJson != null) {
      _currentDriver = Driver.fromJson(jsonDecode(driverJson));
      return _currentDriver;
    }
    return null;
  }

  static Future<void> clearSession() async {
    _currentDriver = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyDriver);
    await prefs.remove(_keyToken);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }
}
