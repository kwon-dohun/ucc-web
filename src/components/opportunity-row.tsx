import Link from "next/link";
import { Badge } from "@/components/ui";
import { SaveButton } from "@/components/save-button";
import { countsTowardEpic, reasons } from "@/lib/opportunities";
import { dday, daysUntil, fmtDate, fmtShortDate } from "@/lib/format";
import type { Opportunity, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OpportunityRow({
  o,
  profile,
  saved,
  showReason = true,
}: {
  o: Opportunity;
  profile: Profile;
  saved: boolean;
  showReason?: boolean;
}) {
  const reason = reasons(o, profile)[0];
  const counts = countsTowardEpic(o, profile);
  const d = o.deadline ? daysUntil(o.deadline) : null;
  return (
    <li className="relative flex gap-4 bg-surface px-4 py-4 transition-colors hover:bg-surface-2">
      <div className="w-12 shrink-0 text-center">
        {o.deadline ? (
          <>
            <span className={cn("num block text-[13px] font-bold", d !== null && d <= 7 ? "text-coral-ink" : "text-ink-2")}>{dday(o.deadline)}</span>
            <span className="num block text-[11.5px] text-ink-3">{fmtShortDate(o.deadline)}</span>
          </>
        ) : o.posted_at ? (
          <>
            <span className="num block text-[13px] font-bold text-ink-3">{fmtShortDate(o.posted_at)}</span>
            <span className="block text-[11.5px] text-ink-3">게시</span>
          </>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
          <span>{o.source}</span>
          {o.epic_points ? <Badge tone={counts ? "green" : "neutral"}>{counts ? `EPiC ${o.epic_points}점` : "EPiC, 비교과 점수 다 참"}</Badge> : null}
        </div>
        <Link href={`/find/${o.id}`} className="mt-1 block text-[15px] leading-6 font-semibold after:absolute after:inset-0">
          {o.title}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-3">
          {o.starts_at ? `${fmtDate(o.starts_at)}${o.location ? `, ${o.location}` : ""}` : o.summary}
        </p>
        {showReason && reason ? <p className="mt-1.5 text-[13px] font-medium text-coral-ink">{reason}</p> : null}
      </div>
      <div className="relative z-10 self-start">
        <SaveButton id={o.id} saved={saved} compact />
      </div>
    </li>
  );
}
