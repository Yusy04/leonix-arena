import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userDashboard } from "@/lib/users/queries";
import { Dashboard } from "@/components/pages/Dashboard";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const data = await userDashboard(user.id);
  return <Dashboard data={data} />;
}
