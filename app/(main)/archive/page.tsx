import { getCurrentUser } from "@/lib/auth/session";
import { listArchive } from "@/lib/problems/public";
import { Archive } from "@/components/pages/Archive";

export default async function Page() {
  const user = await getCurrentUser();
  const problems = await listArchive(user?.id);
  return <Archive problems={problems} authed={!!user} />;
}
