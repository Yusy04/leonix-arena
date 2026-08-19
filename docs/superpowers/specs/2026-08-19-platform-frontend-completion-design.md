# Leonix Arena — Front-End Feature Completion — Design

**Date:** 2026-08-19
**Status:** Approved
**Supersedes/extends:** builds on `2026-08-19-nextjs-migration-design.md` (same client-rendered, mock-data model).

## Goal

Round out the platform's front-end so every intended feature has a real page/UI,
using the existing dark "HUD" design system. The headline deliverable is a
per-problem **submissions list** page. Alongside it, fill the remaining gaps:
public profiles, a submission detail page, notifications, real search, and a
settings page — and remove the dead wallet/credits stub.

All work stays **front-end only**: no backend, no live judge, no persistence
beyond what already exists (theme). Data is mock, consistent across pages via a
shared mock-data layer.

## Scope

| # | Feature | Route(s) | Status today |
| - | ------- | -------- | ------------ |
| ★ | Problem submissions list | `/problem/submissions` | new |
| A | Profile (public) | `/u/[handle]`; `/profile` → own | stub redirect to `/dashboard` |
| C | Submission detail | `/submissions/[id]` | modals only |
| D | Notifications | bell dropdown + `/notifications` | bell icon only |
| E | Search | enhanced ⌘K palette + `/search` | palette lists pages only |
| F | Settings | `/settings` (6 sections) | none |
| — | Cleanup | remove `/wallet` route | dead redirect |

Explicitly **dropped**: the wallet/credits concept entirely. `HexChip` stays in
use on the Dashboard for streak / solved-count stats (not credits) and is left
as-is.

## Non-Goals (out of scope)

- Real backend, data fetching, or persistence (theme + appearance prefs persist
  to `localStorage`; everything else is in-memory mock).
- A live code judge or real evaluation.
- A follow/social graph, comments/discussion, email or push delivery.
- Redesign of existing pages beyond the wiring changes listed below.

## Architecture

Consistent with the current app: client-rendered components inside the Next.js
shell, mock data only. Two structural additions:

### Shared data layer
So a given submission/user/problem is the *same* record everywhere it appears
(list, detail, profile, dashboard, search):

- **`lib/types.ts`** — add:
  - `Verdict` = `'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'PENDING'`
  - `Language` = `'C++17' | 'Python 3' | 'Java 17'` (extensible)
  - `TestResult` `{ n, status, time, memory }`, `TestGroup` `{ name, points, awarded, tests }`
  - `Submission` `{ id, problemId, problemTitle, userHandle, verdict, score, language, time, memory, submittedAt, source, groups }`
  - `Problem` `{ id, title, author, source, tags, level, editorial }`
  - `UserProfile` `{ handle, name, initial, hue, city, joinedAt, level, xp, rank, streak, bestStreak, solved, submissionCount, acceptance, solvedByTopic, badges }`
  - `Notification` `{ id, type, text, target, at, read }` with
    `type` ∈ `judged | hint | editorial | rank | streak | contest | badge`
