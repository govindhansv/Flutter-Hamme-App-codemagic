import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/services.dart';


/// Manages the network connectivity status and provides methods to check and handle connectivity changes.
class NetworkManager {
  static final NetworkManager _instance = NetworkManager._internal();
  factory NetworkManager() => _instance;
  NetworkManager._internal();

  static NetworkManager get instance => _instance;

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  final List<ConnectivityResult> _connectionStatus = <ConnectivityResult>[];

  /// Initialize the network manager and set up a stream to continually check the connection status.
  void init() {
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(_updateConnectionStatus);
  }

  /// Update the connection status based on changes in connectivity.
  Future<void> _updateConnectionStatus(List<ConnectivityResult> result) async {
    _connectionStatus
      ..clear()
      ..addAll(result);
  }

  /// Check the internet connection status.
  /// Returns `true` if connected, `false` otherwise.
  Future<bool> isConnected() async {
    try {
      final result = await _connectivity.checkConnectivity();
      if (result.any((element) => element == ConnectivityResult.none)) {
        return false;
      } else {
        return true;
      }
    } on PlatformException catch (_) {
      return false;
    }
  }

  /// Dispose or close the active connectivity stream.
  void dispose() {
    _connectivitySubscription?.cancel();
  }
}
