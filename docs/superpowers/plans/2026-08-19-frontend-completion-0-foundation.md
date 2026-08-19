# Front-End Completion — Plan 0: Shared Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared data + component layer that all six feature plans depend on: canonical TS types, a deterministic mock-data module, three extracted reusable components, and the provider state (notifications + appearance).

**Architecture:** Client-rendered mock data (matches the existing app). A single `lib/mock.ts` is the source of truth for problems/users/submissions/notifications so every page cross-links to the *same* records. Reusable rendering (code highlighter, evaluation table, source modal) is lifted out of `Problem.tsx` into shared components. `AppProvider` gains notifications and appearance state.

**Tech Stack:** Next.js 15 (App Router), React 18, TypeScript 5.6. No test runner in the repo — verification is `npm run typecheck` + `npm run build` + a `node` assertion script for the pure mock-data logic + manual dev-server checks. This mirrors the migration-era verification model.

**Part of:** `docs/superpowers/specs/2026-08-19-platform-frontend-completion-design.md`. This is plan 0 of a 6-part effort (foundation → submissions → profile → notifications → search → settings).

---

## File Structure

| File | Responsibility |
| ---- | -------------- |
| `lib/types.ts` (modify) | Add `Verdict`, `Language`, `TestStatus`, `TestResult`, `TestGroup`, `Submission`, `Problem`, `UserProfile`, `Notification`, and supporting types. |
| `lib/mock.ts` (create) | Deterministic seeded mock data + lookup/search helpers. Single source of truth. |
| `components/code/CodePane.tsx` (create) | `hlCpp` highlighter + `CodePane` (moved out of `Problem.tsx`). |
| `components/submissions/Evaluation.tsx` (create) | `TestStatus` + `Evaluation` (groups→tests→total), moved out of `Problem.tsx`'s `EvalModal`. |
| `components/submissions/SourceModal.tsx` (create) | The lightweight source peek-modal, parameterized by `code`/`language`. |
| `components/pages/Problem.tsx` (modify) | Consume the three extracted components; adopt canonical `TestGroup` shape. Behavior unchanged. |
| `components/providers/AppProvider.tsx` (modify) | Add `currentHandle`, notifications state, appearance (theme/card/radius) with persistence. |
| `styles/pages-problem.css` (modify) | Add `.ts-re` runtime-error status style. |

---

## Task 1: Canonical types

**Files:**
- Modify: `lib/types.ts` (append after the existing `Theme` type)

- [ ] **Step 1: Append the new types**

Add to the end of `lib/types.ts`:

```ts
// ---------- Judge / submissions ----------
export type Verdict = "AC" | "WA" | "TLE" | "RE" | "CE" | "PENDING";
export type Language = "C++17" | "Python 3" | "Java 17";
export type TestStatus = "ok" | "wa" | "tle" | "re" | "pend";

export interface TestResult {
  n: number;
  status: TestStatus;
  time: string;   // e.g. "45 ms" or "—"
  memory: string; // e.g. "12.4 MB" or "—"
}
export interface TestGroup {
  name: string;
  points: number;
  awarded: number;
  tests: TestResult[];
}
export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  userHandle: string;
  verdict: Verdict;
  score: number;       // 0..100
  language: Language;
  time: string;        // max time across tests
  memory: string;      // peak memory
  submittedAt: string; // ISO
  source: string;      // full source code
  groups: TestGroup[]; // empty for CE
}

// ---------- Problems ----------
export type ProblemEditorial = "open" | "locked";
export interface Problem {
  id: string;
  title: string;
  author: string;
  source: string;
  tags: string[];
  level: number; // 1..9
  editorial: ProblemEditorial;
}

// ---------- Profiles ----------
export interface TopicCount { topic: string; count: number; }
export interface Badge { emoji: string; label: string; }
export interface UserProfile {
  handle: string;
  name: string;
  initial: string;
  hue: number;
  city: string;
  joinedAt: string; // ISO date
  level: number;
  xp: number;
  rank: number;
  streak: number;
  bestStreak: number;
  solved: number;
  submissionCount: number;
  acceptance: number; // 0..100
  solvedByTopic: TopicCount[];
  badges: Badge[];
}

// ---------- Notifications ----------
export type NotificationType =
  | "judged" | "hint" | "editorial" | "rank" | "streak" | "contest" | "badge";
export interface Notification {
  id: string;
  type: NotificationType;
  text: string;
  href: string; // deep-link target
  at: string;   // ISO
  read: boolean;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(types): add submission/problem/profile/notification types"
```

---

## Task 2: Mock-data module

**Files:**
- Create: `lib/mock.ts`
- Create (throwaway, deleted in Step 3): `scripts/check-mock.mjs`

