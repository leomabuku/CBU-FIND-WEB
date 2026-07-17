# Cloudflare deployment guide

## Current production deployment

- Public URL: `https://cbu-find-web.leokmabuku.workers.dev`
- Cloudflare Worker: `cbu-find-web`
- Source repository: `leomabuku/CBU-FIND-WEB`
- Firebase project: `cbu-lost-and-found`

The website is hosted by Cloudflare Workers. Firebase Authentication and Firestore remain the shared backend for Android and web, while Cloudinary continues to store images.

## Release checklist

Before every release:

```powershell
npm install
npm run lint
npm test
npm audit
git status --short
```

Complete at least one cross-device test from `ANDROID_WEB_CONNECTION.md` when authentication, reports, profiles, or Firestore fields change.

## First-time Cloudflare authentication

Install dependencies and authorize Wrangler with the intended Cloudflare account:

```powershell
npm install
npx wrangler login
npx wrangler whoami
```

Wrangler stores its OAuth credentials outside this repository. Never commit Cloudflare tokens.

## Build-time environment

Copy `.env.example` to `.env.local` and populate the public Firebase and Cloudinary browser configuration. Variables prefixed with `NEXT_PUBLIC_` are embedded in the client during `npm run build`; setting them only after the build is too late.

`.env.local` is ignored by Git. When using CI or Cloudflare Workers Builds, add the same values as protected build variables.

## Validate without publishing

```powershell
npm run deploy:cloudflare:dry
```

This produces the Vinext Worker bundle, checks its modules and static assets, and exits before changing production.

## Deploy production

```powershell
npm run deploy:cloudflare
```

The command:

1. builds the application with Vinext;
2. generates `dist/server/wrangler.json` for the compiled Worker;
3. uploads `dist/client` as Cloudflare static assets;
4. deploys the Worker to the public `workers.dev` route.

`wrangler.jsonc` is the version-controlled source configuration. Do not edit generated files under `dist`.

## Firebase authorized domain

Every production or custom hostname used for Google or phone authentication must be listed in **Firebase Console → Authentication → Settings → Authorized domains**.

The current Cloudflare hostname, `cbu-find-web.leokmabuku.workers.dev`, was authorized on 2026-07-17.

## Custom domain

To use a domain such as `find.example.com`:

1. Add the domain to the Cloudflare account as an active zone.
2. Open **Workers & Pages → cbu-find-web → Settings → Domains & Routes**.
3. Add the custom hostname.
4. Add that exact hostname to Firebase Authentication's Authorized domains.
5. Test email, Google, and phone sign-in before advertising the domain.

Cloudflare provisions the Worker route and TLS certificate for a valid custom domain.

## GitHub and future releases

The GitHub repository is private. A normal release sequence is:

```powershell
git add <changed-files>
git commit -m "Describe the release"
git push origin main
npm run deploy:cloudflare
```

For automated GitHub Actions deployment, create a scoped Cloudflare API token and store it as `CLOUDFLARE_API_TOKEN`, with the account ID stored as `CLOUDFLARE_ACCOUNT_ID`. Do not place either value in the workflow file or repository source.

## Rollback

Use the Cloudflare dashboard's Worker deployment history to select a known-good version, or use Wrangler's deployment/rollback commands. A frontend rollback does not roll back Firebase documents or Cloudinary images.

After rollback, verify the homepage, authentication screen, Firestore feed, and one image URL.
