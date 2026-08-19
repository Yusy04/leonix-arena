import { TopNav, Footer } from "@/components/nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-root">
      <TopNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
