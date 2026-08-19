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
