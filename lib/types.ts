export interface User {
  authed: boolean;
  name: string;
  initial: string;
  email: string;
  hue: number;
  city: string;
  qrCode: string;
  level: number;
  xp: number;
  xpNext: number;
  streak: number;
}

export type Theme = "dark" | "light";

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
// ---------- Auth ----------
export type Role = "STUDENT" | "HELPER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  handle: string;
  name: string;
  role: Role;
  goals: string[];
  language: string | null;
}

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
