import '../../../../core/services/api_service.dart';
import '../../../../models/interaction_result.dart';
import '../../../../models/interaction_type.dart';
import '../../../../models/match_record.dart';

class InteractionRemoteDataSource {
  InteractionRemoteDataSource(this._apiService);

  final ApiService _apiService;

  Future<InteractionResult> sendInteraction({
    required String shareCode,
    required InteractionType type,
  }) async {
    final response =
        await _apiService.post(
              '/interactions',
              authenticated: true,
              body: {'shareCode': shareCode, 'type': type.name},
            )
            as Map<String, dynamic>;

    return InteractionResult.fromJson(response);
  }

  Future<List<MatchRecord>> getMatches() async {
    final response =
        await _apiService.get('/interactions/matches', authenticated: true)
            as Map<String, dynamic>;

    final matches = response['matches'] as List<dynamic>? ?? <dynamic>[];
    return matches
        .cast<Map<String, dynamic>>()
        .map(MatchRecord.fromJson)
        .toList();
  }
}
