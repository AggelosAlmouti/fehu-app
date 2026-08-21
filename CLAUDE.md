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

Auth state is a React Context (`AuthProvider`/`useAuth`), not a plain hook — this is deliberate: more than one component (the app shell, the dashboard) needs the same live auth state, and independent `onAuthStateChanged` listeners per hook call risk racing into separate sessions.

Sign-in is mandatory and Google-only — plain `signInWithPopup`, no anonymous accounts. `AuthProvider` exposes a `loading` flag (true until the first `onAuthStateChanged` callback fires) so `AppShell` can avoid flashing the sign-in screen while Firebase checks for an existing session; `AppShell` renders a full-screen "Sign in with Google" gate whenever there's no `user`, and only renders the app (sidebar/nav/`children`) once signed in. There is deliberately no local-only/anonymous mode — every expense is tied to a real account from the first write, which avoids an earlier class of bugs around orphaned anonymous data and popup/credential-linking edge cases.

Firestore security rules (managed in the Firebase console, not checked into this repo) restrict each user's data to `request.auth.uid == userId` on `/users/{userId}/expenses/**`.

### Data layer

- `lib/firebase.ts` — initializes the Firebase app, `auth`, and `db`. Firestore uses `persistentLocalCache` for offline read/write support (writes queue locally and sync when back online).
- `public/service-worker.js` — service worker covering *app-shell* offline support (separate from Firestore's data-level offline support above): network-first for same-origin GET requests, falling back to the cache when offline; deliberately ignores cross-origin requests (so it never intercepts Firestore/Google API calls) and non-GET requests. Registered from `components/app-shell.tsx`, production builds only (`npm run dev` never registers it, so cached code doesn't go stale while iterating). `AppShell` also tracks `navigator.onLine` to show a "no internet connection" message on the sign-in screen instead of a sign-in button that's guaranteed to fail offline.
- `lib/use-expenses.ts` — realtime Firestore hook (`onSnapshot`) scoped to `/users/{uid}/expenses`, ordered by date. `addExpense` writes a new doc; there's no update/delete yet.
- `lib/data.ts` — **not** a data source (the old hard-coded expense array was removed once Firestore was wired up). It's shared `Expense`/`CategoryId` types, static category config (`categories`/`categoryMap`, not yet user-editable or persisted), the `monthlyBudget` constant (also not yet persisted — still hard-coded), and formatting helpers (`formatCurrency`, `relativeDay`, `currentMonthLabel`).

### Styling

Tailwind v4 theme tokens are defined in `app/globals.css` via CSS variables + `@theme inline`: `background`, `foreground`, `accent`, `detail`, `muted`, `border`, `border-strong`, `card`, `surface`, `radius-card`. Use these token names (`bg-card`, `text-detail`, etc.) rather than raw hex values or ad hoc colors.

### Path alias

`@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/lib/data`, `@/components/dashboard`.

### Environment

Firebase web config lives in `.env.local` as `NEXT_PUBLIC_FIREBASE_*` variables (gitignored, required for `lib/firebase.ts` to initialize).
