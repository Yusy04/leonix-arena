import type { NotificationType } from "@/lib/types";

export const NOTIF_ICON: Record<NotificationType, string> = {
  judged: "check",
  hint: "sparkle",
  editorial: "doc",
  rank: "trophy",
  streak: "fire",
  contest: "calendar",
  badge: "star",
};
