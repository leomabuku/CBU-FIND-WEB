# Deployment guide

## Release checklist

Before every release:

```powershell
npm install
npm run lint
npm test
git status --short
```

Then complete one cross-device test from `ANDROID_WEB_CONNECTION.md`.

## GitHub

Create a dedicated repository such as `CBU-FIND-WEB`. Do not place web files in the Android repository.

```powershell
git init
git add .
git commit -m "Launch CBU FIND web client"
gh repo create CBU-FIND-WEB --private --source . --remote origin --push
```

Choose `--public` only when the source is intended to be public. `.env.local` is ignored and must never be force-added.

## Production configuration

The build requires the values listed in `.env.example`. Configure them in the hosting platform before building. They are browser-visible identifiers, but they should still be managed consistently per environment.

After a production URL is assigned, add its hostname under **Firebase Console → Authentication → Settings → Authorized domains**. Google popup and phone sign-in can fail until this is done.

## Firebase rules and indexes

Deploy only after reviewing the target project:

```powershell
firebase use cbu-lost-and-found
firebase deploy --only firestore
```

Index creation may take several minutes. Do not remove the Android-required composite indexes.

## Sites deployment

The repository includes a Cloudflare Worker-compatible Vinext build and `.openai/hosting.json`. A Sites release packages `dist`, saves the exact Git commit, and deploys the saved version. Keep the hosting project ID in `.openai/hosting.json` after it is assigned.

## Rollback

1. Identify the last known-good Git commit.
2. Create a new revert commit rather than rewriting shared history.
3. Build and test it.
4. Deploy the new saved version.

Firebase data is independent of the site deployment. A frontend rollback does not roll back Firestore documents.
