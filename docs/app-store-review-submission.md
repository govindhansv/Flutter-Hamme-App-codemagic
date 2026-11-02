# App Store review submission (Hamme iOS 1.0)

Build: the next Codemagic "iOS Build" from `main` at `7b447b7` or later. The build number is set automatically to the
latest TestFlight build + 1.

This build has no Snap Kit client ID. Snapchat sharing uses the iOS share sheet, so reviewers never reach the
Snap Kit Staging setup, which only demo users can use. See `docs/snap-kit-setup.md`.

## Before you submit

1. In TestFlight, install the new build on a real iPhone and check:
   - sign up, then add a profile photo (the system photo picker opens with no permission pop-up first);
   - the paywall: Unlock Unlimited Access, then Subscribe with a Sandbox Apple ID completes;
   - share to Instagram and to Snapchat (both should open the app or the share sheet without errors);
   - Settings → Delete account works.
2. App Store Connect → the 1.0 version → **Build**: select the new build.
3. Make sure `hamme_pro_weekly` is still attached under **In-App Purchases and Subscriptions**.
4. Privacy Policy URL (App Information): `https://www.hamme.app/privacy-policy`.
5. Fill in **App Review Information** with the texts below, then **Add for Review** and **Submit**.

## App Review Information

**Sign-in required:** No. Reviewers can create an account in the app; signup asks only for a name, date of birth
and photo. If you prefer, fill in a demo account here instead.

**Contact:** your name, phone and `support@hamme.app`.

**Notes** (paste and fill in the brackets):

```text
Thank you for reviewing Hamme.

No login is needed: open the app and create an account (name, date of birth, profile photo). No email or phone number is required.

How to test the main flow:
1. Create an account, then tap Share to post your Hamme link or story image to Instagram, Snapchat, or any app from the share sheet.
2. Friends open the link on the web and pick a reaction. Received reactions appear in the Play tab; a match happens when two people pick the same reaction for each other.

In-App Purchase (hamme_pro_weekly, weekly auto-renewing subscription):
Tap "Unlock Unlimited Access" → Subscribe. The plan name, weekly price, and auto-renewal / cancellation terms are shown on the paywall before purchase.
Sandbox Apple ID: [sandbox email] / [password]

Changes since the last review:
- Photo access (5.1.1(iv)): the app opens the system photo picker directly. There is no custom pre-permission screen and no photo-library permission prompt.
- Paywall (3.1.2): the Subscribe button, plan name, weekly price, and auto-renew/cancel terms are clearly shown, with a full-size close button.
- The app is iPhone-only, portrait.
- Fixed a purchase issue where an expired, unfinished transaction could block a new subscription.

Safety (user-generated content): users must agree to the Terms and Community Guidelines (zero tolerance) before creating an account. Every vote card has Report and Block, hidden or reported content is removed from the feed immediately, and reports are reviewed within 24 hours. Settings → Safety & support has contact details.

Account deletion: Settings → Delete account (permanent).

Privacy Policy: https://www.hamme.app/privacy-policy
Support: support@hamme.app
```

## What's New in This Version

Not needed for a first release (1.0). If App Store Connect asks for it:

```text
Welcome to Hamme! Share your link, see how your friends react, and find out when the feeling is mutual.
```

## TestFlight "What to Test" (optional, for testers)

```text
- Share your story image to Instagram and Snapchat.
- Subscribe from the paywall with a Sandbox account.
- Add or change your profile photo.
- Settings → Delete account.
```
