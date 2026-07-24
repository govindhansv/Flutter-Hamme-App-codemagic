# 1. iOS Instagram Story sharing fix

## Changes already made

- `ios/Runner/Info.plist` now allows the app to query the `instagram` and
  `instagram-stories` URL schemes. iOS otherwise reports Instagram as
  unavailable even when it is installed.
- Both Instagram Story share flows now read the Meta App ID from the
  `META_APP_ID` build setting instead of sending an empty value.

## Required setup before an iOS release

1. Create or use a Meta developer app and copy its numeric **App ID**.
2. Configure the app's iOS bundle identifier in Meta to match the Runner
   bundle identifier used for the release build.
3. Build with the App ID. For example:

   ```powershell
   flutter build ipa --dart-define=META_APP_ID=123456789012345
   ```

   Use the same `--dart-define` when running locally:

   ```powershell
   flutter run --dart-define=META_APP_ID=123456789012345
   ```

4. Fully uninstall and reinstall the app on a physical iPhone after changing
   `Info.plist`; a hot restart does not apply plist changes.
5. Install Instagram and test the Inbox share button. It should open the
   Instagram Story composer with the generated share image. The link is copied
   to the clipboard for the user to add with Instagram's Link sticker.

## Why Android already worked

Android launches Instagram through an explicit native intent targeting
`com.instagram.android`. Its package visibility is already declared in
`AndroidManifest.xml`. iOS uses protected URL schemes instead, and Apple
requires those schemes to be listed in `LSApplicationQueriesSchemes` before
`canOpenURL` is allowed to detect or open them.

## Notes

- Instagram Story sharing must be tested on a real iPhone; the iOS Simulator
  cannot run Instagram.
- Do not commit a secret in `META_APP_ID`. A Meta App ID is normally public,
  but CI should still provide it through a build variable rather than source
  code.

# 2. Match popup persistence

## Current approach

The Play screen saves IDs of match popups already shown in `SharedPreferences`
on the device. This prevents the same match from appearing every time the app
is reopened while allowing newly created match IDs to appear normally.

This is intentionally local-only because the current product is used on one
device and does not require cross-device account state.

## Retention recommendation

The current saved-ID list is capped at 500 entries. It removes only the
oldest ID when the limit is exceeded; it does not clear all saved data.

The backend only returns matches from the previous 24 hours, so IDs older than
that cannot reappear. In the unlikely event that more than 500 matches arrive
within one 24-hour window, only an evicted oldest match could be shown again.

For a complete local-only solution, store each shown match ID with the time it
was shown and remove entries only after 24 hours. That prevents repeats even
when more than 500 matches are received in one day, without requiring a server
change.

## When server-side persistence is needed

Move match-seen state to the backend only when it must survive app-data
clearing or reinstall, or when the same user can use multiple devices.

# 3. Reinstall and Pro profile restore

## Problem

On iOS, `flutter_secure_storage` stores authentication tokens in the Keychain.
Keychain values can survive an app uninstall, so automatically restoring the
saved session after reinstall could show a normal user's old name, profile
photo, and account data.

## Implemented behavior

- A normal app close and reopen still restores the active session normally.
- On the first launch of a newly installed app, automatic session restoration
  is skipped. The app opens onboarding instead of showing an old profile.
- The old Keychain token is retained only as a possible Pro restore candidate;
  it is never used automatically after reinstall.
- The **Restore** link on the Pro page now restores the App Store/Google Play
  purchase first, then validates the saved profile with the backend.
- The saved profile is restored only when that backend profile is Pro.
- Normal users cannot restore an old profile through this action and continue
  through fresh onboarding.

## Why startup authentication was not removed

Removing `/auth/me` restoration for every startup would log all users out each
time they close and reopen the app. The first-install marker limits the change
to reinstall behavior while preserving normal session continuity.

## Test checklist

1. Complete onboarding as a normal user, close the app, then reopen it. The
   same session should remain active.
2. Uninstall and reinstall the app. It should start at onboarding and not show
   the old profile automatically.
3. For a Pro account with a restorable store purchase, reinstall the app, open
   the Pro page, and tap **Restore**. The previous Pro profile should return
   only after the store restoration and backend validation succeed.
4. Test **Restore** with a normal account. It must not restore the old profile.


# 4. Verified security fixes

Date: 2026-07-24

## 1. JWT signing secrets fail closed

The backend no longer uses predictable fallback values for access and refresh
token signing. Both server entry points now refuse to serve requests unless
`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are configured.

Affected files:

- `backend/src/config/env.js`
- `backend/src/server.js`
- `backend/api/index.js`

Deployment requirement: set both secrets to unique, high-entropy values in the
production environment before deploying.

## 2. Profile-image uploads require authentication

`POST /api/v1/upload/profile-image` now runs JWT authentication before Multer
accepts the image. The upload filter also requires both an approved MIME type
and matching file extension (JPG, PNG, or WEBP).

The Flutter onboarding flow was updated to preserve the selected photo in
memory until guest registration succeeds. It then uploads the image using the
new authenticated session and saves the returned profile image URL.

Affected files:

- `backend/src/routes/uploadRoutes.js`
- `lib/features/profile/data/datasources/upload_remote_data_source.dart`
- `lib/features/onboarding/presentation/screens/profile_upload_screen.dart`
- `lib/features/onboarding/presentation/screens/pro_screen.dart`
- `lib/providers/onboarding_providers.dart`

## 3. Socket.IO rooms are authenticated

Socket connections now require a valid access token, supplied through either
`handshake.auth.token` or an `Authorization: Bearer <token>` header. The server
derives the user ID from the verified token and joins that room automatically.
The client-controlled `join:user` event has been removed.

Future Socket.IO clients must connect with:

```js
io(apiUrl, { auth: { token: accessToken } });
```

Affected file:

- `backend/src/socket.js`

## Verification

- `node --check` passed for all changed backend JavaScript files.
- `git diff --check` passed with no whitespace errors.
- `flutter analyze --no-pub` was attempted but did not complete within 64
  seconds in this workspace and returned no diagnostics before timeout.
