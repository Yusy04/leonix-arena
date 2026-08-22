import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/components.css";
import "../styles/nav.css";
import "../styles/pages-home.css";
import "../styles/pages-archive.css";
import "../styles/pages-problem.css";
import "../styles/pages-submissions.css";
import "../styles/pages-profile.css";
import "../styles/pages-notifications.css";
import "../styles/pages-search.css";
import "../styles/pages-settings.css";
import "../styles/pages-admin.css";
import "../styles/pages.css";
import "../styles/theme-light.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { getCurrentUser } from "@/lib/auth/session";
import { toAuthUser } from "@/lib/auth/user";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono-google",
});

export const metadata: Metadata = {
  title: "leonix arena — competitive programming training",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await getCurrentUser();
  const authUser = dbUser ? toAuthUser(dbUser) : null;
  return (
    <html lang="en" className={`${hanken.variable} ${mono.variable}`}>
      <body>
        <AppProvider initialUser={authUser}>{children}</AppProvider>
      </body>
    </html>
  );
}
