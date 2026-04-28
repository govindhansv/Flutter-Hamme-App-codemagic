import '../../../../models/app_user.dart';
import '../datasources/profile_remote_data_source.dart';
import '../../domain/repositories/profile_repository.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._remoteDataSource);

  final ProfileRemoteDataSource _remoteDataSource;

  @override
  Future<AppUser> getMe() => _remoteDataSource.getMe();

  @override
  Future<AppUser> getPublicProfile(String shareCode) =>
      _remoteDataSource.getPublicProfile(shareCode);
}
