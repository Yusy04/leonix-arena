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