- [ ] **Step 1: Write `lib/mock.ts`**

```ts
import type {
  Problem, Submission, UserProfile, Notification,
  Language, Verdict, TestGroup, TestStatus, TestResult,
  Badge, TopicCount,
} from "./types";

/* ---------- deterministic PRNG (stable across SSR/CSR) ---------- */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h;
}
/** Fixed base date so timestamps never depend on Date.now() (SSR-safe). */
function isoAt(dayOffset: number, hour: number, min: number, sec: number): string {
  const d = new Date(Date.UTC(2025, 4, 20, hour, min, sec));
  d.setUTCDate(d.getUTCDate() - dayOffset);
  return d.toISOString();
}

export const CURRENT_HANDLE = "alexp";
const TOPICS = ["Graphs", "Dynamic programming", "Data structures", "Math", "Greedy", "Strings"];
const LANGS: Language[] = ["C++17", "Python 3", "Java 17"];
const GROUP_POINTS = [10, 20, 12, 28, 30]; // sums to 100

/* ---------- users ---------- */
interface RawUser {
  handle: string; name: string; initial: string; hue: number; city: string;
  joinedAt: string; level: number; xp: number; rank: number; streak: number;
  bestStreak: number; solved: number; submissionCount: number; acceptance: number;
}
const RAW_USERS: RawUser[] = [
  { handle: "andreip", name: "Andrei P.", initial: "A", hue: 200, city: "Cluj-Napoca", joinedAt: "2023-09-01", level: 12, xp: 12480, rank: 1, streak: 41, bestStreak: 63, solved: 540, submissionCount: 2100, acceptance: 74 },
  { handle: "marias",  name: "Maria S.",  initial: "M", hue: 320, city: "Iași",        joinedAt: "2023-10-12", level: 11, xp: 11920, rank: 2, streak: 22, bestStreak: 40, solved: 498, submissionCount: 1850, acceptance: 71 },
  { handle: "vladi",   name: "Vlad I.",   initial: "V", hue: 80,  city: "Timișoara",   joinedAt: "2023-11-03", level: 10, xp: 10310, rank: 3, streak: 15, bestStreak: 33, solved: 452, submissionCount: 1600, acceptance: 69 },
  { handle: "anac",    name: "Ana C.",    initial: "A", hue: 280, city: "Brașov",      joinedAt: "2024-01-20", level: 9,  xp: 9870,  rank: 4, streak: 9,  bestStreak: 28, solved: 410, submissionCount: 1490, acceptance: 66 },
  { handle: "mihair",  name: "Mihai R.",  initial: "M", hue: 140, city: "Constanța",   joinedAt: "2024-02-14", level: 8,  xp: 9540,  rank: 5, streak: 6,  bestStreak: 24, solved: 380, submissionCount: 1400, acceptance: 65 },
  { handle: "alexp",   name: "Alex Popescu", initial: "A", hue: 145, city: "București", joinedAt: "2024-03-05", level: 7, xp: 6420, rank: 6, streak: 12, bestStreak: 31, solved: 312, submissionCount: 1284, acceptance: 68 },
  { handle: "cyberdev",name: "Cyber Dev", initial: "C", hue: 190, city: "Cluj-Napoca", joinedAt: "2024-04-18", level: 6,  xp: 4120,  rank: 7, streak: 3,  bestStreak: 19, solved: 240, submissionCount: 980,  acceptance: 61 },
  { handle: "matrix01",name: "Matrix 01", initial: "M", hue: 285, city: "Sibiu",       joinedAt: "2024-05-02", level: 5,  xp: 3960,  rank: 8, streak: 1,  bestStreak: 14, solved: 188, submissionCount: 620,  acceptance: 55 },
  { handle: "ghostcode",name: "Ghost Code", initial: "G", hue: 20, city: "Oradea",     joinedAt: "2024-06-10", level: 4,  xp: 2600,  rank: 9, streak: 0,  bestStreak: 11, solved: 132, submissionCount: 500,  acceptance: 49 },
  { handle: "novacpp", name: "Nova Cpp",  initial: "N", hue: 240, city: "Craiova",     joinedAt: "2024-07-01", level: 4,  xp: 2100,  rank: 10, streak: 2, bestStreak: 9,  solved: 96,  submissionCount: 360,  acceptance: 47 },
  { handle: "quicksort",name: "Quick Sort", initial: "Q", hue: 10, city: "Ploiești",   joinedAt: "2024-08-08", level: 3,  xp: 1500,  rank: 11, streak: 5, bestStreak: 7,  solved: 61,  submissionCount: 220,  acceptance: 44 },
];

const BADGE_POOL: Badge[] = [
  { emoji: "🔥", label: "30-day streak" },
  { emoji: "⚡", label: "First AC in < 5 min" },
  { emoji: "🧠", label: "100 graphs solved" },
  { emoji: "🎯", label: "Full score on 50 problems" },
  { emoji: "🌙", label: "Night owl — solved after midnight" },
  { emoji: "🏅", label: "Top 10 weekly" },
];
function buildTopics(u: RawUser): TopicCount[] {
  const rnd = makeRng(hashStr(u.handle));
  const weights = TOPICS.map(() => 0.3 + rnd());
  const sum = weights.reduce((a, b) => a + b, 0);
  return TOPICS.map((topic, i) => ({ topic, count: Math.round((weights[i] / sum) * u.solved) }))
    .sort((a, b) => b.count - a.count);
}
function buildBadges(u: RawUser): Badge[] {
  const rnd = makeRng(hashStr(u.handle) ^ 0x9e3779b9);
  const picked = BADGE_POOL.filter(() => rnd() > 0.5);
  return (picked.length ? picked : BADGE_POOL).slice(0, 4);
}
export const USERS: UserProfile[] = RAW_USERS.map(u => ({
  ...u, solvedByTopic: buildTopics(u), badges: buildBadges(u),
}));

/* ---------- problems ---------- */
export const PROBLEMS: Problem[] = [
  { id: "matrix-exploration",   title: "Matrix Exploration",   author: "Emilian Miron",    source: "ONI 2019 · G",           tags: ["graphs", "bfs"],            level: 4, editorial: "open" },
  { id: "sliding-window-maximum", title: "Sliding Window Maximum", author: "Sorin Stancu-Mara", source: "Summer Challenge 1 · G", tags: ["two pointers"],          level: 3, editorial: "open" },
  { id: "shortest-path-grid",   title: "Shortest Path Grid",   author: "Cătălin Francu",   source: "Lot 2006 · G",           tags: ["graphs", "bfs"],            level: 3, editorial: "open" },
  { id: "coin-change",          title: "Coin Change",          author: "Cristian Cedar",   source: "PMC 2006 · G",           tags: ["dp"],                       level: 2, editorial: "open" },
  { id: "segment-sum-queries",  title: "Segment Sum Queries",  author: "Doru Pădoe",       source: "Autumn Warmup 2006 · G", tags: ["data structures"],          level: 4, editorial: "locked" },
  { id: "matrix-rotation",      title: "Matrix Rotation",      author: "Liviu Cofrasi",    source: "Happy Coding 2006 · G",  tags: ["implementation"],           level: 2, editorial: "open" },
  { id: "sparse-matrix-sum",    title: "Sparse Matrix Sum",    author: "Vlad Stănilă",     source: "Lista lui Francu · G",   tags: ["math", "data structures"],  level: 6, editorial: "locked" },
];

/* ---------- source snippets ---------- */
const SOURCES: Record<Language, string> = {
  "C++17": `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n; if (!(cin >> n)) return 0;
    vector<long long> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];
    sort(a.begin(), a.end());
    long long ans = 0;
    for (int i = 0; i < n; ++i) ans += a[i] * (2LL * i - n + 1);
    cout << ans << "\\n";
    return 0;
}`,
  "Python 3": `import sys
