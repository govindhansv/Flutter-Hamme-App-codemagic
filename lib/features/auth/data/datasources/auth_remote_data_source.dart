import '../../../../core/services/api_service.dart';
import '../../../../models/app_user.dart';
import '../../../../models/auth_session.dart';

class AuthRemoteDataSource {
  AuthRemoteDataSource(this._apiService);

  final ApiService _apiService;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response =
        await _apiService.post(
              '/auth/login',
              body: {'email': email, 'password': password},
            )
            as Map<String, dynamic>;

    return AuthSession.fromJson(response);
  }

  Future<AuthSession> signUp({
    required String name,
    required String email,
    required String password,
    required String instagramId,
    String? profileImageUrl,
  }) async {
    final response =
        await _apiService.post(
              '/auth/signup',
              body: {
                'name': name,
                'email': email,
                'password': password,
                'instagramId': instagramId,
                'profileImageUrl': profileImageUrl,
              },
            )
            as Map<String, dynamic>;

    return AuthSession.fromJson(response);
  }

  Future<AppUser> getCurrentUser() async {
    final response =
        await _apiService.get('/auth/me', authenticated: true)
            as Map<String, dynamic>;

    return AppUser.fromJson(response['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await _apiService.post('/auth/logout', authenticated: true);
  }
}
