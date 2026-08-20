import { SubmissionDetail } from "@/components/pages/SubmissionDetail";
import { SUBMISSIONS } from "@/lib/mock";

export function generateStaticParams() {
  return SUBMISSIONS.map(s => ({ id: s.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubmissionDetail id={id} />;
}
