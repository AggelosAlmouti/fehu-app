# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run a production build

There is no linter or test suite configured in this repo — ESLint was deliberately removed (TypeScript's own diagnostics already cover unused-variable checks; the rest of the overlap wasn't worth keeping for this project).

## Architecture

Fehu is a personal finance tracker PWA: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Firebase (Firestore + Auth).

### Routing

Flat structure under `app/` (no route groups). `app/page.tsx` renders the `Dashboard` at `/` — this is the one fully-built screen. `app/budgets`, `app/categories`, `app/insights`, `app/settings` are each a one-line page rendering `components/page-placeholder.tsx` (icon + description empty state) — no real functionality yet. `app/layout.tsx` wraps every page in `AuthProvider` (from `lib/use-auth.tsx`) and then `AppShell` (from `components/app-shell.tsx`, sidebar on desktop / burger-drawer on mobile), with nav items sourced from `lib/nav.ts`.

### Auth model (`lib/use-auth.tsx`)

Auth state is a React Context (`AuthProvider`/`useAuth`), not a plain hook — this is deliberate: more than one component (the app shell's sign-in banner, the dashboard) needs the same live auth state, and independent `onAuthStateChanged` listeners per hook call risk racing into separate anonymous accounts.

Sign-in flow, in order:
1. On first load, the app silently creates a Firebase **anonymous** account (`signInAnonymously`) — no login screen, usable immediately, offline-capable.
2. "Sign in with Google" calls `linkWithPopup` to upgrade that *same* anonymous account in place, preserving its `uid` (and therefore its Firestore data).
3. If that Google account is already linked to a *different* anonymous session (e.g. signed in previously on another device), `linkWithPopup` rejects with `auth/credential-already-in-use`. The fallback does **not** open a second popup (Chrome blocks a popup that isn't chained directly off a fresh click) — it extracts the already-obtained credential via `GoogleAuthProvider.credentialFromError(err)` and calls `signInWithCredential` directly.

Firestore security rules (managed in the Firebase console, not checked into this repo) restrict each user's data to `request.auth.uid == userId` on `/users/{userId}/expenses/**`.

### Data layer

- `lib/firebase.ts` — initializes the Firebase app, `auth`, and `db`. Firestore uses `persistentLocalCache` for offline read/write support (writes queue locally and sync when back online). Note: this covers *data* offline support only — there is no service worker yet, so the app shell itself (JS/CSS/HTML) is not cached for offline loading.
- `lib/use-expenses.ts` — realtime Firestore hook (`onSnapshot`) scoped to `/users/{uid}/expenses`, ordered by date. `addExpense` writes a new doc; there's no update/delete yet.
- `lib/data.ts` — **not** a data source (the old hard-coded expense array was removed once Firestore was wired up). It's shared `Expense`/`CategoryId` types, static category config (`categories`/`categoryMap`, not yet user-editable or persisted), the `monthlyBudget` constant (also not yet persisted — still hard-coded), and formatting helpers (`formatCurrency`, `relativeDay`, `currentMonthLabel`).

### Styling

Tailwind v4 theme tokens are defined in `app/globals.css` via CSS variables + `@theme inline`: `background`, `foreground`, `accent`, `detail`, `muted`, `border`, `border-strong`, `card`, `surface`, `radius-card`. Use these token names (`bg-card`, `text-detail`, etc.) rather than raw hex values or ad hoc colors.

### Path alias

`@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/lib/data`, `@/components/dashboard`.

### Environment

Firebase web config lives in `.env.local` as `NEXT_PUBLIC_FIREBASE_*` variables (gitignored, required for `lib/firebase.ts` to initialize).