input = sys.stdin.readline

def main():
    n = int(input())
    a = sorted(map(int, input().split()))
    ans = sum(a[i] * (2 * i - n + 1) for i in range(n))
    print(ans)

main()`,
  "Java 17": `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        long[] a = new long[n];
        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
        Arrays.sort(a);
        long ans = 0;
        for (int i = 0; i < n; i++) ans += a[i] * (2L * i - n + 1);
        System.out.println(ans);
    }
}`,
};

/* ---------- evaluation groups ---------- */
function buildGroups(verdict: Verdict, awardedGroups: number, rnd: () => number): { groups: TestGroup[]; score: number } {
  let testNo = 0;
  let score = 0;
  const groups = GROUP_POINTS.map((points, gi) => {
    const nTests = 1 + Math.floor(rnd() * 3);
    const full = gi < awardedGroups;
    if (full) score += points;
    const failIdx = Math.floor(rnd() * nTests);
    const tests: TestResult[] = [];
    for (let t = 0; t < nTests; t++) {
      testNo++;
      let status: TestStatus = "ok";
      if (!full && gi === awardedGroups && t === failIdx) {
        status = verdict === "TLE" ? "tle" : verdict === "RE" ? "re" : verdict === "PENDING" ? "pend" : "wa";
      } else if (!full && verdict === "PENDING") {
        status = "pend";
      }
      const time = status === "tle" ? "1000 ms" : status === "pend" ? "—" : `${8 + Math.floor(rnd() * 40)} ms`;
      const memory = status === "pend" ? "—" : `${(1 + rnd() * 20).toFixed(1)} MB`;
      tests.push({ n: testNo, status, time, memory });
    }
    return { name: `Group ${gi + 1}`, points, awarded: full ? points : 0, tests };
  });
  return { groups, score };
}
function maxTime(groups: TestGroup[]): string {
  const nums = groups.flatMap(g => g.tests).map(t => parseInt(t.time)).filter(n => !isNaN(n));
  return nums.length ? `${Math.max(...nums)} ms` : "—";
}
function peakMem(groups: TestGroup[]): string {
  const nums = groups.flatMap(g => g.tests).map(t => parseFloat(t.memory)).filter(n => !isNaN(n));
  return nums.length ? `${Math.max(...nums).toFixed(1)} MB` : "—";
}

/* ---------- submissions ---------- */
function generateSubmissions(): Submission[] {
  const subs: Submission[] = [];
  let idCounter = 5000;
  for (let pi = 0; pi < PROBLEMS.length; pi++) {
    const problem = PROBLEMS[pi];
    const rnd = makeRng(hashStr(problem.id));
    const count = 6 + Math.floor(rnd() * 6);
    for (let k = 0; k < count; k++) {
      const user = USERS[Math.floor(rnd() * USERS.length)];
      const roll = rnd();
      const awardedGroups = roll < 0.4 ? 5 : roll < 0.6 ? 0 : 1 + Math.floor(rnd() * 3);
      let verdict: Verdict;
      if (awardedGroups === 5) verdict = "AC";
      else if (awardedGroups === 0) { const r = rnd(); verdict = r < 0.4 ? "WA" : r < 0.7 ? "RE" : "CE"; }
      else verdict = rnd() < 0.5 ? "WA" : "TLE";
      const lang = LANGS[Math.floor(rnd() * LANGS.length)];
      const built = verdict === "CE" ? { groups: [] as TestGroup[], score: 0 } : buildGroups(verdict, awardedGroups, rnd);
      idCounter++;
      subs.push({
        id: String(idCounter),
        problemId: problem.id,
        problemTitle: problem.title,
        userHandle: user.handle,
        verdict, score: built.score, language: lang,
        time: verdict === "CE" ? "—" : maxTime(built.groups),
        memory: verdict === "CE" ? "—" : peakMem(built.groups),
        submittedAt: isoAt(k + pi, 9 + (k % 12), (k * 7) % 60, (k * 13) % 60),
        source: SOURCES[lang],
        groups: built.groups,
      });
    }
  }
  // Guarantee the current user has a perfect AC + a visible pending on matrix-exploration.
  const perfect = buildGroups("AC", 5, makeRng(4821));
  subs.unshift({
    id: "4821", problemId: "matrix-exploration", problemTitle: "Matrix Exploration",
    userHandle: CURRENT_HANDLE, verdict: "AC", score: 100, language: "C++17",
    time: "45 ms", memory: "12.4 MB", submittedAt: isoAt(0, 11, 42, 18),
    source: SOURCES["C++17"], groups: perfect.groups,
  });
  subs.unshift({
    id: "4830", problemId: "matrix-exploration", problemTitle: "Matrix Exploration",
    userHandle: "quicksort", verdict: "PENDING", score: 0, language: "Python 3",
    time: "—", memory: "—", submittedAt: isoAt(0, 12, 0, 0),
    source: SOURCES["Python 3"], groups: [],
  });
  return subs;
}
export const SUBMISSIONS: Submission[] = generateSubmissions();

/* ---------- notifications ---------- */
export const NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "judged",    text: "Matrix Exploration was judged — Accepted 100/100",       href: "/submissions/4821", at: isoAt(0, 11, 42, 20), read: false },
  { id: "n2", type: "hint",      text: "Your AI buddy answered your hint request on Coin Change", href: "/buddy",            at: isoAt(0, 10, 15, 0),  read: false },
  { id: "n3", type: "rank",      text: "Maria S. passed you — you're now #7 on the weekly board", href: "/leaderboard",      at: isoAt(0, 8, 0, 0),    read: false },
  { id: "n4", type: "editorial", text: "New editorial published for Shortest Path Grid",          href: "/problem",          at: isoAt(1, 18, 30, 0),  read: true },
  { id: "n5", type: "streak",    text: "Keep your 12-day streak alive — solve one today",         href: "/archive",          at: isoAt(1, 9, 0, 0),    read: true },
  { id: "n6", type: "contest",   text: "On-site contest check-in opens tomorrow at 09:00",        href: "/qr",               at: isoAt(2, 12, 0, 0),   read: true },
  { id: "n7", type: "badge",     text: "Badge earned: 30-day streak 🔥",                          href: "/u/alexp",          at: isoAt(3, 20, 0, 0),   read: true },
];

/* ---------- lookups ---------- */
export function getUserByHandle(handle: string): UserProfile | undefined {
  return USERS.find(u => u.handle === handle);
}
export function getSubmission(id: string): Submission | undefined {
  return SUBMISSIONS.find(s => s.id === id);
}

export interface SubQuery {
  mineOnly?: boolean;
  verdict?: Verdict | "ALL";
  language?: Language | "ALL";
  sort?: "newest" | "score" | "fastest";
  user?: string;
}
function timeMs(t: string): number {
  const n = parseInt(t);
  return isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}
export function submissionsForProblem(problemId: string, q: SubQuery = {}): Submission[] {
  let list = SUBMISSIONS.filter(s => s.problemId === problemId);
  if (q.mineOnly) list = list.filter(s => s.userHandle === CURRENT_HANDLE);
  if (q.verdict && q.verdict !== "ALL") list = list.filter(s => s.verdict === q.verdict);
  if (q.language && q.language !== "ALL") list = list.filter(s => s.language === q.language);
  if (q.user) { const needle = q.user.toLowerCase(); list = list.filter(s => s.userHandle.toLowerCase().includes(needle)); }
  const sort = q.sort ?? "newest";
  return [...list].sort((a, b) => {
    if (sort === "score") return b.score - a.score;
    if (sort === "fastest") return timeMs(a.time) - timeMs(b.time);
    return b.submittedAt.localeCompare(a.submittedAt);
  });
}
export function submissionsByUser(handle: string): Submission[] {
  return SUBMISSIONS.filter(s => s.userHandle === handle)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export interface SearchResults {
  problems: Problem[];
  users: UserProfile[];
  editorials: Problem[];
}
export function searchAll(query: string): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { problems: [], users: [], editorials: [] };
  const problems = PROBLEMS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.author.toLowerCase().includes(q) ||
    p.tags.some(t => t.includes(q)));
  const users = USERS.filter(u =>
    u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
  const editorials = PROBLEMS.filter(p => p.editorial === "open" && p.title.toLowerCase().includes(q));
  return { problems, users, editorials };
}
```

