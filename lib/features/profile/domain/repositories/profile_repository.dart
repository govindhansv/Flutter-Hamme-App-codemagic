import '../../../../models/app_user.dart';

abstract interface class ProfileRepository {
  Future<AppUser> getMe();

  Future<AppUser> getPublicProfile(String shareCode);
}
