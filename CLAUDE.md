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

Two route groups under `app/`: `(marketing)` (public) and `(app)` (authenticated, behind `AppShell`) — route groups don't add a URL segment. `/` is the marketing page; `/dashboard`, `/budgets`, `/insights`, `/settings` are the real app. No Categories page/nav item — budgets themselves are the categorization (see Data layer).

Root `app/layout.tsx` wraps everything in `AuthProvider` only. `app/(app)/layout.tsx` layers `CurrencyProvider` then `AppShell` (`components/app-shell.tsx` — desktop sidebar / mobile burger-drawer) on top, scoped to just the authenticated routes; nav items come from `lib/nav.ts`.

`Wordmark` (`components/wordmark.tsx`) draws the "F" from a cropped image asset, not a font glyph — no Unicode rune matched the actual app icon's letterform closely enough. Hidden on the mobile top bar; only shown in the drawer/sidebar.

Nav links use history-*replacing* navigation, not the default push — sibling tabs shouldn't build browser back/forward history the way drill-down pages do. Fixed a real iOS bug where the extra history entries let the edge-swipe-back gesture flip between tabs mid-navigation.

### Marketing page (`app/(marketing)/page.tsx`)

Public single-page landing at `/`, no auth gate. Everything (hero, features, FAQ) lives in one file, not split into separate components — none of the three sections are reused elsewhere (compare `sheet.tsx`/`empty-state.tsx`, which earn their own files by being shared). Features is a curated subset of what the app actually does, not the full list. FAQ is a from-scratch accordion, one item open at a time.

Makes no install decisions of its own — one CTA, always to `/dashboard`. Install prompting happens after sign-in instead (see Auth model); an earlier version showed a second install button here, simplified away to keep this page free of async, detection-driven UI.

