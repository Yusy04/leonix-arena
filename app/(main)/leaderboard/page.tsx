import { leaderboard } from "@/lib/users/queries";
import { Leaderboard } from "@/components/pages/Extras";

export default async function Page() {
  const rows = await leaderboard();
  return <Leaderboard rows={rows} />;
}
