import '../../../../models/auth_session.dart';

abstract interface class AuthRepository {
  Future<AuthSession> login({required String email, required String password});

  Future<AuthSession> signUp({
    required String name,
    required String email,
    required String password,
    required String instagramId,
    String? profileImageUrl,
  });

  Future<AuthSession?> restoreSession();

  Future<void> logout();
}