- [ ] **Step 2: Write a throwaway assertion script and run it**

Create `scripts/check-mock.mjs`:

```js
import {
  USERS, PROBLEMS, SUBMISSIONS, submissionsForProblem, getUserByHandle,
  getSubmission, searchAll, CURRENT_HANDLE,
} from "../lib/mock.ts";

function assert(cond, msg) { if (!cond) { console.error("FAIL:", msg); process.exit(1); } }

// every submission references a real user + problem
for (const s of SUBMISSIONS) {
  assert(getUserByHandle(s.userHandle), `submission ${s.id} has unknown user ${s.userHandle}`);
  assert(PROBLEMS.some(p => p.id === s.problemId), `submission ${s.id} has unknown problem`);
  // score equals sum of awarded group points (except CE/PENDING with no groups)
  if (s.groups.length) {
    const sum = s.groups.reduce((a, g) => a + g.awarded, 0);
    assert(sum === s.score, `submission ${s.id} score ${s.score} != awarded sum ${sum}`);
  }
}
// current user has a perfect AC on matrix-exploration
const mine = submissionsForProblem("matrix-exploration", { mineOnly: true });
assert(mine.some(s => s.score === 100 && s.verdict === "AC"), "no perfect AC for current user");
assert(getSubmission("4821"), "submission 4821 missing");
// filters
assert(submissionsForProblem("matrix-exploration", { verdict: "AC" }).every(s => s.verdict === "AC"), "verdict filter broken");
// determinism: two calls identical
assert(JSON.stringify(SUBMISSIONS) === JSON.stringify(SUBMISSIONS), "not stable");
// search
assert(searchAll("matrix").problems.length >= 2, "search should find matrix problems");
assert(searchAll("alex").users.some(u => u.handle === CURRENT_HANDLE), "search should find current user");
console.log(`OK — ${SUBMISSIONS.length} submissions, ${USERS.length} users, ${PROBLEMS.length} problems`);
```

