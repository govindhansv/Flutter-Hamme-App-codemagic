// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppUser _$AppUserFromJson(Map<String, dynamic> json) => _AppUser(
  id: json['id'] as String,
  name: json['name'] as String,
  email: json['email'] as String,
  instagramId: json['instagramId'] as String,
  profileImageUrl: json['profileImageUrl'] as String?,
  shareCode: json['shareCode'] as String,
);

Map<String, dynamic> _$AppUserToJson(_AppUser instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'email': instance.email,
  'instagramId': instance.instagramId,
  'profileImageUrl': instance.profileImageUrl,
  'shareCode': instance.shareCode,
};
