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

Sign-in is mandatory and Google-only — `signInWithPopup`, no anonymous accounts. `signInWithRedirect` was tried as a fix for a mobile popup issue (see below) but turned out broken more broadly (`getRedirectResult` silently resolving with nothing, on `localhost` *and* on the real deployed domain, desktop *and* mobile — never fully root-caused, suspected browser third-party-storage policy) and had an unwanted plain full-page-navigation feel compared to popup's overlay-in-context style. Reverted to popup.

The real mobile problem popup has: mobile browsers generally don't support true popup windows, which breaks Firebase's "is the popup still open" polling detection — closing the popup could leave the sign-in UI hanging indefinitely. There's no fully reliable cross-platform event for "the popup closed" (that would require polling the popup window directly, which `signInWithPopup` doesn't expose), so `AppShell`'s `handleSignIn` combines two imperfect signals rather than relying on one: it reacts to whichever of `document.visibilitychange` (tab regaining visibility) or `window`'s `focus` event fires first — either can mean the popup closed *or* completed successfully, so it gives the real result a 3s grace period (generous enough for a slow connection finishing the token exchange) before concluding it failed — plus a guaranteed 30s backstop timeout in case neither event fires at all on a given browser/platform. The backstop is deliberately long, not tight: it's a rare last resort for "nothing told us anything," not a normal-case timer, so it shouldn't mistake a slow-but-succeeding sign-in for a failure. This is UI-only — it can't cancel the underlying popup promise, so if sign-in succeeds late anyway, `onAuthStateChanged` still picks it up globally and the app moves past the sign-in screen regardless of what the button showed.

`googleProvider` is configured with `prompt: "select_account"` so the account chooser always shows, rather than silently reusing whatever Google session already exists in the browser. `AuthProvider` exposes a `loading` flag (true until the first `onAuthStateChanged` callback fires) so `AppShell` can avoid flashing the sign-in screen while Firebase checks for an existing session; `AppShell` renders a full-screen "Sign in with Google" gate whenever there's no `user`, and only renders the app (sidebar/nav/`children`) once signed in. There is deliberately no local-only/anonymous mode — every expense is tied to a real account from the first write, which avoids an earlier class of bugs around orphaned anonymous data and popup/credential-linking edge cases.

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

Firebase web config lives in `.env.local` as `NEXT_PUBLIC_FIREBASE_*` variables (gitignored, required for `lib/firebase.ts` to initialize).
