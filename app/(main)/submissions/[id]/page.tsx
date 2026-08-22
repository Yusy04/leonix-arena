import { submissionDetail } from "@/lib/submissions/queries";
import { SubmissionDetail } from "@/components/pages/SubmissionDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sub = await submissionDetail(id);
  return <SubmissionDetail sub={sub} />;
}
