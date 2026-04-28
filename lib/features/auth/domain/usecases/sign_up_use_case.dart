import '../repositories/auth_repository.dart';
import '../../../../models/auth_session.dart';

class SignUpUseCase {
  SignUpUseCase(this._repository);

  final AuthRepository _repository;

  Future<AuthSession> call({
    required String name,
    required String email,
    required String password,
    required String instagramId,
    String? profileImageUrl,
  }) {
    return _repository.signUp(
      name: name,
      email: email,
      password: password,
      instagramId: instagramId,
      profileImageUrl: profileImageUrl,
    );
  }
}
