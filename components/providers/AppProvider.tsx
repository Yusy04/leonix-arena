"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, Theme } from "@/lib/types";

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

interface AppContextValue {
  user: User;
  theme: Theme;
  toggleTheme: () => void;
  login: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [theme, setTheme] = useState<Theme>("dark");

  // Read persisted theme after mount (SSR-safe).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("leonix-theme") as Theme | null;
      if (saved) setTheme(saved);
    } catch {}
  }, []);

  // Apply + persist theme.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("leonix-theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    []
  );

  const login = useCallback(() => {
    setUser((u) => ({ ...u, authed: true }));
    router.push("/dashboard");
  }, [router]);

  return (
    <AppContext.Provider value={{ user, theme, toggleTheme, login }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
