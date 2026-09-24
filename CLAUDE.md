# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server · `npm run build` — production build · `npm run start` — run the production build

No linter or test suite — ESLint was deliberately removed (TypeScript covers unused-variable checks), and a grep-based style-guard script was removed on request; don't re-add either.

## Architecture

Fehu is a personal finance tracker PWA: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Firebase (Firestore + Auth). `@/*` maps to the repo root.

### Routing and shell

Route groups: `(marketing)` — the public landing page at `/` — and `(app)` — `/dashboard`, `/budgets`, `/insights`, `/settings`, behind `AppShell`. No Categories page: budgets are the categorization. Root `app/layout.tsx` wraps everything in `AuthProvider`; `app/(app)/layout.tsx` adds `CurrencyProvider`, `InstallProvider` and `AppShell` (`components/layout/app-shell.tsx` — desktop sidebar / mobile drawer, the sign-in gate, the page container, `PageHeader`, and the nav items).

Nav links use history-*replacing* navigation — push navigation let iOS's edge-swipe-back gesture flip between tabs mid-navigation (real bug).

`Wordmark` (`components/ui/wordmark.tsx`) draws the "F" from a cropped image, since no font glyph matched the app icon. In the app it's shown only in the sidebar/drawer and sign-in gate, not the mobile top bar; the landing page's mobile header does show it.

The `(marketing)` layout wraps the landing page, `/contact` and `/privacy` in `components/marketing/site-chrome.tsx`: a borderless left sidebar (logo and section links) that becomes a burger opening a small dropdown menu on mobile (a full-height drawer swamped the phone screen), plus a footer modeled on LiftBear's: a "© owner year" line on the left with Contact and Privacy links far right, in small gray text with generous bottom space. `/contact` and `/privacy` are server pages. Owner name, email and location live in one constant, `components/marketing/owner.ts` — the privacy policy names them as the GDPR data controller, which the law requires; keep it a plain module, because a server page can't read constants from a `"use client"` file. No terms page yet: not required for a free app, but add one alongside paid plans. Section links smooth-scroll on the landing page (instant under reduced motion) and navigate to `/#section` from other pages.

The landing page: hero, "Take a look" (phone-framed screenshots from `public/screenshots/`), features ordered by importance, FAQ (practical questions first), and Pricing ("Free Beta" populated, the paid plans "Coming soon"). Below the hero, content fades in on first scroll into view. The hero never animates, so it's never invisible while scripts load on a slow connection. Its one CTA, in the hero, goes to `/dashboard`, and it makes no install decisions — install prompting happens after sign-in. Keep `/privacy` true to what the code actually stores.

### Install and PWA

- **`lib/use-install-prompt.tsx`** — a Context mounted once in the `(app)` layout, because Chromium's install-prompt event fires once per page load and a second instance mounted later would miss it. Detects: installed/standalone, installable (Chromium), iOS/Safari (careful matching — iPadOS reports as a desktop Mac), or other browsers (deliberately lumped together). Chromium stops firing the event once installed, so a stored "installed" flag remembers past installs. A dev-only `?install=<state>` forces any state.
- **Install dialog** (`components/layout/install-prompt.tsx`) — mounted only on `/dashboard`. It moved there from the sign-in gate on direct feedback: testers, iPhone users especially, skipped it at the gate. It opens every time the dashboard mounts, including each return from another tab — a deliberate nudge — until "don't show again", which shows a toast pointing to Settings. Settings also offers install. Its iOS instructions are a confirmed-safe exception to the rule that iOS instructions appear only on `/dashboard`, because iOS "Add to Home Screen" can bookmark the current URL.
- **Manifest** (`app/manifest.ts`) — `start_url` is `/dashboard`. Its `<link>` is global by Next's convention. Scoping it to app routes was tried and reverted: Chrome resolves the install target correctly from any page. `app/layout.tsx` sets a separate iOS home-screen icon, since iOS doesn't reliably read manifest icons. **Manifest changes don't reach already-installed icons** — the fix for a stale install is remove-and-reinstall, not a routing bug.
- **`public/service-worker.js`** (production only; registered from the root layout so the install event can fire pre-auth):
  - **Cache-first** — network-first hung on slow-but-connected networks, since a slow fetch doesn't reject.
  - Precaches every route at install.
  - **A page is only cached together with every asset its HTML references**, both at install and in the background refresh. The browser reinstalls the worker only when this file changes, so after a deploy the refresh used to swap in HTML whose new chunks were never fetched, and the next slow launch hung (real regression). An asset HTTP error counts as done; a network failure keeps the old page.
  - Asset URLs are scraped with a pattern that stops at backslashes — the inline RSC payload repeats them inside escaped quotes.
  - Pages are keyed by path only, so query params share one entry.
  - **A worker registered by a localhost production build keeps serving that snapshot to the dev server until unregistered** — not a code bug.

