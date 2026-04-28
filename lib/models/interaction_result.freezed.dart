// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'interaction_result.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$InteractionResult {

 InteractionRecord get interaction; bool get matched; MatchRecord? get match;
/// Create a copy of InteractionResult
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$InteractionResultCopyWith<InteractionResult> get copyWith => _$InteractionResultCopyWithImpl<InteractionResult>(this as InteractionResult, _$identity);

  /// Serializes this InteractionResult to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is InteractionResult&&(identical(other.interaction, interaction) || other.interaction == interaction)&&(identical(other.matched, matched) || other.matched == matched)&&(identical(other.match, match) || other.match == match));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,interaction,matched,match);

@override
String toString() {
  return 'InteractionResult(interaction: $interaction, matched: $matched, match: $match)';
}


}

/// @nodoc
abstract mixin class $InteractionResultCopyWith<$Res>  {
  factory $InteractionResultCopyWith(InteractionResult value, $Res Function(InteractionResult) _then) = _$InteractionResultCopyWithImpl;
@useResult
$Res call({
 InteractionRecord interaction, bool matched, MatchRecord? match
});


$InteractionRecordCopyWith<$Res> get interaction;$MatchRecordCopyWith<$Res>? get match;

}
/// @nodoc
class _$InteractionResultCopyWithImpl<$Res>
    implements $InteractionResultCopyWith<$Res> {
  _$InteractionResultCopyWithImpl(this._self, this._then);

  final InteractionResult _self;
  final $Res Function(InteractionResult) _then;

/// Create a copy of InteractionResult
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? interaction = null,Object? matched = null,Object? match = freezed,}) {
  return _then(_self.copyWith(
interaction: null == interaction ? _self.interaction : interaction // ignore: cast_nullable_to_non_nullable
as InteractionRecord,matched: null == matched ? _self.matched : matched // ignore: cast_nullable_to_non_nullable
as bool,match: freezed == match ? _self.match : match // ignore: cast_nullable_to_non_nullable
as MatchRecord?,
  ));
}
/// Create a copy of InteractionResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$InteractionRecordCopyWith<$Res> get interaction {
  
  return $InteractionRecordCopyWith<$Res>(_self.interaction, (value) {
    return _then(_self.copyWith(interaction: value));
  });
}/// Create a copy of InteractionResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MatchRecordCopyWith<$Res>? get match {
    if (_self.match == null) {
    return null;
  }

  return $MatchRecordCopyWith<$Res>(_self.match!, (value) {
    return _then(_self.copyWith(match: value));
  });
}
}


/// Adds pattern-matching-related methods to [InteractionResult].
extension InteractionResultPatterns on InteractionResult {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _InteractionResult value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _InteractionResult() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _InteractionResult value)  $default,){
final _that = this;
switch (_that) {
case _InteractionResult():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _InteractionResult value)?  $default,){
final _that = this;
switch (_that) {
case _InteractionResult() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( InteractionRecord interaction,  bool matched,  MatchRecord? match)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _InteractionResult() when $default != null:
return $default(_that.interaction,_that.matched,_that.match);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( InteractionRecord interaction,  bool matched,  MatchRecord? match)  $default,) {final _that = this;
switch (_that) {
case _InteractionResult():
return $default(_that.interaction,_that.matched,_that.match);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( InteractionRecord interaction,  bool matched,  MatchRecord? match)?  $default,) {final _that = this;
switch (_that) {
case _InteractionResult() when $default != null:
return $default(_that.interaction,_that.matched,_that.match);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _InteractionResult implements InteractionResult {
  const _InteractionResult({required this.interaction, required this.matched, this.match});
  factory _InteractionResult.fromJson(Map<String, dynamic> json) => _$InteractionResultFromJson(json);

@override final  InteractionRecord interaction;
@override final  bool matched;
@override final  MatchRecord? match;

/// Create a copy of InteractionResult
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$InteractionResultCopyWith<_InteractionResult> get copyWith => __$InteractionResultCopyWithImpl<_InteractionResult>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$InteractionResultToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _InteractionResult&&(identical(other.interaction, interaction) || other.interaction == interaction)&&(identical(other.matched, matched) || other.matched == matched)&&(identical(other.match, match) || other.match == match));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,interaction,matched,match);

@override
String toString() {
  return 'InteractionResult(interaction: $interaction, matched: $matched, match: $match)';
}


}

/// @nodoc
abstract mixin class _$InteractionResultCopyWith<$Res> implements $InteractionResultCopyWith<$Res> {
  factory _$InteractionResultCopyWith(_InteractionResult value, $Res Function(_InteractionResult) _then) = __$InteractionResultCopyWithImpl;
@override @useResult
$Res call({
 InteractionRecord interaction, bool matched, MatchRecord? match
});


@override $InteractionRecordCopyWith<$Res> get interaction;@override $MatchRecordCopyWith<$Res>? get match;

}
/// @nodoc
class __$InteractionResultCopyWithImpl<$Res>
    implements _$InteractionResultCopyWith<$Res> {
  __$InteractionResultCopyWithImpl(this._self, this._then);

  final _InteractionResult _self;
  final $Res Function(_InteractionResult) _then;

/// Create a copy of InteractionResult
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? interaction = null,Object? matched = null,Object? match = freezed,}) {
  return _then(_InteractionResult(
interaction: null == interaction ? _self.interaction : interaction // ignore: cast_nullable_to_non_nullable
as InteractionRecord,matched: null == matched ? _self.matched : matched // ignore: cast_nullable_to_non_nullable
as bool,match: freezed == match ? _self.match : match // ignore: cast_nullable_to_non_nullable
as MatchRecord?,
  ));
}

/// Create a copy of InteractionResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$InteractionRecordCopyWith<$Res> get interaction {
  
  return $InteractionRecordCopyWith<$Res>(_self.interaction, (value) {
    return _then(_self.copyWith(interaction: value));
  });
}/// Create a copy of InteractionResult
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MatchRecordCopyWith<$Res>? get match {
    if (_self.match == null) {
    return null;
  }

  return $MatchRecordCopyWith<$Res>(_self.match!, (value) {
    return _then(_self.copyWith(match: value));
  });
}
}

// dart format on
