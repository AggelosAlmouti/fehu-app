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

**⚠️ This auth system has been through a lot of iteration and is still a little rough around the edges.** Sign-in specifically went through several full redesigns (`signInWithPopup` → `signInWithRedirect` → back to popup with hand-built hang-detection → the current Google Identity Services approach below) chasing a mobile popup-hang bug — see git history / prior session notes for the full saga if something here seems inconsistent or overbuilt. The current approach is confirmed working on desktop (both `localhost` and the deployed domain); **not yet re-confirmed on mobile since the GIS switch** — that's the main thing still worth testing before trusting this area is fully settled.

Sign-in is mandatory and Google-only, currently implemented with **Google Identity Services (GIS)** — Google's own client-side library (loaded via `next/script` in `AppShell`) — rather than Firebase's own `signInWithPopup`/`signInWithRedirect`. GIS renders and manages its own button and popup lifecycle via `renderButton()`; our callback (passed to `google.accounts.id.initialize`) only ever fires with a real credential on success, so there's no "did the user close it" ambiguity to detect at all. The credential is exchanged for a Firebase session via `signInWithGoogleCredential` (`lib/use-auth.tsx`), which wraps `GoogleAuthProvider.credential(idToken)` + `signInWithCredential`.

**Deliberately not using GIS's One Tap `prompt()` flow** (tried it — a custom-styled button calling `prompt()`, with real cancel detection via `notification.getSkippedReason()`). It works, but depends on FedCM, which Chrome can silently suppress for a site after a user dismisses the prompt a few times — with no reliable way to detect or recover from that (Google's FedCM migration guide confirms the detail needed to distinguish this from an ordinary cancel, `getNotDisplayedReason()`, is being removed entirely for privacy reasons). `renderButton()`'s classic popup flow doesn't go through FedCM at all, so it isn't subject to this failure mode — chosen for that reason over the cosmetic benefit of a theme-matched custom button.

Prior to GIS: `signInWithPopup` worked but mobile browsers generally don't support true popup windows, breaking Firebase's own "is the popup still open" detection and leaving the sign-in UI hanging indefinitely if closed without completing. `signInWithRedirect` was tried as a fix but turned out broken more broadly — `getRedirectResult` silently resolving with nothing, reproduced on `localhost` *and* the real deployed domain, desktop *and* mobile, even in a clean Incognito profile (never fully root-caused, suspected browser third-party-storage policy) — and had an unwanted plain full-page-navigation feel besides. GIS was adopted specifically because it sidesteps this entire class of problem by design rather than needing another workaround.

`AuthProvider` exposes a `loading` flag (true until the first `onAuthStateChanged` callback fires) so `AppShell` can avoid flashing the sign-in screen while Firebase checks for an existing session; `AppShell` renders a full-screen sign-in gate whenever there's no `user`, and only renders the app (sidebar/nav/`children`) once signed in. There is deliberately no local-only/anonymous mode — every expense is tied to a real account from the first write, which avoids an earlier class of bugs around orphaned anonymous data and popup/credential-linking edge cases.

Firestore security rules (managed in the Firebase console, not checked into this repo) restrict each user's data to `request.auth.uid == userId` on `/users/{userId}/expenses/**`.

### Data layer

- `lib/firebase.ts` — initializes the Firebase app, `auth`, and `db`. Firestore uses `persistentLocalCache` for offline read/write support (writes queue locally and sync when back online).
- `public/service-worker.js` — service worker covering *app-shell* offline support (separate from Firestore's data-level offline support above): network-first for same-origin GET requests, falling back to the cache when offline; deliberately ignores cross-origin requests (so it never intercepts Firestore/Google API calls) and non-GET requests. Registered from `components/app-shell.tsx`, production builds only (`npm run dev` never registers it, so cached code doesn't go stale while iterating). `AppShell` also tracks `navigator.onLine` to show a "no internet connection" message on the sign-in screen instead of a sign-in button that's guaranteed to fail offline.
- `lib/use-expenses.ts` — realtime Firestore hook (`onSnapshot`) scoped to `/users/{uid}/expenses`, ordered by date. `addExpense` writes a new doc; there's no update/delete yet.
- `lib/data.ts` — **not** a data source (the old hard-coded expense array was removed once Firestore was wired up). It's shared `Expense`/`CategoryId` types, static category config (`categories`/`categoryMap`, not yet user-editable or persisted), the `monthlyBudget` constant (also not yet persisted — still hard-coded), and formatting helpers (`formatCurrency`, `relativeDay`, `currentMonthLabel`).

### Styling

Tailwind v4 theme tokens are defined in `app/globals.css` via CSS variables + `@theme inline`: `background`, `foreground`, `accent`, `detail`, `muted`, `border`, `border-strong`, `card`, `surface`, `radius-card`. Use these token names (`bg-card`, `text-detail`, etc.) rather than raw hex values or ad hoc colors.

Any `<input>`/`<textarea>`/`<select>` needs `text-base` (16px) or larger — iOS Safari auto-zooms the page on focus if a form field's font size is under 16px. There's no global guard against this (a blanket CSS rule would also shrink the intentionally-large amount input in `add-expense-sheet.tsx`), so it has to be applied per-field.

### Path alias

`@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/lib/data`, `@/components/dashboard`.

### Environment

Firebase web config lives in `.env.local` as `NEXT_PUBLIC_FIREBASE_*` variables (gitignored, required for `lib/firebase.ts` to initialize). `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is the OAuth Web client ID Firebase auto-created for the Google sign-in provider (same value visible in Firebase console → Authentication → Sign-in method → Google, or Google Cloud Console → Credentials) — required by `AppShell`'s Google Identity Services setup.

**Setup gotcha:** GIS separately requires every origin it'll run from (`http://localhost:3000`, the deployed Vercel domain, etc.) to be listed under that same OAuth Client ID's **"Authorized JavaScript origins"** in Google Cloud Console (APIs & Services → Credentials — a direct link like `https://console.cloud.google.com/apis/credentials?project=<firebase-project-id>` gets there fastest). This is a *different* setting from Firebase's own "Authorized domains" list (Authentication → Settings) — missing it produces a real Google-hosted "Access blocked: Authorisation error" page, not a console warning, so it's easy to mistake for something more exotic if you don't know to look here first.
