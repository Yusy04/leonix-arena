import { Profile } from "@/components/pages/Profile";

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <Profile handle={handle} />;
}
