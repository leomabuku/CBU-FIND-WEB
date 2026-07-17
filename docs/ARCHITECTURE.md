# Architecture

## Runtime

The application uses Next.js-compatible React through Vinext and builds to a Cloudflare Worker-compatible bundle. Product behavior is client-side because Firebase Authentication and Firestore use the signed-in browser session.

## Main modules

| Module | Responsibility |
| --- | --- |
| `app/CampusFindApp.tsx` | Authentication state, live report subscription, navigation, search, filters, and theme preference |
| `components/AuthScreen.tsx` | Email/password, Google popup, phone SMS, and profile bootstrapping |
| `components/ReportForm.tsx` | Validation, image upload, and item creation |
| `components/ProfilePanel.tsx` | Profile editing and owner report history |
| `components/ItemDetails.tsx` | Report detail and owner-only return action |
| `components/MessagingPanel.tsx` | Inbox, unread state, real-time thread, composer, and media attachments |
| `lib/chat.ts` | Deterministic report conversation creation and unread calculation |
| `lib/firebase.ts` | Single Firebase app/Auth/Firestore initialization |
| `lib/media.ts` | Browser image compression and Cloudinary upload |
| `lib/types.ts` | Shared TypeScript data contract and category/location constants |
| `lib/errors.ts` | User-friendly Firebase and network errors |

## Data flow

1. Firebase Authentication restores or creates the browser session.
2. `CampusFindApp` reads `users/{uid}` and creates a compatible profile if missing.
3. A Firestore snapshot listener streams `items` ordered by `date`.
4. Search, type, category, and returned filters operate on the live in-memory list.
5. Writes go directly through the Firebase client SDK and are accepted or rejected by Firestore Security Rules.
6. Images are compressed in the browser, uploaded with the restricted unsigned Cloudinary preset, and stored in Firestore as HTTPS URLs.
7. The inbox observes conversations containing the signed-in UID; each open thread observes its ordered `messages` subcollection.
8. Chat media is uploaded through Cloudinary's auto endpoint and the resulting HTTPS URL is written with the message metadata.

## Authorization

The interface hides owner actions from other users, but the interface is not the security boundary. `firestore.rules` enforces:

- signed-in reads;
- profile writes only by the matching UID;
- item ownership on create/update/delete;
- valid enum values and field sizes.
- conversation reads and writes only by one of its two participants;
- append-only messages with sender, size, URL, and media-type validation.

## Local state

Only the light/dark theme preference is stored in `localStorage`. Accounts, profiles, reports, and status are always Firebase-backed.

## Hosting

Vinext compiles the React application into a Cloudflare Worker entry point under `dist/server` and browser assets under `dist/client`. The Cloudflare Vite plugin generates the deployable Wrangler configuration, while the version-controlled `wrangler.jsonc` provides the Worker name, compatibility settings, public route, asset binding, and observability configuration.

Cloudflare D1, R2, and Workers identity are intentionally unused because Firebase and Cloudinary are the Android app's existing shared services.
