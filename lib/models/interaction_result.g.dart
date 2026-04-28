// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'interaction_result.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_InteractionResult _$InteractionResultFromJson(Map<String, dynamic> json) =>
    _InteractionResult(
      interaction: InteractionRecord.fromJson(
        json['interaction'] as Map<String, dynamic>,
      ),
      matched: json['matched'] as bool,
      match:
          json['match'] == null
              ? null
              : MatchRecord.fromJson(json['match'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$InteractionResultToJson(_InteractionResult instance) =>
    <String, dynamic>{
      'interaction': instance.interaction,
      'matched': instance.matched,
      'match': instance.match,
    };
