import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/data/datasources/auth_remote_data_source.dart';
import '../features/auth/data/repositories/auth_repository_impl.dart';
import '../features/auth/domain/repositories/auth_repository.dart';
import '../features/auth/domain/usecases/login_use_case.dart';
import '../features/auth/domain/usecases/sign_up_use_case.dart';
import '../models/auth_session.dart';
import 'api_providers.dart';
import 'onboarding_providers.dart';

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSource(ref.watch(apiServiceProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.watch(authRemoteDataSourceProvider),
    secureStorageService: ref.watch(secureStorageServiceProvider),
  );
});

final loginUseCaseProvider = Provider<LoginUseCase>((ref) {
  return LoginUseCase(ref.watch(authRepositoryProvider));
});

final signUpUseCaseProvider = Provider<SignUpUseCase>((ref) {
  return SignUpUseCase(ref.watch(authRepositoryProvider));
});

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthSession?>(AuthController.new);

class AuthController extends AsyncNotifier<AuthSession?> {
  AuthRepository get _repository => ref.read(authRepositoryProvider);

  @override
  Future<AuthSession?> build() async {
    // Add a minimum delay of 2 seconds to ensure the splash screen is visible
    final results = await Future.wait([
      _repository.restoreSession(),
      Future.delayed(const Duration(seconds: 2)),
    ]);
    return results[0] as AuthSession?;
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(loginUseCaseProvider)(email: email, password: password),
    );
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    await _repository.logout();
    await ref.read(onboardingCompletionProvider.notifier).reset();
    state = const AsyncData(null);
  }

  Future<void> signUp({
    required String name,
    required String email,
    required String password,
    required String instagramId,
    String? profileImageUrl,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(signUpUseCaseProvider)(
        name: name,
        email: email,
        password: password,
        instagramId: instagramId,
        profileImageUrl: profileImageUrl,
      ),
    );
  }
}
