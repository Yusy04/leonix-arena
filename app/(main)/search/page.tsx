import { Suspense } from "react";
import { SearchResultsPage } from "@/components/pages/Search";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchResultsPage />
    </Suspense>
  );
}
