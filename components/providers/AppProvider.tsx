"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, Theme, Notification, AuthUser, Role } from "@/lib/types";
import { NOTIFICATIONS, CURRENT_HANDLE } from "@/lib/mock";

// Gamification stats aren't real yet (no problems backend), so they stay as
// placeholders. Identity + profile details (name/email/city/avatar) come from
// the signed-in account.
const PLACEHOLDER_STATS = { level: 7, xp: 6420, xpNext: 8000, streak: 12 };

function toMockUser(authUser: AuthUser | null): User {
  if (!authUser) {
    return { authed: false, name: "Guest", initial: "G", email: "", hue: 145, city: "", ...PLACEHOLDER_STATS };
  }
  return {
    authed: true,
    name: authUser.name,
    initial: authUser.name.charAt(0).toUpperCase(),
    email: authUser.email,
    hue: authUser.avatarHue,
    city: authUser.city,
    ...PLACEHOLDER_STATS,
  };
}

export type CardStyle = "glass" | "solid" | "outlined";
export type RadiusStyle = "sharp" | "rounded" | "pill";
export interface Appearance { theme: Theme; card: CardStyle; radius: RadiusStyle; }

interface AppContextValue {
  user: User;
  authUser: AuthUser | null;
  role: Role | null;
  currentHandle: string;
  theme: Theme;
  toggleTheme: () => void;
  appearance: Appearance;
  setAppearance: (patch: Partial<Appearance>) => void;
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ initialUser, children }: { initialUser: AuthUser | null; children: React.ReactNode }) {
  const router = useRouter();
  // Use the server-provided user directly (NOT useState) so it stays current
  // when the session changes and the layout re-renders via router.refresh().
  const authUser = initialUser;
  const [appearance, setAppearanceState] = useState<Appearance>({ theme: "dark", card: "glass", radius: "rounded" });
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("leonix-theme") as Theme | null;
      const savedCard = localStorage.getItem("leonix-card") as CardStyle | null;
      const savedRadius = localStorage.getItem("leonix-radius") as RadiusStyle | null;
      setAppearanceState(a => ({ theme: savedTheme ?? a.theme, card: savedCard ?? a.card, radius: savedRadius ?? a.radius }));
    } catch {}
  }, []);

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

  const setAppearance = useCallback((patch: Partial<Appearance>) => setAppearanceState(a => ({ ...a, ...patch })), []);
  const toggleTheme = useCallback(() => setAppearanceState(a => ({ ...a, theme: a.theme === "light" ? "dark" : "light" })), []);
  const markRead = useCallback((id: string) => setNotifications(ns => ns.map(n => (n.id === id ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(() => setNotifications(ns => ns.map(n => ({ ...n, read: true }))), []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      user: toMockUser(authUser),
      authUser,
      role: authUser?.role ?? null,
      currentHandle: CURRENT_HANDLE,
      theme: appearance.theme, toggleTheme,
      appearance, setAppearance,
      notifications, unreadCount, markRead, markAllRead,
      logout,
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
