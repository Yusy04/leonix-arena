import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canCreateProblem } from "@/lib/problems/authz";
import { NewProblemForm } from "@/components/admin/NewProblemForm";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/problems/new");
  if (!canCreateProblem(user.role)) redirect("/dashboard");
  return <NewProblemForm />;
}
