import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { loadCalendar } from "@/lib/calendar";
import { Agenda, LAYER_DOT, LayerLegend } from "@/components/agenda";
import { PageHeader } from "@/components/ui";
import { addDaysKey, todayKey } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "캘린더" };

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { view } = await searchParams;
  const month = view === "month";
  const viewer = await getViewer();
  const { items, bands } = await loadCalendar(viewer);
  const today = todayKey();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="캘린더"
        description="학생회·동아리, 학교·학과, 내가 신청하거나 저장한 것이 한 줄로 모여요."
        actions={
          <div className="flex rounded-[10px] bg-panel p-1" role="tablist" aria-label="보기">
            {[
              ["week", "주", "/calendar"],
              ["month", "월", "/calendar?view=month"],
            ].map(([k, l, h]) => (
              <Link
                key={k}
                href={h}
                role="tab"
                aria-selected={(k === "month") === month}
                className={cn(
                  "grid h-8 w-12 place-items-center rounded-lg text-[13px] font-semibold",
                  (k === "month") === month ? "bg-surface text-ink shadow-sm" : "text-ink-3",
                )}
              >
                {l}
              </Link>
            ))}
          </div>
        }
      />
      <LayerLegend />
      {month ? <MonthGrid items={items} bands={bands} today={today} /> : <Agenda items={items} bands={bands} days={21} />}
      <p className="text-[12.5px] text-ink-3">일정은 앱에 들어온 것만 보여요. 개인 일정은 구글 캘린더에서 합쳐 보면 돼요.</p>
    </div>
  );
}

function MonthGrid({
  items,
  bands,
  today,
}: {
  items: Awaited<ReturnType<typeof loadCalendar>>["items"];
  bands: Awaited<ReturnType<typeof loadCalendar>>["bands"];
  today: string;
}) {
  const [y, m] = today.split("-").map(Number);
  const first = `${y}-${String(m).padStart(2, "0")}-01`;
  const firstDow = (new Date(`${first}T12:00:00+09:00`).getUTCDay() + 6) % 7; // 월요일 시작
  const start = addDaysKey(first, -firstDow);
  const cells = Array.from({ length: 42 }, (_, i) => addDaysKey(start, i));
  const weeks = Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7)).filter((wk) => wk.some((d) => Number(d.slice(5, 7)) === m));
  const inBand = (d: string) => bands.find((b) => d >= b.start && d <= b.end);

  return (
    <section aria-label={`${y}년 ${m}월`}>
      <h2 className="mb-3 text-[17px] font-bold">
        {y}년 {m}월
      </h2>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-[12px] font-semibold text-ink-3">
          {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((wk) => (
          <div key={wk[0]} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {wk.map((d) => {
              const list = items.filter((i) => i.day === d);
              const out = Number(d.slice(5, 7)) !== m;
              const band = inBand(d);
              return (
                <div key={d} className={cn("min-h-24 border-r border-line p-1.5 last:border-r-0", out && "bg-surface-2/60")}>
                  <span
                    className={cn(
                      "num inline-grid size-6 place-items-center rounded-full text-[12.5px] font-semibold",
                      d === today ? "bg-coral text-white" : out ? "text-ink-4" : "text-ink-2",
                    )}
                  >
                    {Number(d.slice(8))}
                  </span>
                  {band ? <span className="mt-1 block truncate rounded bg-amber-tint px-1 text-[10.5px] font-semibold text-amber-ink">{band.name.replace(" 기간", "")}</span> : null}
                  <ul className="mt-1 space-y-0.5">
                    {list.slice(0, 3).map((it) => (
                      <li key={it.key}>
                        <Link href={it.href} className="flex items-center gap-1 truncate text-[11px] leading-4 font-medium text-ink-2 hover:text-ink">
                          <span className={cn("size-1.5 shrink-0 rounded-full", LAYER_DOT[it.layer])} aria-hidden />
                          <span className="truncate">{it.title}</span>
                        </Link>
                      </li>
                    ))}
                    {list.length > 3 ? <li className="text-[10.5px] text-ink-3">+{list.length - 3}</li> : null}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