Run: `node --experimental-strip-types scripts/check-mock.mjs`
Expected: `OK — <n> submissions, 11 users, 7 problems` and exit 0. (Node 24 supports `--experimental-strip-types` for importing the `.ts` module directly.)

- [ ] **Step 3: Delete the throwaway script, verify typecheck**

```bash
rm scripts/check-mock.mjs
npm run typecheck
```
Expected: typecheck clean, exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/mock.ts
git commit -m "feat(mock): deterministic problems/users/submissions/notifications + helpers"
```

---

## Task 3: Extract shared rendering components

**Files:**
- Create: `components/code/CodePane.tsx`
- Create: `components/submissions/Evaluation.tsx`
- Create: `components/submissions/SourceModal.tsx`
- Modify: `components/pages/Problem.tsx` (remove the now-extracted code; import the new modules; convert `PB_GROUPS` to the canonical `TestGroup` shape)
- Modify: `styles/pages-problem.css` (add `.ts-re`)

- [ ] **Step 1: Create `components/code/CodePane.tsx`**

Move `hlCpp` + `CodePane` out of `Problem.tsx` verbatim:

```tsx
/* C++ syntax highlighter + code pane, shared across the submission views. */
export function hlCpp(code: string): string[] {
  let s = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const KW = /\b(int|long|using|namespace|return|for|while|if|else|void|const|vector|set|map|pair|sort|cin|cout|std|nullptr|main|bool|auto|struct|double|ios|sync_with_stdio|tie|begin|end|first|second|push_back|size)\b/g;
  const NUM = /\b(\d+(?:LL|ll|u|U)?)\b/g;
  const lines = s.split('\n').map(line => {
    if (/^\s*\/\//.test(line)) return '<span class="c-com">' + line + '</span>';
    if (/^\s*#/.test(line)) {
      return line.replace(/^(\s*#[a-z]+)(.*)$/, '<span class="c-pre">$1</span><span class="c-inc">$2</span>');
    }
    const parts = line.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) return '<span class="c-str">' + part + '</span>';
      let p = part.replace(/(\/\/.*)$/, '$1');
      p = p.replace(KW, '<span class="c-kw">$1</span>');
      p = p.replace(NUM, '<span class="c-num">$1</span>');
      p = p.replace(/(.*)/, '<span class="c-com">$1</span>');
      return p;
    }).join('');
  });
  return lines;
}