### Auth (`lib/use-auth.tsx`)

Auth is a Context, since shared state avoids racing listeners.

Sign-in is Google-only via **Google Identity Services** (`renderButton`). Firebase's popup sign-in (hangs on mobile) and redirect sign-in (silently returned nothing, never root-caused) were both dropped for real bugs. GIS One Tap is avoided because FedCM can be silently suppressed. The gate also checks on mount whether the GIS script already loaded — its load callback fires once per session, and a remounted gate used to lose the button (real bug).

Slow-connection fixes — don't undo:
- `lib/firebase.ts` initializes Auth without the popup/redirect resolver, which loaded an extra script on mobile/Safari. It falls back to `getAuth` on dev hot-reload.
- Session restore makes an unbounded network call before the first auth callback. So the last confirmed identity is mirrored to local storage, read **after mount** (reading it during render caused a hydration mismatch), and the shell renders optimistically off it. Signing out clears it from both storage and memory. This fixed the shell, not data loading (see Data layer).

New accounts get default budgets and a "Salary" source, gated on the SDK's `isNewUser`. **Never gate on creationTime === lastSignInTime** — with this sign-in method the timestamps can match on repeat logins, which re-seeded data on every login (confirmed bug). Wiping Firestore data alone won't re-trigger seeding.

Account deletion wipes every collection plus the preferences doc while still authenticated, then deletes the Auth user. It throws when there's no confirmed session yet (possible during optimistic render); the delete-account dialog shows the error with a log-out button.

Firestore security rules live in the Firebase console, **not** this repo: one explicit rule per collection under `users/{uid}/` (transactions, budgets, incomeSources, settings), owner-only. A catch-all recursive rule was rejected — it would let a tampering client create arbitrary collections. **Add a rule by hand for every new collection.**

### Data layer

- Expenses optionally reference a **budget**; income optionally references an **income source**, which is a name only. There's no fixed category list.
- **`lib/firestore.ts`** — the one data-access module: a generic realtime subscription wrapped by `useTransactions`/`useBudgets`/`useIncomeSources`, plus path helpers, seeding and the account wipe. Adding a collection means updating the subscription, the wipe list, and the console rules.
  - Editing a transaction's type strips the other type's link field.
  - Deleting a budget or source unlinks its transactions (a real bug shipped without this).
  - Multi-document writes go through a helper that splits them into batches of 500, Firestore's limit — account deletion used to fail past roughly a year of transactions. The batches commit in parallel, so offline writes still apply at once.
  - Transactions are read unordered; consumers sort.
- **Loading pill**:
  - **A one-time cache-only read was tried for slow data — don't re-attempt.** Firestore queues every operation behind Auth's first callback, so it isn't faster. Mirroring data to local storage was rejected: history is unbounded, and a trial for budgets was reverted because stale cached budgets caused dangling references and silently failing edits.
  - The pill re-appears when connectivity returns, but only if Firestore had fallen back to cache. It clears on the server-confirmed snapshot. **The subscription must include metadata changes** — without them, reconnecting with no data changes sent no snapshot and the pill stuck forever (real bug). Metadata-only snapshots don't rebuild the list.
