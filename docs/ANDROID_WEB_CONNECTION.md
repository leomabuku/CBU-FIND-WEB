# Android ↔ web connection contract

Both applications are clients of the same services:

| Concern | Shared service |
| --- | --- |
| Identity | Firebase Authentication project `cbu-lost-and-found` |
| Profiles | Cloud Firestore collection `users` |
| Reports | Cloud Firestore collection `items` |
| Images | Cloudinary cloud `campuslostandfound` |
| Live updates | Firestore snapshot listeners |

There is no file-level connection between the Android and web source trees. The database contract is the connection.

## User document

Path: `users/{firebaseUid}`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Full display name |
| `studentId` | string | CBU student identifier |
| `email` | string | May be empty for phone-only accounts |
| `programme` | string | Academic programme |
| `yearOfStudy` | string | Kept as a string to match Android |
| `phone` | string | Contact number |
| `photoUrl` | string | Public Cloudinary HTTPS URL |
| `createdAt` | number | Unix time in milliseconds |

The document ID is the Firebase Authentication UID. Do not store a separate `id` field inside the document; Android's `@DocumentId` supplies it when reading.

## Item document

Path: `items/{generatedDocumentId}`

| Field | Type | Allowed values / purpose |
| --- | --- | --- |
| `type` | string | `LOST` or `FOUND` |
| `title` | string | 3–120 characters |
| `description` | string | Up to 2,000 characters |
| `category` | string | One of the shared category labels |
| `location` | string | Human-readable campus place |
| `imageUri` | string or null | First image, retained for older Android compatibility |
| `imageUrls` | string[] | Zero to three Cloudinary URLs |
| `date` | number | Unix time in milliseconds |
| `status` | string | `ACTIVE` or `RESOLVED` |
| `userId` | string | Firebase UID of the report owner |
| `contactInfo` | string | Safe contact method visible to signed-in users |
| `resolvedAt` | number or null | Set when the owner closes the report |

Do not rename enums or convert timestamps to Firestore `Timestamp` objects without updating Android and web together.

## Shared categories

The exact category strings live in `lib/types.ts` and mirror `ItemCategories` in Android. Treat spelling changes as a schema migration because existing filters compare exact strings.

## Required indexes

The included `firestore.indexes.json` supports Android queries:

- `type ASC, date DESC`
- `userId ASC, date DESC`

The web feed reads all reports ordered by date and filters locally. The profile view uses the `userId/date` index.

## Cross-device verification

1. Sign in on Android with an existing Firebase account.
2. Sign in on web with the same account.
3. Edit the web profile; reopen Android profile and confirm the change.
4. Publish a `LOST` report on web; confirm it appears in Android's Lost tab.
5. Publish a `FOUND` report on Android; confirm it appears on web.
6. Mark one report returned on the owner client; confirm the other client hides it unless “Show returned” is enabled.
7. Confirm photos load in both clients.

## Making schema changes safely

1. Update Firestore rules first in a test environment.
2. Make Android readers tolerate the new field.
3. Make web readers tolerate the new field.
4. Deploy additive changes.
5. Backfill old records if required.
6. Only then make the field mandatory.
