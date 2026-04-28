import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/utils/app_exception.dart';
import '../features/interactions/data/datasources/interaction_remote_data_source.dart';
import '../features/interactions/data/repositories/interaction_repository_impl.dart';
import '../features/interactions/domain/repositories/interaction_repository.dart';
import '../models/interaction_result.dart';
import '../models/interaction_type.dart';
import '../models/match_record.dart';
import 'api_providers.dart';
import 'auth_providers.dart';

final interactionRemoteDataSourceProvider =
    Provider<InteractionRemoteDataSource>((ref) {
      return InteractionRemoteDataSource(ref.watch(apiServiceProvider));
    });

final interactionRepositoryProvider = Provider<InteractionRepository>((ref) {
  return InteractionRepositoryImpl(
    ref.watch(interactionRemoteDataSourceProvider),
  );
});

final matchesProvider = FutureProvider<List<MatchRecord>>((ref) async {
  final session = await ref.watch(authControllerProvider.future);
  if (session == null) {
    throw const AppException('You need to sign in to view matches.');
  }
  return ref.watch(interactionRepositoryProvider).getMatches();
});

final interactionControllerProvider =
    AsyncNotifierProvider<InteractionController, void>(
      InteractionController.new,
    );

class InteractionController extends AsyncNotifier<void> {
  InteractionRepository get _repository =>
      ref.read(interactionRepositoryProvider);

  @override
  Future<void> build() async {}

  Future<InteractionResult> sendInteraction({
    required String shareCode,
    required InteractionType type,
  }) async {
    state = const AsyncLoading();
    try {
      final result = await _repository.sendInteraction(
        shareCode: shareCode,
        type: type,
      );
      ref.invalidate(matchesProvider);
      state = const AsyncData(null);
      return result;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }
}
