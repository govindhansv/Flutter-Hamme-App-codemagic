import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnboardingDraft {
  const OnboardingDraft({
    this.name,
    this.birthday,
    this.socialPlatform,
    this.username,
    this.profileImagePath,
  });

  final String? name;
  final DateTime? birthday;
  final String? socialPlatform;
  final String? username;
  final String? profileImagePath;

  OnboardingDraft copyWith({
    String? name,
    DateTime? birthday,
    String? socialPlatform,
    String? username,
    String? profileImagePath,
  }) {
    return OnboardingDraft(
      name: name ?? this.name,
      birthday: birthday ?? this.birthday,
      socialPlatform: socialPlatform ?? this.socialPlatform,
      username: username ?? this.username,
      profileImagePath: profileImagePath ?? this.profileImagePath,
    );
  }
}

class OnboardingDraftNotifier extends StateNotifier<OnboardingDraft> {
  OnboardingDraftNotifier() : super(const OnboardingDraft());

  void setName(String name) {
    state = state.copyWith(name: name);
  }

  void setBirthday(DateTime birthday) {
    state = state.copyWith(birthday: birthday);
  }

  void setSocial({required String platform, required String username}) {
    state = state.copyWith(socialPlatform: platform, username: username);
  }

  void setProfileImagePath(String path) {
    state = state.copyWith(profileImagePath: path);
  }
}

final onboardingDraftProvider =
    StateNotifierProvider<OnboardingDraftNotifier, OnboardingDraft>((ref) {
      return OnboardingDraftNotifier();
    });

final onboardingCompletionProvider =
    AsyncNotifierProvider<OnboardingCompletionNotifier, bool>(
      OnboardingCompletionNotifier.new,
    );

class OnboardingCompletionNotifier extends AsyncNotifier<bool> {
  static const _onboardingCompleteKey = 'onboarding_complete';

  @override
  Future<bool> build() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getBool(_onboardingCompleteKey) ?? false;
  }

  Future<void> markComplete() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_onboardingCompleteKey, true);
    state = const AsyncData(true);
  }

  Future<void> reset() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_onboardingCompleteKey, false);
    state = const AsyncData(false);
  }
}
