import '../../../../models/interaction_result.dart';
import '../../../../models/interaction_type.dart';
import '../../../../models/match_record.dart';
import '../datasources/interaction_remote_data_source.dart';
import '../../domain/repositories/interaction_repository.dart';

class InteractionRepositoryImpl implements InteractionRepository {
  InteractionRepositoryImpl(this._remoteDataSource);

  final InteractionRemoteDataSource _remoteDataSource;

  @override
  Future<List<MatchRecord>> getMatches() => _remoteDataSource.getMatches();

  @override
  Future<InteractionResult> sendInteraction({
    required String shareCode,
    required InteractionType type,
  }) {
    return _remoteDataSource.sendInteraction(shareCode: shareCode, type: type);
  }
}
