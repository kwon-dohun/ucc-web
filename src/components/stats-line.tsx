import { minutesLabel } from "@/lib/format";
import type { EventStats } from "@/lib/types";

export function StatsLine({ stats }: { stats: EventStats | null }) {
  if (!stats) return null;
  if (stats.sold_out_minutes) {
    return (
      <>
        <span className="num">{stats.total}</span>개 <b className="font-semibold text-ink">{minutesLabel(stats.sold_out_minutes)}</b> 만에 마감
      </>
    );
  }
  return (
    <>
      <span className="num">{stats.applied}</span>
      {stats.unit === "칸" ? "칸 배정" : "명 참가"}
    </>
  );
}