export function CodePane({ code, className }: { code: string; className?: string }) {
  const lines = hlCpp(code);
  return (
    <div className={'cpane' + (className ? ' ' + className : '')}>
      <div className="cpane-gutter">{lines.map((_, i) => <span key={i}>{i + 1}</span>)}</div>
      <pre className="cpane-code">{lines.map((l, i) => <div key={i} className="cline" dangerouslySetInnerHTML={{ __html: l || '​' }} />)}</pre>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/submissions/Evaluation.tsx`**

```tsx
import { Icon } from "@/components/ui";
import type { TestGroup, TestStatus as TStatus } from "@/lib/types";

export function TestStatus({ st }: { st: TStatus }) {
  if (st === 'ok')  return <span className="ts ts-ok"><Icon name="check" size={13}/> Accepted</span>;
  if (st === 'tle') return <span className="ts ts-tle"><Icon name="clock" size={13}/> Time Limit</span>;
  if (st === 'wa')  return <span className="ts ts-wa"><Icon name="close" size={13}/> Wrong Answer</span>;
  if (st === 're')  return <span className="ts ts-re"><Icon name="close" size={13}/> Runtime Error</span>;
  return <span className="ts ts-pend"><Icon name="minus" size={13}/> Pending</span>;
}

export function Evaluation({ groups, total }: { groups: TestGroup[]; total: number }) {
  return (
    <>
      <div className="pb-eval-note"><Icon name="target" size={13}/> Group score is awarded only if all tests in that group pass. <span className="dim">Total possible score: 100</span></div>
      <div className="pb-eval-body">
        {groups.map((g, gi) => (
          <div key={gi} className="pb-group">
            <div className="pb-group-h">
              <span>{g.name} <span className="dim">({g.points} points)</span></span>
              <span className={'pb-group-pts' + (g.awarded > 0 ? '' : ' zero')}>{g.awarded}</span>
            </div>
            <div className="pb-testtable">
              <div className="pb-testrow pb-testhead"><span>Test</span><span>Status</span><span>Time</span><span>Memory</span></div>
              {g.tests.map(t => (
                <div key={t.n} className="pb-testrow">
                  <span className="dim">Test {t.n}</span>
                  <span><TestStatus st={t.status}/></span>
                  <span className="mono dim">{t.time}</span>
                  <span className="mono dim">{t.memory}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="pb-total"><Icon name="trophy" size={20}/> Total Score: <b>{total}</b> <span className="dim">/ 100</span></div>
    </>
  );
}
```

- [ ] **Step 3: Create `components/submissions/SourceModal.tsx`**

```tsx
"use client";
import { Icon } from "@/components/ui";
import { CodePane } from "@/components/code/CodePane";
import type { Language } from "@/lib/types";

export function SourceModal({ code, language, onClose }: { code: string; language: Language; onClose: () => void }) {
  return (
    <div className="pb-modal-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pb-modal hud is-glow">
        <span className="hud-corners"></span>
        <div className="pb-modal-h">
          <h3>Submission Source Code</h3>
          <button className="pb-modal-x" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <div className="pb-modal-sub">
          <span className="mono">Language: <b>{language}</b></span>
          <button className="pb-copy"><Icon name="doc" size={12}/> Copy</button>
        </div>
        <CodePane code={code} className="pb-modal-code"/>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Refactor `components/pages/Problem.tsx`**

Make these exact edits:

1. Add imports near the top (after the existing `Icon` import):

```tsx
import { CodePane } from "@/components/code/CodePane";
import { Evaluation } from "@/components/submissions/Evaluation";
import { SourceModal } from "@/components/submissions/SourceModal";
import type { TestGroup } from "@/lib/types";
```

2. Delete the local `hlCpp` function and the local `CodePane` function (the two blocks now living in `components/code/CodePane.tsx`).

3. Delete the local `SourceModal` function and the local `TestStatus` function (now shared).

4. Replace the `PB_GROUPS` array with the canonical `TestGroup` shape and a typed annotation:

```tsx
const PB_GROUPS: TestGroup[] = [
  { name: 'Group 1', points: 10, awarded: 10, tests: [{ n: 1, status: 'ok', time: '8 ms', memory: '1.2 MB' }, { n: 2, status: 'ok', time: '11 ms', memory: '1.6 MB' }] },
  { name: 'Group 2', points: 20, awarded: 20, tests: [{ n: 3, status: 'ok', time: '9 ms', memory: '1.5 MB' }, { n: 4, status: 'ok', time: '14 ms', memory: '1.8 MB' }, { n: 5, status: 'ok', time: '18 ms', memory: '2.5 MB' }] },
  { name: 'Group 3', points: 12, awarded: 12, tests: [{ n: 6, status: 'ok', time: '22 ms', memory: '4.1 MB' }] },
  { name: 'Group 4', points: 28, awarded: 0,  tests: [{ n: 7, status: 'ok', time: '35 ms', memory: '5.2 MB' }, { n: 8, status: 'tle', time: '1000 ms', memory: '16.6 MB' }, { n: 9, status: 'wa', time: '120 ms', memory: '3.4 MB' }] },
  { name: 'Group 5', points: 30, awarded: 0,  tests: [{ n: 10, status: 'pend', time: '--', memory: '--' }] },
];
```

5. Replace the body of `EvalModal` so its group/test rendering uses the shared component:

```tsx
function EvalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="pb-modal-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pb-modal pb-modal-eval hud is-glow">
        <span className="hud-corners"></span>
        <div className="pb-modal-h">
          <h3>Evaluation Details</h3>
          <button className="pb-modal-x" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <Evaluation groups={PB_GROUPS} total={42} />
      </div>
    </div>
  );
}
```

6. Update the one `SourceModal` usage at the bottom of the file to pass props:

```tsx
{modal === 'source' && <SourceModal code={PB_SUBMISSION} language="C++17" onClose={() => setModal(null)}/>}
```

- [ ] **Step 5: Add `.ts-re` style to `styles/pages-problem.css`**

Find the block defining `.ts-ok`, `.ts-tle`, `.ts-wa`, `.ts-pend` (near line ~199) and add a `.ts-re` rule alongside them, e.g.:

```css
.ts-re { color: #f0946b; }
```

(Match the exact declaration style of the neighboring `.ts-*` rules — copy `.ts-wa`'s shape and swap the color to `#f0946b`.)

- [ ] **Step 6: Verify build + manual parity**

```bash
npm run typecheck && npm run build
```
Expected: both succeed.

Then `npm run dev`, open `/problem`, click the **Submissions** tab → **View source** (source modal shows highlighted code) and the **overview** icon (evaluation modal shows the five groups + total 42). Confirm identical to before the refactor.

- [ ] **Step 7: Commit**

```bash
git add components/code components/submissions components/pages/Problem.tsx styles/pages-problem.css
git commit -m "refactor(problem): extract CodePane, Evaluation, SourceModal into shared components"
```

---

## Task 4: Provider — notifications + appearance state

**Files:**
- Modify: `components/providers/AppProvider.tsx` (full replacement below)

- [ ] **Step 1: Replace `components/providers/AppProvider.tsx`**

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, Theme, Notification } from "@/lib/types";
import { NOTIFICATIONS, CURRENT_HANDLE } from "@/lib/mock";

const DEFAULT_USER: User = {
  authed: true,
  name: "Alex Popescu",
  initial: "A",
  email: "alex@leonix.dev",
  hue: 145,
  city: "București",
  qrCode: "LNX-Y3K9-77AX",
  level: 7,
  xp: 6420,
  xpNext: 8000,
  streak: 12,
};

export type CardStyle = "glass" | "solid" | "outlined";
export type RadiusStyle = "sharp" | "rounded" | "pill";
export interface Appearance { theme: Theme; card: CardStyle; radius: RadiusStyle; }

interface AppContextValue {
  user: User;
  currentHandle: string;
  theme: Theme;
  toggleTheme: () => void;
  appearance: Appearance;
  setAppearance: (patch: Partial<Appearance>) => void;
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  login: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [appearance, setAppearanceState] = useState<Appearance>({ theme: "dark", card: "glass", radius: "rounded" });
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);

  // Read persisted appearance after mount (SSR-safe).
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("leonix-theme") as Theme | null;
      const savedCard = localStorage.getItem("leonix-card") as CardStyle | null;
      const savedRadius = localStorage.getItem("leonix-radius") as RadiusStyle | null;
      setAppearanceState(a => ({
        theme: savedTheme ?? a.theme,
        card: savedCard ?? a.card,
        radius: savedRadius ?? a.radius,
      }));
    } catch {}
  }, []);

  // Apply + persist appearance to <html data-*>.
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = appearance.theme;
    el.dataset.card = appearance.card;
    el.dataset.radius = appearance.radius;
    try {
      localStorage.setItem("leonix-theme", appearance.theme);
      localStorage.setItem("leonix-card", appearance.card);
      localStorage.setItem("leonix-radius", appearance.radius);
    } catch {}
  }, [appearance]);

  const setAppearance = useCallback((patch: Partial<Appearance>) => {
    setAppearanceState(a => ({ ...a, ...patch }));
  }, []);
  const toggleTheme = useCallback(() => {
    setAppearanceState(a => ({ ...a, theme: a.theme === "light" ? "dark" : "light" }));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(ns => ns.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }, []);

  const login = useCallback(() => {
    setUser(u => ({ ...u, authed: true }));
    router.push("/dashboard");
  }, [router]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      user, currentHandle: CURRENT_HANDLE,
      theme: appearance.theme, toggleTheme,
      appearance, setAppearance,
      notifications, unreadCount, markRead, markAllRead,
      login,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
```

Note: `theme` and `toggleTheme` are preserved on the context so existing consumers (`TopNav`, `Dashboard`, etc.) keep working unchanged.

- [ ] **Step 2: Verify build + theme parity**

```bash
npm run typecheck && npm run build
```
Expected: both succeed.

Then `npm run dev`: the light/dark toggle in the top nav still works and persists across reload (existing behavior). `data-card`/`data-radius` now appear on `<html>` (inspect element) with defaults `glass`/`rounded` — no visual change yet since those match the token defaults.

- [ ] **Step 3: Commit**

```bash
git add components/providers/AppProvider.tsx
git commit -m "feat(provider): add notifications + appearance (theme/card/radius) state"
```

---

## Self-Review

- **Spec coverage (foundation slice):** shared types ✓ (Task 1), shared mock data + helpers `getUserByHandle`/`getSubmission`/`submissionsForProblem`/`submissionsByUser`/`searchAll` ✓ (Task 2), extracted `CodePane`/`Evaluation`/`SourceModal` ✓ (Task 3), provider notifications + appearance + `currentHandle` ✓ (Task 4). Deferred to later plans by design: the pages, routes, and cross-page wiring.
- **Placeholders:** none — every step contains full code or an exact command.
- **Type consistency:** `TestGroup` uses `points`/`awarded`/`tests[{n,status,time,memory}]` in types (Task 1), mock generator (Task 2), the refactored `PB_GROUPS` and `Evaluation` (Task 3) — consistent. `Verdict`/`Language`/`TestStatus` string unions match across `mock.ts`, `Evaluation`, and `SourceModal`. Provider exports `useApp` with `theme`/`toggleTheme` retained so no existing consumer breaks.
- **SSR safety:** all randomness is seeded; all timestamps derive from a fixed base date — no `Date.now()`/`Math.random()` at module load.

---

## Next

After this plan lands, the feature plans build on it in order:
1. Submissions list (`/problem/submissions`) + submission detail (`/submissions/[id]`)
2. Public profiles (`/u/[handle]`, `/profile`) + username wiring
3. Notifications dropdown + `/notifications`
4. Search (⌘K + `/search`)
5. Settings (`/settings`) + wallet cleanup + footer links

Each will be written just-in-time against the real, already-created foundation files.
