import { userProfile } from "@/lib/users/queries";
import { Profile } from "@/components/pages/Profile";

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await userProfile(handle);
  return <Profile profile={profile} />;
}
