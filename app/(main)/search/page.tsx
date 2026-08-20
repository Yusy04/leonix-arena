import { SearchResultsPage } from "@/components/pages/Search";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <SearchResultsPage q={q ?? ""} />;
}