- **`lib/data.ts`** — types, the currency list and formatting, and shared rule helpers (month keys, "is budget active", name uniqueness, sums):
  - Big sums abbreviate (M/B/T), then show a dash rather than a wrong number.
  - Relative dates only say today/yesterday/tomorrow, otherwise a literal date.
  - Totals come in a cadence-aware Dashboard version and a period-scoped Insights version, **kept deliberately separate**.
- **Currency** — a curated list plus "Other", with hand-picked symbols prepended manually, never `Intl` currency formatting (its glyphs are inconsistent). The list lives in `data.ts` so pure helpers never import Firebase. `lib/use-currency.tsx` is a Context read directly by every money-formatting component. The picker is a bottom sheet — a native select can't be dark-styled and triggers iOS zoom.
- `lib/storage.ts` — non-throwing localStorage. `lib/demo-data.ts` — dev-only `?demo=1` on Dashboard/Insights swaps in a generated year (current month forced negative); edits are no-ops, and you still sign in normally.
- Dates are built from local year/month/day, never UTC conversion — that shifted dates near midnight (real bug). The date picker slices the month from the ISO string for the same reason.

### Components

**Every component lives under `components/`, in subfolders — never loose at the top level:**
- `ui/` — generic building blocks with no domain knowledge.
- `layout/` — the app frame and what it mounts.
- `marketing/` — the landing/privacy chrome.
- One folder per feature, named after its page: `transactions/`, `budgets/`, `insights/`, `settings/`.

Route folders hold only `page.tsx`/`layout.tsx`; tiny single-use helpers stay inline in their page. Families of small components share one module (e.g. every pressable control is in `ui/button.tsx`) — check for an existing module before adding a file.

Non-obvious rules:
- **`ui/sheet.tsx`** is the only modal shell: `Sheet`, plus `Drawer` (the app shell's left slide-in menu). Both register in the same layer stack.
  - It keeps a stack of open sheets, so Escape closes only the top one and scroll stays locked until the last closes (a stacked confirm used to unlock the sheet beneath).
  - It moves focus into the dialog on open — stale focus on the opener used to eat Enter (real bug) — and form sheets pass `initialFocus` for their first field.
  - Its optional Enter-to-confirm is for confirm dialogs only.
- **`ui/button.tsx`** holds every pressable control, including `navItemClass` for sidebar/drawer rows — add a variant there instead of styling a button inline. Only the date grid cells and currency rows are hand-rolled.
- **`ui/confirm-delete-dialog.tsx`** handles every non-catastrophic delete. Account deletion deliberately uses its own heavier dialog.
- **`ui/amount-input.tsx`** is fixed-width, because resizing per keystroke jittered.
- **The budget detail sheet** compares spend to the cap only when its transactions span one month. Insights' multi-month periods show a plain total — comparing a quarter to a monthly cap read as over budget (real bug).
- **`ui/stat.tsx`**'s tone prop is where the gain/loss color rule lives: gold is a gain (Net when positive, Earned, the chart's income line), red a loss, and Spent stays neutral.

### Pages

- **Dashboard** — Net (hero) with Spent/Earned beside it, as a column-flowing grid of `Stat`s so the numbers share one baseline (stacked boxes misaligned them). An icon toggle switches between budget cards (largest first, cadence-aware, tap for the detail sheet) and income-source square cards. Showing both at once, or hiding income behind "Earned", were both reverted on feedback.
  - Monthly budgets reset each month; one-time budgets count only in their target month and then drop off.
  - Add-transaction is the FAB (mobile) or an inline button (desktop). The type toggle appears only when adding.
  - With no budget or source to pick, the whole form becomes an "add one first" prompt — a disabled picker at the bottom of the form made someone lose a typed amount (real bug).
- **Budgets** — create, edit and delete budgets and income sources; income sources are a second section, not a nav item.
  - Names are unique case-insensitively and capped in length.
  - **No decorative accent line on rows — removed on feedback, don't re-add** (it read as a fake meter).
  - A one-time budget's month is an explicit stepper choice (an implicit creation stamp mis-scoped pre-planned trips); switching to monthly clears it.
