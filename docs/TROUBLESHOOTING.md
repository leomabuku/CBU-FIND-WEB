# Troubleshooting

## The app says an environment variable is missing

Copy `.env.example` to `.env.local`, fill the Firebase and Cloudinary values, and restart the development server. Public variables are embedded at build time.

## Google sign-in opens and then fails

- Enable Google in Firebase Authentication.
- Add `localhost` and the production hostname to Authorized domains.
- Confirm the web app's Firebase configuration is being used, not the Android app ID.
- Allow popups for the site.

## Phone code is not sent

- Enable Phone authentication.
- Use E.164 format (`+260…`).
- Allow Zambia in the SMS region policy.
- Check SMS quota or use Firebase fictional test numbers during development.
- Add the current hostname to Authorized domains.

## `permission-denied`

Deploy `firestore.rules` to `cbu-lost-and-found`. Confirm the signed-in UID matches `userId` for item changes or the user document ID for profile changes.

## Firestore requests mention a missing index

Deploy `firestore.indexes.json` and wait for both composite indexes to become Enabled in Firebase Console.

## Images fail to upload

- Confirm the Cloudinary cloud name and unsigned preset.
- Confirm the preset is enabled and accepts JPG images.
- Review allowed formats, folder restrictions, and maximum file size.
- Never solve this by adding an API secret to browser code.
- A report can be published without photos by clearing the selected images.

## Web changes do not appear on Android

- Confirm both clients use project `cbu-lost-and-found`.
- Confirm both users are signed in and have network access.
- Check the exact document in Firestore Console.
- Confirm `type`, `status`, `date`, and category values match the connection contract.
- Android may briefly show cached Firestore data; wait for its online sync indicator.

## Build command fails on Windows

Use `npm.cmd` if PowerShell blocks `npm.ps1`, or adjust the local execution policy according to your organization's security policy. Project scripts are cross-platform and do not rely on Unix-only inline environment syntax.

## Wrangler says you are not authenticated

Run `npx wrangler login`, approve the browser authorization, then confirm the correct account with `npx wrangler whoami`.

## Cloudflare deploy fails after uploading assets

- Retry once if the error says Cloudflare's API hostname could not be resolved.
- Run `Resolve-DnsName api.cloudflare.com` to check DNS.
- Confirm `nodejs_compat` appears only once in the generated `dist/server/wrangler.json`.
- Run `npm run deploy:cloudflare:dry` before another production attempt.
- Inspect Wrangler's reported log file for the Cloudflare error code.

## The Cloudflare site loads but Google or phone sign-in fails

Add the exact `workers.dev` or custom hostname to Firebase Authentication's Authorized domains. Email/password sign-in alone is not sufficient proof that OAuth and phone flows are correctly configured.
