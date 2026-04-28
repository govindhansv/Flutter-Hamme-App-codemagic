import '../../../../models/interaction_result.dart';
import '../../../../models/interaction_type.dart';
import '../../../../models/match_record.dart';

abstract interface class InteractionRepository {
  Future<InteractionResult> sendInteraction({
    required String shareCode,
    required InteractionType type,
  });

  Future<List<MatchRecord>> getMatches();
}
