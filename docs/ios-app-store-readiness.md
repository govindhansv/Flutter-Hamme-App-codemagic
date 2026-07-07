# iOS App Store Readiness Audit

Audit date: 2026-07-07

## 🔴 Blockers (will get you rejected or break in production)

### 1. No in-app account deletion
The app supports account creation (`lib/features/auth/domain/usecases/sign_up_use_case.dart`)
but there is no "Delete Account" flow anywhere in `lib/`. Apple Guideline 5.1.1(v) requires
apps with account creation to let users delete their account from inside the app, not just
via a support email. This is one of the most common auto-rejection reasons.

### 2. iOS purchase verification is not implemented
`backend/src/services/billingService.js` (lines ~131-138) only verifies **Android**
subscriptions against Google Play. For iOS it does:

```js
// iOS App Store verification is not implemented yet.
if (allowUnverified) {
  granted = true;
} else {
  throw new ApiError(503, 'iOS purchase verification is not configured.');
}
```

Unless deployed with `ALLOW_UNVERIFIED_IAP=true` (which means anyone could fake a receipt),
**Pro subscriptions will never activate on iOS**. Real App Store Server API / receipt
validation is needed before submitting, since Apple reviewers will test the paid feature.

### 3. Missing usage-description keys in `ios/Runner/Info.plist`
None of these keys exist, but the code needs them — the app will crash instantly when these
features are triggered on iOS, which is an automatic rejection:

- `NSPhotoLibraryUsageDescription` — required by `image_picker`
  (`lib/features/onboarding/presentation/screens/profile_upload_screen.dart:51`, gallery picker)
- `LSApplicationQueriesSchemes` with at least `instagram`, `instagram-stories`,
  `facebook-stories`, `whatsapp`, `tg`, `twitter` — required by `appinio_social_share`
  (`lib/features/home/presentation/screens/share_playing_screen.dart:55`) to check installed
  apps / share to Instagram Stories

### 4. Dead Privacy/Terms links on the paywall
`lib/features/onboarding/presentation/screens/pro_screen.dart` (lines ~395-402) renders
"Privacy" and "Terms" links but only "Restore" has an `onTap` handler — Privacy and Terms do
nothing. Apple explicitly requires functional links to the privacy policy and terms of use next
to the subscribe button (Guideline 3.1.2). A privacy policy page exists
(`client-sigma-beryl-15.vercel.app/privacy-policy`) but **no Terms of Service page exists at
all** — that needs to be created too.

## 🟡 Should fix

- **iOS deployment target is 12.0** (`ios/Runner.xcodeproj/project.pbxproj`) — recent plugin
  versions (`share_plus 11`, `flutter_secure_storage 10`, `go_router 17`) generally assume iOS
  13+. Bump to 13.0 to avoid CocoaPods warnings/build issues.
- **No `PrivacyInfo.xcprivacy`** for the app target itself (plugins ship their own, but Apple
  increasingly expects the app target to declare one too if it directly touches
  UserDefaults/file timestamps — it does via `shared_preferences`/`get_storage`).
- **Weekly-subscription pricing** ("$6.99/wk") must be displayed clearly with duration and
  auto-renewal terms on the actual paywall screen before purchase, not just in the footer text,
  per Guideline 3.1.2.

## ✅ Looks fine

- Firebase is cleanly disabled (no config file needed).
- `dependency_overrides` for `in_app_purchase_android` is Android-only, no iOS impact.
- No tracking/ATT-triggering code found, so no App Tracking Transparency prompt needed.
- Plugin versions (`image_picker`, `path_provider`, `shared_preferences`, `connectivity_plus`)
  are recent enough to ship their own privacy manifests.

## Next steps

1. Fix the Info.plist keys and paywall footer links (quick, code-only).
2. Build a Terms of Service page alongside the existing Privacy Policy page.
3. Scope and implement account deletion (backend endpoint + confirmation UI).
4. Scope and implement iOS receipt verification (App Store Server API, shared secret /
   in-app purchase key from App Store Connect).
