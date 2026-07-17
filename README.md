# CBU FIND Web

The responsive web client for CBU FIND, Copperbelt University's community lost-and-found service. It connects to the same Firebase Authentication and Cloud Firestore project as the native Android app, so accounts, profiles, reports, photos, and returned-item status stay synchronized across both clients.

## Live website

**Production:** [https://cbu-find-web.leokmabuku.workers.dev](https://cbu-find-web.leokmabuku.workers.dev)

The public website is hosted directly on Cloudflare Workers. Firebase continues to provide shared authentication and data for Android and web; Cloudinary continues to deliver uploaded images.

## What the web app includes

- Email/password, Google, and phone authentication
- Live lost and found feeds from the shared Firestore `items` collection
- Search, category filters, lost/found tabs, and returned-item filtering
- Report creation with up to three compressed Cloudinary images
- Full report details, safe contact actions, and owner-only "mark returned" updates
- Editable student profiles and a personal report history
- Responsive desktop/mobile navigation and light/dark themes
- Firebase-compatible field names and status values matching the Android app

## Start here

1. Read [Local setup](docs/SETUP.md).
2. Read [Android ↔ web connection](docs/ANDROID_WEB_CONNECTION.md) before changing data fields.
3. Use [User guide](docs/USER_GUIDE.md) to test the full workflow.
4. Use [Deployment guide](docs/DEPLOYMENT.md) for publishing.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Documentation

| Guide | Purpose |
| --- | --- |
| [Setup](docs/SETUP.md) | Firebase, Cloudinary, environment variables, and local run instructions |
| [Connection contract](docs/ANDROID_WEB_CONNECTION.md) | Shared collections, fields, enums, indexes, and cross-device verification |
| [Architecture](docs/ARCHITECTURE.md) | Components, services, data flow, and design decisions |
| [User guide](docs/USER_GUIDE.md) | Sign-in, reporting, browsing, profiles, and return workflow |
| [Deployment](docs/DEPLOYMENT.md) | GitHub, production hosting, Firebase domains, and release checklist |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common auth, Firestore, index, upload, and build issues |
| [Security](SECURITY.md) | Client configuration, rules, uploads, and production hardening |
| [Contributing](CONTRIBUTING.md) | Safe change and verification workflow |

## Commands

```powershell
npm run dev      # local development
npm run build    # production build
npm test         # build plus rendered HTML checks
npm run lint     # static checks
npm run deploy:cloudflare:dry # validate the Cloudflare package
npm run deploy:cloudflare     # build and deploy publicly
```

## Important boundary

This repository is a separate web client. The Android source directory is not modified. Shared behavior comes from Firebase and Cloudinary, not from copying runtime state between folders.

## License

No license has been selected. Add one before accepting external redistribution or contributions.
