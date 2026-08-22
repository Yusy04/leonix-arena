import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { problemSubmissions, userBestScore } from "@/lib/submissions/queries";
import { SubmissionsPage } from "@/components/pages/Submissions";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const data = await problemSubmissions(code, {});
  if (!data) notFound();
  const user = await getCurrentUser();
  const bestScore = user ? await userBestScore(user.id, code) : null;
  return <SubmissionsPage code={code} problemTitle={data.problemTitle} rows={data.rows} bestScore={bestScore} />;
}
