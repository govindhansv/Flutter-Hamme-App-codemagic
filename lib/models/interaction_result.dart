import 'package:freezed_annotation/freezed_annotation.dart';

import 'interaction_record.dart';
import 'match_record.dart';

part 'interaction_result.freezed.dart';
part 'interaction_result.g.dart';

@freezed
abstract class InteractionResult with _$InteractionResult {
  const factory InteractionResult({
    required InteractionRecord interaction,
    required bool matched,
    MatchRecord? match,
  }) = _InteractionResult;

  factory InteractionResult.fromJson(Map<String, dynamic> json) =>
      _$InteractionResultFromJson(json);
}
