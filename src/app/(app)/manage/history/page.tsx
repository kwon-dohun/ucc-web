import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { PageHeader } from "@/components/ui";
import { StatsLine } from "@/components/stats-line";
import { monthDay, semesterLabel } from "@/lib/format";
import type { Series, UccEvent } from "@/lib/types";

export const metadata = { title: "지난 활동" };

export default async function History() {
  const { org } = await requireOfficer();
  const supabase = await createClient();
  const [{ data: events }, { data: series }] = await Promise.all([
    supabase.from("events").select("*").eq("org_id", org.id).eq("status", "finished").order("finished_at", { ascending: false }),
    supabase.from("event_series").select("*").eq("org_id", org.id).order("sort"),
  ]);
  const list = (events ?? []) as UccEvent[];
  const bySemester = new Map<string, UccEvent[]>();
  for (const e of list) bySemester.set(e.semester, [...(bySemester.get(e.semester) ?? []), e]);
  const count = (sid: string) => list.filter((e) => e.series_id === sid).length;

  return (
    <div className="space-y-8">
      <PageHeader title="지난 활동" description="끝나면 학기별로 쌓이고, 같은 행사끼리 알아서 묶여요." />

      <nav aria-label="같은 행사 모아보기">
        <ul className="flex flex-wrap gap-2">
          {((series ?? []) as Series[])
            .filter((s) => count(s.id) > 0)
            .map((s) => (
              <li key={s.id}>
                <Link
                  href={`/manage/history/${s.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink-2 hover:border-ink-4 hover:text-ink"
                >
                  {s.name}
                  <span className="num text-ink-4">{count(s.id)}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      <div className="space-y-8">
        {[...bySemester.entries()].map(([sem, items]) => (
          <section key={sem}>
            <h2 className="mb-3 flex items-baseline gap-2 text-[15px] font-bold">
              {semesterLabel(sem)}
              <span className="text-[13px] font-medium text-ink-3">{items[0].term}대</span>
            </h2>
            <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {items.map((e) => {
                const md = e.finished_at ? monthDay(e.finished_at) : null;
                return (
                  <li key={e.id}>
                    <Link href={`/manage/events/${e.id}`} className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-surface-2">
                      <span className="text-center leading-tight">
                        <span className="num block text-[17px] font-bold">{md?.d}</span>
                        <span className="block text-[11.5px] text-ink-3">{md?.m}월</span>
                      </span>
                      <span className="truncate text-[14.5px] font-semibold">{e.title.replace(/^\d{4}\s*/, "")}</span>
                      <span className="text-[13px] text-ink-3">
                        <StatsLine stats={e.stats} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
