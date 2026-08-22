import { searchCatalog } from "@/lib/users/queries";
import { SearchResultsPage } from "@/components/pages/Search";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const results = await searchCatalog(q ?? "");
  return <SearchResultsPage q={q ?? ""} results={results} />;
}