- **`lib/mock.ts`** (new) — deterministic, **seeded** generators (no
  `Math.random` / `Date.now` at module load; fixed base timestamp passed in or
  constant — SSR-safe, mirrors the Archive's existing seeded approach). Exposes
  arrays `problems`, `users`, `submissions`, `notifications` and lookups:
  `getSubmission(id)`, `getUserByHandle(handle)`, `submissionsForProblem(problemId, opts)`,
  `searchAll(query)`.

### Provider additions
`AppProvider` gains:
- `currentHandle` (derived from `user`).
- `notifications: Notification[]`, `unreadCount`, `markRead(id)`, `markAllRead()`
  — drives the bell badge.
- `appearance` `{ theme, card, radius }` with `localStorage` persistence, applied
  as `data-theme` / `data-card` / `data-radius` on `<html>` (theme already
  exists; card/radius reuse token variants already defined in `tokens.css`).

Kept lean — no over-engineering; context only holds what more than one component
needs.

### Dynamic routes
First use of dynamic segments in the app (`[handle]`, `[id]`). Trivial because
data is mock: the page reads the param and looks it up in `lib/mock.ts`,
falling back to a sensible default record if not found.

## Reuse / targeted cleanup

The Problem page currently inlines a C++ highlighter (`hlCpp` + `CodePane`) and
the evaluation groups/tests UI inside its modal components. Extract these into
shared components so the detail page, the Source peek-modal, and the Problem
page share one implementation:

- `components/code/CodePane.tsx` — `hlCpp` + `CodePane` (moved out of `Problem.tsx`).
- `components/submissions/Evaluation.tsx` — the groups → tests → total render
  (moved out of the current `EvalModal`).
- `components/submissions/SourceModal.tsx` — the lightweight source peek-modal.

`Problem.tsx` then imports these instead of defining them locally.

## Page specifications

### ★ Submissions list — `/problem/submissions`
- Breadcrumb (Archive / Problem / Submissions), title `Submissions · <problem>`,
  count + "your best" summary.
- Toolbar: **Everyone / Only mine** segmented toggle · **Verdict** filter ·
  **Language** filter · **Sort** (Newest / Best score / Fastest) · search-by-user.
- Table columns: Verdict (color-coded per `Verdict`), Score `n/100`, User
  (avatar + `you` tag, links to profile), Lang, Time, Memory, Submitted,
  Actions (`</> Source` peek-modal, `Details →` to detail page).
- Pagination footer (mock counts).
- Submissions are **public**; the *Only mine* filter narrows to the current user.
- Entry points: "View all submissions →" button added to the Problem page's
  Submissions tab.

### C · Submission detail — `/submissions/[id]`
- Hero: score ring + verdict badge, problem link, user link, language, max time,
  peak memory, submitted date; actions "Open in editor", "Copy source".
- Left panel: source code (shared `CodePane`).
- Right panel: full evaluation (shared `Evaluation` — groups → per-test verdict/
  time/memory → total score). For `CE`/`RE`, show a compile/stderr output box.
- **Modal policy (option A):** keep the lightweight Source peek-modal on lists;
  retire the standalone Evaluation modal (this page replaces it); Problem-tab
  rows, dashboard recent-submissions, and profile recent-submissions all link
  here.

### A · Profile — `/u/[handle]` (canonical), `/profile` → own
- **Public** for any user. Own profile adds an "Edit profile" control (→
  `/settings`); others' profiles omit it. No follow button (no social graph).
- Sections: hero (avatar, `@handle`, city, joined, streak, global rank, level),
  stat tiles (Solved / Submissions / Acceptance / XP / Best streak), 12-week
  activity heatmap, recent submissions (→ detail), solved-by-topic bars, badges.
- `/profile` redirects to `/u/<currentHandle>`. Avatar-menu "Account" →
  `/profile`. Usernames on the leaderboard and submissions lists link to
  `/u/[handle]`.

### D · Notifications — bell dropdown + `/notifications`
- **Dropdown** in the TopNav bell: recent items with unread dots, "Mark all
  read", "See all notifications →". Bell badge reflects `unreadCount`.
- **Page** `/notifications`: filter tabs All / Unread / Judged / Social; mark
  read / mark all read.
- Types (all included): `judged`, `hint`, `editorial`, `rank`, `streak`,
  `contest`, `badge`. Each notification deep-links to its target (submission →
  detail, editorial → problem editorial tab, rank → leaderboard, etc.).

### E · Search — enhanced ⌘K + `/search`
- **Palette:** live grouped results (Problems / Users / Pages) with per-group
  caps and a "See all results for '<q>' →" row; Enter → `/search?q=`.
- **Page** `/search`: reads `q`, tabs All / Problems / Users / Editorials;
  results link to problem / `/u/[handle]` / editorial.
- Backed by `searchAll()` over the shared mock data.

### F · Settings — `/settings`
- Left rail + panels. Sections (all included):
  - **Editor & Language** — default language, theme, font size, editor toggles.
  - **Appearance** — theme + card style (`glass/solid/outlined`) + radius
    (`sharp/rounded/pill`); **functional**, wired through `AppProvider.appearance`
    → `data-*` on `<html>`, reusing `tokens.css` variants.
  - **Account** — name, handle, email, city, avatar, change password (mock).
  - **Notifications** — per-type toggles + email digest (mock).
  - **Privacy** — profile visibility, show on leaderboard, public submissions (mock).
  - **Danger zone** — sign out everywhere, delete account (mock/no-op).
- Only theme + appearance actually persist/apply; other controls are local mock
  state.

## Updates to existing pages

- **`components/nav/index.tsx`** — bell opens the notifications dropdown; profile
  menu "Account" → `/profile`; CommandPalette upgraded to real grouped search
  with `/search` fallthrough.
- **`components/pages/Problem.tsx`** — Submissions-tab rows link to
  `/submissions/[id]`; keep the Source modal; remove the standalone Eval modal;
  add "View all submissions →"; consume the extracted shared components.
- **`components/pages/Extras.tsx` (Leaderboard)** — usernames → `/u/[handle]`.
- **`components/pages/Dashboard.tsx`** — recent-submission rows →
  `/submissions/[id]`; any username → `/u/[handle]`.
- **`components/nav/index.tsx` (Footer)** — add Notifications / Settings links.
- **Routes** — add `app/(main)/problem/submissions/page.tsx`,
  `app/(main)/submissions/[id]/page.tsx`, `app/(main)/u/[handle]/page.tsx`,
  `app/(main)/notifications/page.tsx`, `app/(main)/search/page.tsx`,
  `app/(main)/settings/page.tsx`; change `app/(main)/profile/page.tsx` to redirect
  to own handle; **delete** `app/(main)/wallet/page.tsx`.
- **Styles** — new `styles/pages-submissions.css`, `pages-profile.css`,
  `pages-notifications.css`, `pages-search.css`, `pages-settings.css`; extend
  `styles/nav.css` for the bell dropdown & palette result groups; import all new
  files in `app/layout.tsx`.

## Design-system consistency

Reuse existing vocabulary throughout: `hud` / `hud-corners` / `is-glow` panels,
`container-wide`, `btn` variants, `card`, `Section`, `Avatar`, `Icon`,
`ProgressRing`, `badge is-success/warning/danger`, `diff-badge diff-N`, `mono`,
`tabs`/`tab`, existing score badges (`pb-score sc-hi/mid/lo`) and verdict/eval
styles from `pages-problem.css`. New CSS follows the per-page-file convention and
the token system (colors/spacing/radius from `tokens.css`).

## Verification

- `npm run build` compiles clean (TypeScript + Next); `npm run start` serves.
- Manually walk each new route and every updated entry point:
  - `/problem/submissions` → toggle, filters, Source modal, `Details →`.
  - `/submissions/[id]` from list, dashboard, profile, Problem tab.
  - `/u/[handle]` from leaderboard + submission usernames; `/profile` redirect;
    Edit-profile → settings.
  - Bell dropdown + `/notifications` tabs; badge count.
  - ⌘K grouped results + `/search` tabs.
  - `/settings` — theme, card, radius actually change the UI and persist across
    reload.
  - `/wallet` no longer resolves.
- Light/dark parity preserved.

## Rollout note

This is a sizeable single pass (6 features + wiring). It can be implemented on
one branch, but the plan should sequence it so each feature is independently
reviewable: shared layer first (types + mock + extracted components + provider),
then the pages in dependency order (submissions list → detail → profile →
notifications → search → settings), then the cross-page wiring and cleanup.
