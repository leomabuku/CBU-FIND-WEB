# Changelog

## 1.2.0 — 2026-07-17

- Added responsive inbox and private one-to-one report conversations.
- Added real-time messages and unread indicators shared with the Android app.
- Added Cloudinary chat uploads for images, videos, PDFs, and text files up to 20 MB.
- Added participant-only Firestore rules and the conversation inbox index.
- Added direct “Message reporter” actions to report details.

## 1.1.0 — 2026-07-17

- Migrated public production hosting from OpenAI Sites to Cloudflare Workers.
- Added standalone Wrangler configuration and repeatable Cloudflare deployment scripts.
- Authorized the new `workers.dev` production hostname in Firebase Authentication.
- Removed OpenAI Sites-specific runtime files and documentation.
- Added Cloudflare deployment, custom-domain, rollback, and troubleshooting guidance.
- Fixed Cloudflare static-asset routing so the client application loads beyond the initial connecting screen.

## 1.0.0 — 2026-07-17

- Added the responsive CBU FIND web client.
- Connected Firebase Authentication and shared Firestore users/items.
- Added Cloudinary photo uploads compatible with Android report fields.
- Added search, filters, report details, return status, profile editing, and dark mode.
- Added setup, integration, architecture, user, deployment, troubleshooting, security, and contribution guides.
