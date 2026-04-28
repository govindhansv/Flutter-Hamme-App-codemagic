import 'dart:convert';

import 'package:http/http.dart' as http;

import '../constants/app_constants.dart';
import '../utils/app_exception.dart';
import 'secure_storage_service.dart';

class ApiService {
  ApiService({
    required http.Client client,
    required SecureStorageService storage,
  }) : _client = client,
       _storage = storage;

  final http.Client _client;
  final SecureStorageService _storage;

  Future<dynamic> get(
    String path, {
    bool authenticated = false,
    Map<String, String>? queryParameters,
  }) async {
    final uri = _buildUri(path, queryParameters);
    final headers = await _buildHeaders(authenticated: authenticated);
    final response = await _client.get(uri, headers: headers);
    return _decodeResponse(response);
  }

  Future<dynamic> post(
    String path, {
    Object? body,
    bool authenticated = false,
  }) async {
    final uri = _buildUri(path);
    final headers = await _buildHeaders(authenticated: authenticated);
    final response = await _client.post(
      uri,
      headers: headers,
      body: body == null ? null : jsonEncode(body),
    );
    return _decodeResponse(response);
  }

  Future<dynamic> patch(
    String path, {
    Object? body,
    bool authenticated = false,
  }) async {
    final uri = _buildUri(path);
    final headers = await _buildHeaders(authenticated: authenticated);
    final response = await _client.patch(
      uri,
      headers: headers,
      body: body == null ? null : jsonEncode(body),
    );
    return _decodeResponse(response);
  }

  Uri _buildUri(String path, [Map<String, String>? queryParameters]) {
    return Uri.parse(
      '${AppConstants.apiBaseUrl}$path',
    ).replace(queryParameters: queryParameters);
  }

  Future<Map<String, String>> _buildHeaders({
    required bool authenticated,
  }) async {
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (!authenticated) {
      return headers;
    }

    final token = await _storage.readAccessToken();
    if (token == null || token.isEmpty) {
      throw const AppException('Authentication is required.', statusCode: 401);
    }

    headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  dynamic _decodeResponse(http.Response response) {
    final hasBody = response.body.trim().isNotEmpty;
    final decodedBody = hasBody ? jsonDecode(response.body) : null;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decodedBody;
    }

    final message =
        decodedBody is Map<String, dynamic>
            ? decodedBody['message'] as String? ?? 'Unexpected request failure.'
            : 'Unexpected request failure.';

    throw AppException(message, statusCode: response.statusCode);
  }
}
