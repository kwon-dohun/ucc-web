import Link from "next/link";
import { addDaysKey, fmtDate, todayKey } from "@/lib/format";
import type { Band, CalItem, Layer } from "@/lib/calendar";
import { cn } from "@/lib/utils";

export const LAYER_DOT: Record<Layer, string> = {
  org: "bg-coral",
  school: "bg-d-plan",
  mine: "bg-ink",
  saved: "border-[1.5px] border-dashed border-ink-3 bg-transparent",
};

/** 날짜별로 내려가는 목록. 일정 없는 날은 묶어서 한 줄로 */
export function Agenda({ items, bands, days }: { items: CalItem[]; bands: Band[]; days: number }) {
  const today = todayKey();
  const keys = Array.from({ length: days }, (_, i) => addDaysKey(today, i));
  const byDay = new Map<string, CalItem[]>();
  for (const it of items) if (keys.includes(it.day)) byDay.set(it.day, [...(byDay.get(it.day) ?? []), it]);

  const rows: ({ kind: "day"; key: string; list: CalItem[] } | { kind: "gap"; from: string; to: string })[] = [];
  let gapStart: string | null = null;
  keys.forEach((k, i) => {
    const list = byDay.get(k);
    if (list?.length || k === today) {
      if (gapStart) rows.push({ kind: "gap", from: gapStart, to: keys[i - 1] });
      gapStart = null;
      rows.push({ kind: "day", key: k, list: list ?? [] });
    } else if (!gapStart) gapStart = k;
  });
  if (gapStart) rows.push({ kind: "gap", from: gapStart, to: keys[keys.length - 1] });

  const bandFor = (k: string) => bands.find((b) => b.start === k || (k === today && b.start > today && b.start <= addDaysKey(today, 7)));

  return (
    <ol className="space-y-1">
      {rows.map((r) => {
        if (r.kind === "gap") {
          const band = bands.find((b) => b.start >= r.from && b.start <= r.to);
          return (
            <li key={`gap-${r.from}`} className="py-2 pl-[4.5rem] text-[12.5px] text-ink-4">
              {r.from === r.to ? fmtDate(`${r.from}T12:00:00+09:00`) : `${fmtDate(`${r.from}T12:00:00+09:00`)} ~ ${fmtDate(`${r.to}T12:00:00+09:00`)}`} 일정 없음
              {band ? <span className="ml-2 font-semibold text-amber-ink">{band.name} {band.start.slice(5).replace("-", "/")}부터</span> : null}
            </li>
          );
        }
        const d = new Date(`${r.key}T12:00:00+09:00`);
        const isToday = r.key === today;
        const band = bandFor(r.key);
        return (
          <li key={r.key} className="grid grid-cols-[3.75rem_1fr] gap-3 py-1.5">
            <div className={cn("pt-2 text-center leading-tight", isToday ? "text-coral-ink" : "text-ink-2")}>
              <span className="num block text-[19px] font-bold">{Number(r.key.slice(8))}</span>
              <span className="block text-[11.5px] font-semibold">{isToday ? "오늘" : fmtDate(d).match(/\((.)\)/)?.[1]}</span>
            </div>
            <div className="min-w-0 space-y-1.5">
              {band ? (
                <p className="rounded-lg bg-amber-tint px-3 py-1.5 text-[12.5px] font-semibold text-amber-ink">
                  {band.name} {band.start.slice(5).replace("-", "/")} ~ {band.end.slice(5).replace("-", "/")}
                </p>
              ) : null}
              {r.list.length ? (
                r.list.map((it) => (
                  <Link
                    key={it.key}
                    href={it.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors",
                      it.dotted ? "border border-dashed border-line-strong hover:border-ink-4" : "border border-line bg-surface hover:border-ink-4",
                    )}
                  >
                    <span className={cn("size-2 shrink-0 rounded-full", LAYER_DOT[it.layer])} aria-hidden />
                    <span className="num w-11 shrink-0 text-[13px] font-semibold text-ink-2">{it.time}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{it.title}</span>
                      <span className="block truncate text-[12.5px] text-ink-3">{it.sub}</span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-1 py-2.5 text-[13px] text-ink-4">오늘은 일정이 없어요</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function LayerLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-3">
      {(
        [
          ["org", "학생회·동아리"],
          ["school", "학교·학과"],
          ["mine", "내 신청"],
          ["saved", "저장만 함"],
        ] as [Layer, string][]
      ).map(([l, t]) => (
        <li key={l} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", LAYER_DOT[l])} aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  );
}
