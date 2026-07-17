# Local setup

## Requirements

- Node.js 22.13 or newer
- npm
- Access to the Firebase project `cbu-lost-and-found`
- Access to the Cloudinary cloud used by the Android app

## 1. Install dependencies

```powershell
npm install
```

## 2. Configure the browser client

Copy `.env.example` to `.env.local`, then fill every value.

```powershell
Copy-Item .env.example .env.local
```

Firebase values come from **Firebase Console → Project settings → Your apps → CBU Find Web → SDK setup and configuration**. The registered web app ID is `1:844398747634:web:a763726255f3db478e556b`.

Cloudinary values are the public cloud name and unsigned upload preset. Never add the Cloudinary API secret to this project.

`.env.local` is ignored by Git. `.env.example` contains placeholders only.

## 3. Confirm Firebase services

In Firebase Console:

1. Authentication has Email/Password, Google, and Phone enabled.
2. Authentication → Settings → Authorized domains includes `localhost`.
3. Phone authentication's SMS region policy allows Zambia if real `+260` numbers will be used.
4. Cloud Firestore's default database exists.
5. The rules and indexes from this repository are deployed.

```powershell
firebase login
firebase use cbu-lost-and-found
firebase deploy --only firestore
```

## 4. Start locally

```powershell
npm run dev
```

Open `http://localhost:3000`.

## 5. Verify the shared connection

Follow the cross-device checklist in [Android ↔ web connection](ANDROID_WEB_CONNECTION.md). A report created on either client should appear on the other without manual refresh.

## Safe configuration notes

- Firebase browser configuration is an identifier set, not an administrator credential. Firestore rules provide authorization.
- Never commit service-account JSON, Firebase Admin credentials, Cloudinary API secrets, signing keys, or personal test credentials.
- Keep the Cloudinary unsigned preset restricted to images, allowed formats, size limits, and the intended folder.