`lib/use-install-prompt.ts` detects whether the app is already installed/running standalone, installable right now (Chromium, via the browser's own install-prompt event), or needs manual instructions — split further into iOS/Safari (matched carefully, since iPadOS reports itself as a desktop Mac) versus every other browser (collapsed together deliberately; only Chrome and Safari get dedicated treatment). A dev-only query-param override forces any state for testing, without the matching device/browser.

The web manifest's install target (`app/manifest.ts`) points at `/dashboard`, not `/` — an installed icon should open the app, not the marketing pitch. Its `<link>` tag is global (injected on every page by Next's standard manifest convention) rather than scoped to just the authenticated routes — a hand-rolled route handler was tried specifically to scope it, then reverted once it was clear the thing it prevented (Chrome's own install icon appearing on `/`) was never actually a correctness bug, since Chrome always resolves the manifest's install target correctly regardless of which page triggered install. The one real risk — iOS's manual "Add to Home Screen," which can bookmark whatever URL is currently loaded instead of the manifest's target — is handled separately, by never showing iOS install instructions anywhere except `/dashboard` (see Auth model).

**Manifest changes don't retroactively apply to an already-installed icon** — the OS snapshots the manifest at install time, and neither iOS nor Android re-checks it promptly. A stale install's fix is always remove-and-reinstall, not a routing bug to chase.

`components/service-worker-registration.tsx` is mounted in the root layout, not `AppShell`, so the install-prompt event can fire even on this pre-auth page (Chromium won't fire it at all without an active service worker).

### Auth model (`lib/use-auth.tsx`)

Auth state is a React Context (`AuthProvider`/`useAuth`), not a plain hook — more than one component needs the same live state, and independent listeners per hook call would risk racing into separate sessions.

**⚠️ Confirmed working on desktop; not yet re-confirmed on mobile since the Google Identity Services switch below** — worth testing before trusting this area is fully settled.

Sign-in is mandatory, Google-only, via **Google Identity Services (GIS)** — Google's own client library — rather than Firebase's own popup/redirect sign-in, both tried first and dropped for real bugs: popup, because mobile browsers generally don't support true popup windows, breaking Firebase's "is it still open" detection and hanging forever if closed early; redirect, because it silently resolved with nothing — reproduced locally and on the deployed domain, desktop and mobile, even a clean browser profile (never fully root-caused). GIS's own popup flow sidesteps this whole class of problem. Deliberately not using GIS's "One Tap" flow either — it depends on a browser mechanism (FedCM) that Chrome can silently suppress after a few dismissals, with no reliable way to detect that it happened.

`lib/firebase.ts` initializes Auth without its default popup/redirect resolver — that resolver proactively loads an extra script on mobile/Safari regardless of whether popup/redirect sign-in is ever used, and was a confirmed contributor to slow-connection hangs. Falls back to the default initialization in dev hot-reload, since Auth can't be initialized twice for the same app.

A second slow-connection hang, found the same way: restoring an already-signed-in session makes its own network call before the first auth-state callback fires, with no way to bound or skip it. Fixed with an optimistic-render layer — the last confirmed signed-in identity is mirrored to local storage and read back after mount (deliberately *not* read synchronously during render — that caused a real hydration mismatch, since the server has no local storage to read). The app renders the real shell optimistically off that remembered identity while the network call is still in flight, only falling back to the sign-in gate once Auth actually reports nobody's signed in. **This only fixed the shell, not the data itself** — see the data-layer note below on why Firestore reads still can't start any earlier this way.

A real, now-fixed bug: navigating away from the sign-in gate and back used to leave the Google button permanently missing, because the script-load callback that renders it only ever fires once per browser session, while the shell component remounts across that navigation. Fixed by also checking whether the script already loaded on mount, rather than relying solely on that callback firing again.

The sign-in gate is now just the Google button — no install control, no divider, no marketing copy. **Install prompting moved to a post-login dialog on direct feedback that the old gate placement wasn't working** — real test demos showed people, iPhone users especially, kept skipping the install step there; a passive option next to a sign-in button is easy to not register as worth doing before you're even in the app. `components/install-prompt-dialog.tsx` is mounted in the signed-in half of `AppShell`, restricted to the dashboard route only (iOS install instructions must never appear anywhere else — see Marketing page). Opens itself shortly after mount whenever install is actually possible and it hasn't been permanently dismissed — a normal close just defers it to the next signed-in visit; only its own explicit "don't show again" sets a permanent flag, which then surfaces a brief toast (`components/toast.tsx`, styled like `loading-pill.tsx`) pointing at Settings as the alternate way in.

Install is also offered from Settings, for anyone who wants it later without waiting for the dashboard. Its iOS instructions are a deliberate, **confirmed** exception to the dashboard-only rule — reaching that row is always a deliberate tap, and an icon installed from there does correctly launch into the app, not into Settings itself.

Account deletion wipes all of the user's Firestore data (batched, while still authenticated) before removing the Auth account itself. It throws if there's no confirmed Firebase session yet — reachable during the optimistic-render window above; `delete-account-dialog.tsx` surfaces that failure with a log-out button right there, rather than requiring a trip to the nav's own logout control.

Firestore security rules (managed in the Firebase console, **not** tracked in this repo) restrict each user's data by their own uid. Keep these in sync by hand whenever a new top-level collection is added — nothing in this repo enforces or even documents drift here automatically.

### Data layer

No fixed category list — budgets themselves are the categorization; an expense optionally references one. Replaced an old hard-coded category enum.

Income is categorized the same way, via a simpler parallel entity — a named source with no amount or cadence, since a source isn't a cap to compare against, just a label. An income transaction optionally references one.

- `lib/firebase.ts` — Firebase app/auth/Firestore init. Firestore uses local persistent caching for offline read/write.
- `app/manifest.ts` — the web manifest. `app/layout.tsx` separately points at a specific icon for iOS's home-screen icon, since iOS Safari doesn't reliably read the manifest's own icons the way Chrome/Android does.
- `public/service-worker.js` — app-shell offline support (separate from Firestore's own offline cache above). **Cache-first**, not network-first — network-first was a real bug on a slow-but-connected network, since a slow fetch doesn't reject the way an offline one does, so the app hung instead of falling back to the already-available cache. Precaches every route up front at install time, so a page's first-ever service-worker-controlled load doesn't depend on an earlier visit having incidentally warmed the cache. Production builds only. **Once registered it outlives the build that registered it** — running a production build against localhost even once leaves a stale worker serving that snapshot to the dev server on the same origin afterward, indefinitely, until manually unregistered. Not a code bug if this happens.
- `lib/use-transactions.ts` / `lib/use-budgets.ts` / `lib/use-income-sources.ts` — realtime Firestore CRUD hooks, one per collection. Editing a transaction's type strips the *other* type's now-invalid linking field. Deleting a budget or income source sweeps matching transactions in the same batch to strip the now-dangling reference — a real bug shipped once without this (the transactions stayed valid as standalone records, just permanently pointing at a deleted doc).
- **A one-time cache-only read was tried as a fix for slow-to-appear data — don't re-attempt.** The Firestore client funnels every operation, cache-only reads included, through one internal queue that doesn't start processing until Firebase Auth's own listener has fired once — so a parallel cache read isn't actually independent of network speed here, confirmed by direct timing. The real fix — mirroring data into local storage the way identity is mirrored above — was identified but not implemented for transactions (history is unbounded, can't be mirrored wholesale) and was tried-and-reverted separately for budgets specifically (a stale cached budget could get silently deleted or edited elsewhere, producing dangling references or silently-failing edits with no error surfaced anywhere in this app). Both hooks expose a loading flag instead, shown as a small pill on the pages that need it, re-entered when connectivity drops and returns.
- `lib/data.ts` — shared types plus formatting helpers. Large sums abbreviate past a threshold rather than printing every digit, and print a plain dash rather than a wrong number once they're too large even for that. Relative date labels only cover today/yesterday/tomorrow — anything further falls to a literal date, since a reader has to do the subtraction themselves for "N days ago" to mean anything, which defeats the point. Also has the grouping helpers behind budget/income totals, both a cadence-aware version (Dashboard) and a period-scoped version (Insights) that are deliberately kept separate rather than unified — the period-vs-cadence distinction is the point.

### Currency (`lib/currencies.ts`, `lib/use-currency.tsx`)

A short, deliberately curated list of major currencies plus a generic "other" option, each with a hand-picked symbol rather than delegating to `Intl`'s own currency data — that data doesn't have a clean glyph for every currency. Amounts are always formatted as a plain number with that symbol prepended manually, never through `Intl`'s currency-formatting mode.

`lib/use-currency.tsx` is a Context, same reasoning as auth — many components format money, so one shared subscription beats each mounting its own listener. Every component that formats money reads it directly rather than taking currency as a passed-down prop.

Changed via `components/currency-picker-sheet.tsx`, a bottom sheet rather than a native select — a native select's dropdown can't be restyled to match the dark theme, and needs larger text to dodge iOS Safari's focus-zoom, which looked mismatched against the rest of that row.

### Shared UI pieces

- `components/sheet.tsx` — the app's one modal/bottom-sheet shell (backdrop, slide-up container, Escape-to-close, body-scroll-lock while open). Every dialog in the app renders through it rather than hand-rolling its own overlay. Tracks which sheets are currently open so Escape only closes the topmost one when two are stacked — a backdrop click already naturally only reaches the front sheet, but a global keypress doesn't. Optionally wires Enter-to-confirm, skipped when focus is on an interactive element inside the dialog itself — used only by the two confirm-style dialogs, since the add/edit sheets already get Enter for free from their own form submission. Moves focus into the dialog on open — fixes a real bug where stale focus left on whatever button opened the sheet silently ate every Enter press.
- `components/sheet-header.tsx` — the shared title + close-button row every sheet uses.
- `components/amount-input.tsx` — the large centered currency field shared by the transaction and budget sheets. Reads the current currency itself rather than taking it as a prop. Live thousands-grouped display over a plain underlying digit value. Fixed-width, not resized per keystroke — resizing to fit content caused visible jitter while typing, since re-centering shifts existing digits with nothing visible to show for the matching growth on the other side.
- `components/month-stepper.tsx` — a stateless month prev/next control, shared by the one-time-budget month picker and Insights' month browser.
- `components/transaction-row.tsx` / `delete-transaction-dialog.tsx` — a shared list row plus its confirm wrapper; handles both transaction types with no special-casing needed.
- `components/confirm-dialog.tsx` — the app's one confirm pattern for non-catastrophic destructive actions. Account deletion is deliberately **not** built on it — that needs a heavier confirm flow.
- `components/empty-state.tsx` — the shared "nothing here yet" box used across several pages.
- `components/add-income-source-sheet.tsx` — a stripped-down budget-add sheet, name field only.
- `components/income-source-detail-sheet.tsx` — the income-side twin of the budget detail sheet, without a progress bar (a source has no cap to show progress against).
- `lib/use-demo-aware-data.ts` — the live-vs-demo-mode data switching shared by Dashboard and Insights (see Insights below).

### Dashboard (`components/dashboard.tsx`)

Built around net worth rather than a spending list: a greeting header, then one row with "Net" (this month's income minus expenses, the hero figure) and smaller "Spent"/"Earned" beside it. "Net" reads as a gain or a loss depending on sign; "Earned" always reads as a gain (a sum of income can't go negative); "Spent" stays neutral — the same rule extends to the Insights chart's two line colors, which was the reverse of this until it got made consistent with everywhere else money is shown.

Below that, budgets and income sources share one view, switched by a small toggle in the header row — the same pattern Insights uses for its own view switcher. Replaced an earlier version that stacked both sections on the dashboard at once, and before that a tap-to-open detail sheet on the "Earned" figure alone — both reverted on direct feedback (too much at once; too hidden, respectively).

The expense view is budget cards, largest first — tapping one opens `components/budget-detail-sheet.tsx`, listing that budget's transactions with edit/delete. Progress bar reads as over-budget past 100%. No transaction list on the dashboard itself otherwise. What counts as "spent" depends on a budget's cadence (shared logic with Insights) — monthly budgets reset every calendar month; one-time budgets are scoped to a stored target month and drop off the dashboard entirely once that month passes, rather than needing to be deleted.

The income view is a small grid of square cards, one per source — name plain, this-month total reading as a gain. Went through a few rounds of column count and sizing before a realistic amount reliably stopped clipping on a real phone width. Tapping a card opens `components/income-source-detail-sheet.tsx`. Both views get a matching empty state rather than the income side rendering nothing.

Add-transaction is a mobile FAB / desktop inline button, both opening `add-transaction-sheet.tsx` — an expense/income toggle shown only when adding, not editing (a transaction's type can't change after creation). A budget or source is required for its respective type — the whole form is replaced by a single "add one first" prompt when nothing's pickable, rather than just disabling the picker — a real bug once had someone lose a filled-in amount navigating away to add a budget first, since the picker sits at the bottom of the form.

The date field opens a from-scratch calendar sheet rather than a native date input, for dark-theme styling control. Dates build from local year/month/day rather than a UTC-based conversion, which used to shift the date near midnight in non-UTC timezones — a real past bug.

### Budgets (`app/(app)/budgets/page.tsx`)

Where budgets and income sources are actually created/edited/deleted — the Dashboard only displays them. Budget names are unique (case-insensitive) and length-capped.

**List rows have no decorative accent line anymore — removed on direct feedback, don't re-add it.** Tried both a version proportional to amount (read as a fake meter, since nothing was actually fillable) and a fixed-width version meant to kill that reading (still read as *something*, and was cited as part of why this page felt too visually similar to the Dashboard's real progress bars). The row divider alone is enough now, on both lists here. This is different from Insights' ranked lists, where the equivalent line **is** a real proportional meter and stays.

A one-time budget's target month is an explicit choice via a stepper, not an implicit creation-time stamp — the old implicit version could scope a trip budget to the wrong month if it was planned ahead of time. Switching cadence back to monthly explicitly clears that stale month value.

New accounts are seeded with a handful of default budgets and one default income source on sign-in, gated on a proper "is this a brand-new user" signal from the auth SDK. **Was gated on comparing the account's creation time against its last-sign-in time instead — a real, confirmed bug, don't go back to it.** That comparison is a commonly-suggested check but is unreliable specifically for this app's sign-in method — the backend doesn't reliably advance the sign-in timestamp the way it does for other sign-in flows, so the two timestamps can still match on a repeat login, re-seeding the default data on every single logout/login cycle (confirmed by direct testing). Note that wiping Firestore data alone — without also deleting the underlying Auth account, a separate action in the Firebase console — won't re-trigger seeding; that's expected, since seeding is keyed off the Auth account's history, not the Firestore data's.

Income sources get a second section on this same page rather than their own nav item — touched rarely enough (set up once, occasionally renamed) to read more like a settings list than a page worth visiting on its own.

### Insights (`app/(app)/insights/page.tsx`)

Driven by shared period filters (a single month, calendar-aligned quarters of the current year, the full year, or all time) — the single-month view is the default. Quarters are calendar-aligned rather than rolling windows — explicit feedback that a rolling window ("6 months back from today") is hard to reason about. A past year's quarter has no dedicated view yet — deliberate, deferred.

**Chart**: two line series over the period, income and spend, colored to match the same "gold reads as a gain" rule used everywhere else (see Dashboard above). Spend still carries the visual weight of the "primary" series — fuller opacity, a gradient fill underneath — only the color swapped, not which series reads as the chart's main subject. No numeric axis labels, no hover/crosshair interaction (tried and removed) — just a static end-of-line marker per series.

**Ranked budgets list**: scoped strictly to the selected period, dropping any budget with no matching activity in that window — deliberately not the Dashboard's cadence-aware version, which has no period concept at all; don't try to unify them. Its meter line **is** a real proportional comparison here, unlike the decorative one on the Budgets page (see above). A third block, income ranked by source, mirrors this — hidden specifically in the single-month view's date-ordered mode, since that mode already lists every transaction individually and the summary underneath it was just noise there.

**The single-month period only** also gets a month-browser stepper plus a toggle between the ranked list and a flat date-ordered transaction list — the first place in the whole app an income transaction can be edited or deleted at all.

**Demo mode** (dev-only, off a query param on Dashboard or Insights): swaps in a year of generated activity across several budgets, trip-style one-time budgets, and income sources, with the current month deliberately forced negative to exercise that state. Editing is a no-op in demo mode. Still requires signing in normally first.

**Explicitly deferred**: nothing bounds how much transaction history loads — a real scaling concern, intentionally not addressed yet pending real usage data. Don't add consolidation/archiving logic speculatively.

### Styling

Theme colors and other design tokens are defined once in `app/globals.css` and exposed as Tailwind utility classes — use those token names rather than raw hex values or ad hoc colors. The one exception is the Insights chart's raw SVG color attributes, since CSS custom property resolution inside SVG presentation attributes isn't worth the cross-browser risk for values that already live as real tokens everywhere else.

Form fields need a minimum font size — iOS Safari auto-zooms the page on focus otherwise. No global rule for this, since that would also shrink the app's intentionally large amount input, so it's applied per field.

### Path alias

`@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/lib/data`, `@/components/dashboard`.

### Environment

Firebase web config lives in `.env.local` (gitignored). A separate env var holds the Google OAuth client ID used for sign-in.

**Setup gotcha:** Google Identity Services separately requires every origin it'll run from to be listed under that OAuth client's authorized JavaScript origins in Google Cloud Console — a different setting from Firebase's own authorized-domains list. Missing it produces a Google-hosted "Access blocked" error page, not a console warning, so it's easy to mistake for something more exotic if you don't know to look here first.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
