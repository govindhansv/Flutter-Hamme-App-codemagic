# Snap Kit (Snapchat Creative Kit) setup

Sharing to Snapchat uses the code-only Creative Kit: the app opens the story image in Snapchat's Preview screen.
The native code reads a Snap Kit **client ID** from the app config. With no client ID, Snapchat sharing falls back to
the normal share sheet (iOS) or a plain share intent (Android).

Client IDs are public (they ship inside the app), so they are fine to keep here.

## Snap Kit developer portal

- Org: **hammedev**, https://kit.snapchat.com/manage/org/1aa7f65b-fc23-4c4b-91cc-827dca446040
- App: **Hamme**, app ID `0136830e-255b-4751-9a22-1128517478eb`
  (https://kit.snapchat.com/manage/apps/0136830e-255b-4751-9a22-1128517478eb)
- Platform identifiers (Staging and Production): iOS `com.akash.hammeapp`, Android `com.hamme.app`
- Demo users (can share with the Staging ID): `hammeapp`

| Environment | Public OAuth 2.0 Client ID | Works for |
|---|---|---|
| Staging | `d523c481-e244-48ff-9708-c90b238a3070` | Demo users only |
| Production | `94da0094-1be5-4bed-901f-07019d05a51d` | Everyone, **after Snap approves the app** |

## Current state

The client ID is **removed** from the app so store builds don't ship the Staging ID, which only demo users can use.
Snapchat sharing uses the share sheet until the ID is added back.

## Turning it back on

Add the client ID in both places (Staging for testing with demo users, Production once Snap approves):

`ios/Runner/Info.plist`, next to `MetaAppID`:

```xml
<key>SnapClientID</key>
<string>CLIENT_ID</string>
```

`android/app/src/main/AndroidManifest.xml`, inside `<application>`:

```xml
<meta-data
    android:name="com.hamme.app.SNAP_CLIENT_ID"
    android:value="CLIENT_ID" />
```

Commit `9c10b3b` has the original change with the Staging ID in place.
