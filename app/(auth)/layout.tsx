export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="app-root" data-screen-label="auth">{children}</main>;
}
