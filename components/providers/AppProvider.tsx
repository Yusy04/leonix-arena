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