- **Insights** — periods: month (default), calendar quarters of this year (not rolling windows — feedback), year, and all time (earliest transaction through now or the latest future-dated one).
  - The chart has income and spend lines, with spend as the primary series; no axis numbers, no hover (removed).
  - Ranked budget and income lists are strictly period-scoped, and their meters are real proportions.
  - The month period adds a month browser and a ranked-vs-date-list toggle; the date list is the only place income transactions can be edited. The income block is hidden in date-list mode.
  - Past years' quarters are deliberately deferred.

### Styling

**Consistency is structural: reuse the shared piece; if none fits, add one — never restyle inline.** The UI once drifted into ~20 near-duplicates.
- **Tokens:** everything is defined in `app/globals.css` (colors, radii, `--motion-ui`) — never raw hex or arbitrary radii, shadows, overlays or icon sizes. `lib/theme.ts` mirrors `--background` for metadata; keep them in sync by hand.
- **Utilities:** `text-body`, `text-strong`, `text-label`, `text-caption`, `text-hero`, `card-box` (includes the `surface` background — never add another to a card), `input-field`, `press`, `floating` (only for elements that float without a backdrop), `scrim`.
- **Which token when:** `surface` is for cards and sheets; `card` is one step up (inputs, hovered or active rows). `border` frames static things; `border-strong` outlines controls and floating pills. Stacking: loading pill and FAB at 40; sheets, drawer and toast at 50; a confirm over a sheet at 60.
- **Type — exactly three sizes:**
  - Small — gray only, via `text-label` or `text-caption`.
  - Medium — `text-strong` (medium weight) for buttons, pills, toggles, dialog/section headings, the month label and money amounts; `text-body` (normal weight) for everything else. Inputs must stay medium to avoid iOS focus-zoom.
  - Large — `text-hero`, for page titles, section headings and key figures. Don't make it bigger: the Dashboard stat row would overflow on phones.
  - The landing page adds one extra-large headline size, never used in the app. Only normal and medium weights exist. The sidebar email is small; sidebar links stay medium (request).
- **On request:** grays were brightened to pass WCAG AA — keep new grays above that bar. **The border color stays the original dim value; only the width grew to 2px** (hairlines vanished on phones), for every border and divider, landing page included. Dividers come from the list, never per-row borders. Meter bars share one taller height.
- **Interaction:** solid buttons dim on hover, outlined ones tint, everything presses in, disabled dims. One global focus ring; inputs show focus with an accent border. The custom desktop cursor applies everywhere except text inputs and disabled controls.
- **Motion:** `--motion-ui` is also Tailwind's default transition duration; only data bars and the landing page's scroll-in reveals (`--motion-reveal`) are slower.
- **Icons:** control, navigation and large sizes. Icon buttons come in standard, large (mobile menu, desktop add) and FAB sizes. Scrollbars are hidden globally, since they showed inside iOS sheet lists.

### Deferred work

- **Scaling session:** transaction history loads unbounded. The plan is to roll past years up into yearly summaries so only the current year loads individually — don't add consolidation logic outside that session.
- **Possible tampering-protection session:** the rules limit *where* a user writes, not *what*. A tampering client can put malformed data (odd fields, bad amounts, huge text) into its own documents only. The fix would be shape validation in the rules plus matching input limits in the app (descriptions have no length cap today) — rejected writes fail silently here, since writes are fire-and-forget for offline support.
- **Insights chart month labels** are SVG text, so they scale with chart width (small on phones, large on desktop). The proper fix is HTML labels under the SVG.

### Environment

Firebase config goes in `.env.local` (gitignored), plus an env var for the Google OAuth client ID. **Gotcha:** every origin that runs GIS must be listed under the OAuth client's *authorized JavaScript origins* in Google Cloud Console (separate from Firebase's authorized domains) — otherwise Google shows an "Access blocked" page.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
