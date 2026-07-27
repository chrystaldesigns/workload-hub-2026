# Workload Hub 2026

Workload Hub 2026 is a React and TypeScript application used to manage course developments, projects, tasks, timelines, calendar capacity, and workload information.

## Verified Baseline

The source on the following branch was verified locally on July 27, 2026:

- Branch: `restore-current-working-version-2026-07-27`
- Verified commit: `0e280b5`
- Firestore project: `workload-hub-2026`
- Local URL: `http://localhost:8080`
- Storage mode: Firestore

The verified source successfully starts, connects to the production Firestore project, and loads the existing application data.

## Architecture

The application uses:

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Express
- Node.js
- Firebase Admin SDK
- Google Cloud Firestore
- Google Cloud Run
- Lucide React icons
- Motion animations

### Application Flow

1. The browser loads the React application.
2. The React application communicates with the Express API in `server.ts`.
3. The Express server uses the Firebase Admin SDK to access Firestore.
4. Firestore stores the persistent application data.
5. The production application is built into the `dist` directory and hosted through Google Cloud Run.

## Important Files

- `server.ts` — Express server, API routes, Firestore connection, and production hosting
- `src/` — React and TypeScript application source
- `package.json` — scripts and dependencies
- `package-lock.json` — locked dependency versions
- `vite.config.ts` — Vite development and build configuration
- `Dockerfile` — Cloud Run container configuration
- `firebase-blueprint.json` — original Firebase/AI Studio configuration information
- `metadata.json` — application metadata
- `tsconfig.json` — TypeScript configuration
- `.gitignore` — prevents generated files, environment files, and credentials from being committed

## Data Storage

Persistent application data is stored in Google Cloud Firestore in:

```text
workload-hub-2026
```

The GitHub repository contains the application source code, but it does not contain the live Firestore records.

A Git tag or GitHub release preserves the application code at a specific point in time. It does not independently back up the Firestore database.

## Authentication and Google Cloud Access

The local Express server uses Google Application Default Credentials to access Firestore.

Local credentials are stored outside this repository in the user’s Google Cloud configuration directory. Credential files, service-account files, private keys, and environment files must never be committed to GitHub.

The current API implementation does not enforce application-user authentication on its API routes. Google Cloud credentials authorize the server’s connection to Firestore; they do not provide individual user sign-in protection for the application.

The deployed Cloud Run service uses its configured Google Cloud identity and permissions to connect to Firestore.

## Environment Variables

The source references the following environment variables:

| Variable | Purpose |
|---|---|
| `FIREBASE_PROJECT_ID` | Preferred explicit Firestore project identifier |
| `GOOGLE_CLOUD_PROJECT` | Alternate Google Cloud project identifier |
| `GCLOUD_PROJECT` | Alternate Google Cloud project identifier |
| `NODE_ENV` | Selects development or production behavior |
| `PORT` | Server port; defaults to `8080` |
| `DISABLE_HMR` | Disables Vite hot-module reloading when set to `true` |

The current source does not reference or require `GEMINI_API_KEY`.

Do not commit actual environment values or credentials. If an `.env.example` file is added later, it must contain placeholders only.
## Prerequisites

Install the following before running locally:

- Node.js and npm
- Google Cloud CLI
- Access to the Google Cloud project `workload-hub-2026`

## First-Time Local Setup

Clone or download the repository, then open Terminal in the repository folder.

Install dependencies:

```bash
npm install
```

Authenticate Application Default Credentials:

```bash
gcloud auth application-default login
```

Select the Google account authorized to access the `workload-hub-2026` project.

Set the quota project:

```bash
gcloud auth application-default set-quota-project workload-hub-2026
```

Do not copy the generated credential file into this repository.

## Run Locally

From the repository folder, run:

```bash
npm run dev
```

A successful startup displays:

```text
[Firestore] Connected to project: workload-hub-2026
Server running on http://0.0.0.0:8080
Storage mode: Firestore
```

Open:

```text
http://localhost:8080
```

Stop the server by returning to Terminal and pressing **Control + C**.
## Build and Production Test

Create a production build:

```bash
npm run build
```

Start the built application:

```bash
npm start
```

Available npm scripts:

| Command | Purpose |
|---|---|
| `npm run dev` | Runs the development server through `tsx` |
| `npm run build` | Builds the React application and bundles the Express server |
| `npm start` | Runs the built server from `dist/server.cjs` |
| `npm run clean` | Removes the generated `dist` directory |
| `npm run lint` | Runs the repository’s current lint placeholder |

## Secret and Configuration Protection

The `.gitignore` excludes:

- `node_modules/`
- `dist/`
- `.env` and `.env.*` files, except `.env.example`
- PEM and private-key files
- Credential and service-account JSON files
- Application Default Credentials
- macOS `.DS_Store` files

Before every commit, review:

```bash
git status --short
git diff
```

Never commit credentials, API keys, access tokens, private keys, or real environment values.
## Recovery and Rollback

The official Phase 1 GitHub release and tag created after this documentation is committed will be the permanent code rollback point.

To inspect available tags:

```bash
git tag --list
```

To inspect a tagged version without changing the current branch:

```bash
git show TAG_NAME
```

To create a recovery branch from the verified tag:

```bash
git switch -c recovery-from-phase-1 TAG_NAME
```

Creating a separate recovery branch preserves the current branch and avoids overwriting newer work.

Because live application data is stored separately in Firestore, rolling back the Git source does not roll back Firestore records.

## Deployment

Production deployment uses the included `Dockerfile` and Google Cloud Run configuration.

Before deploying:

1. Confirm the correct Google Cloud project.
2. Confirm the Cloud Run service identity has the required Firestore permissions.
3. Build and test the application locally.
4. Confirm no credentials or environment files are staged.
5. Preserve a Git commit and tag for the deployable source.
6. Avoid changing or deleting Firestore data during deployment verification.
## Phase 1 Verification

The following checks were completed on July 27, 2026:

- Compared the available working application and GitHub source
- Identified the verified source branch and commit
- Reviewed the application architecture
- Confirmed Firestore as the persistent data store
- Identified Firebase, Firestore, Cloud Run, authentication, environment variables, and dependencies
- Confirmed sensitive local configuration was not tracked
- Added protection for future environment and credential files
- Installed and configured Google Cloud CLI locally
- Configured Application Default Credentials
- Assigned `workload-hub-2026` as the quota project
- Started the application locally
- Confirmed connection to the correct Firestore project
- Confirmed existing application data loaded successfully

The Phase 1 rollback tag and GitHub release should be created after this documentation is committed.
