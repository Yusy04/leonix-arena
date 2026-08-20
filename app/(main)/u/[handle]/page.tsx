import { Profile } from "@/components/pages/Profile";
import { USERS } from "@/lib/mock";

export function generateStaticParams() {
  return USERS.map(u => ({ handle: u.handle }));
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <Profile handle={handle} />;
}
