# Security

## Never commit

- Firebase Admin/service-account JSON
- Cloudinary API secrets
- Passwords, verification codes, or personal test accounts
- Signing keys or private certificates
- `.env.local` or production secret files

Firebase browser configuration and the Cloudinary unsigned preset are visible to every browser user. Security must come from Firestore rules, authentication, and a tightly restricted upload preset.

## Current controls

- Firestore reads require authentication.
- Users can write only their own profile.
- Report creation and updates require matching Firebase UID ownership.
- Item type/status values and major text lengths are validated.
- Browser images are compressed before upload.
- The Cloudinary client never receives an API secret.

## Production hardening

- Enable Firebase App Check for supported web and Android clients.
- Add abuse monitoring, moderation, reporting, and blocking.
- Replace unsigned Cloudinary uploads with server-signed uploads for a campus-wide launch.
- Add account deletion and a privacy policy.
- Restrict authorized domains and audit Firebase provider settings.
- Add Firebase Emulator Suite rule tests before broad release.
- Treat contact details and item photos as personal data with a retention policy.

## Reporting a problem

Do not open a public issue containing credentials or personal information. Contact the repository owner privately with reproduction steps and impact.
