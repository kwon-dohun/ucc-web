import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { addHandoverNote, cloneEvent } from "@/app/actions/manage";
import { Button, SectionTitle } from "@/components/ui";
import { StatsLine } from "@/components/stats-line";
import { fmtDate, minutesLabel, semesterLabel } from "@/lib/format";
import type { EventStats, Series, UccEvent } from "@/lib/types";

export const metadata = { title: "모아보기" };

export default async function SeriesPage({ params }: PageProps<"/manage/history/[seriesId]">) {
  const { seriesId } = await params;
  const { org } = await requireOfficer();
  const supabase = await createClient();
  const [{ data: series }, { data: events }, { data: notes }] = await Promise.all([
    supabase.from("event_series").select("*").eq("id", seriesId).eq("org_id", org.id).maybeSingle(),
    supabase.from("events").select("*").eq("series_id", seriesId).eq("status", "finished").order("finished_at", { ascending: false }),
    supabase.from("handover_notes").select("*").eq("series_id", seriesId).order("created_at", { ascending: false }),
  ]);
  if (!series) notFound();
  const s = series as Series;
  const list = (events ?? []) as UccEvent[];
  const latest = list[0];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/manage/history" className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-3.5" />
        지난 활동
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{s.name}</h1>
          <p className="mt-1 text-[14px] text-ink-3">
            {list.length}번 했어요{s.usual_months.length ? `, 보통 ${s.usual_months.join("·")}월` : ""}
          </p>
        </div>
        {latest ? (
          <form action={cloneEvent.bind(null, latest.id)}>
            <Button variant="primary">지난번 걸로 새로 만들기</Button>
          </form>
        ) : null}
      </header>

      <section>
        <SectionTitle>회차별</SectionTitle>
        <ol className="space-y-3">
          {list.map((e) => {
            const st = (e.stats ?? {}) as EventStats;
            const opts = [...(st.options ?? [])];
            const firstOut = opts.filter((o) => o.sold_out_minutes != null).sort((a, b) => a.sold_out_minutes! - b.sold_out_minutes!)[0];
            return (
              <li key={e.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/manage/events/${e.id}`} className="text-[14.5px] font-bold hover:underline">
                    {semesterLabel(e.semester)} {e.title.match(/(중간고사|기말고사)/)?.[0] ?? ""}
                  </Link>
                  <span className="text-[13px] text-ink-3">{e.finished_at ? fmtDate(e.finished_at) : ""}</span>
                </div>
                {opts.length ? (
                  <ul className="mt-2 space-y-1">
                    {opts.map((o) => (
                      <li key={o.name} className="text-[14px]">
                        <span className={o === firstOut && opts.length > 1 ? "font-semibold text-coral-ink" : "font-medium"}>
                          {o.name} {o.quantity}개
                        </span>
                        {o.sold_out_minutes != null ? <span className="text-ink-3">, {minutesLabel(o.sold_out_minutes)} 만에 끝</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[14px] text-ink-2">
                    <StatsLine stats={e.stats} />
                  </p>
                )}
                {st.no_show != null ? <p className="mt-1 text-[12.5px] text-ink-3">안 온 신청자 {st.no_show}명</p> : null}
                {st.note ? <p className="mt-1 text-[12.5px] text-ink-3">{st.note}</p> : null}
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <SectionTitle aside="이름과 기수를 달고 남아요">이어받은 한 줄</SectionTitle>
        <ul className="space-y-2">
          {(notes ?? []).map((n) => (
            <li key={n.id} className="rounded-xl bg-surface px-4 py-3 shadow-sm">
              <p className="text-[14.5px] leading-6">{n.body}</p>
              <p className="mt-1 text-[12.5px] text-ink-3">{n.author_label}</p>
            </li>
          ))}
        </ul>
        <form action={addHandoverNote.bind(null, seriesId, null)} className="mt-3 flex gap-2">
          <label htmlFor="body" className="sr-only">
            한 줄 남기기
          </label>
          <input
            id="body"
            name="body"
            maxLength={300}
            placeholder="다음 사람이 알면 좋을 것"
            className="h-11 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-surface px-3 text-[14px] outline-none placeholder:text-ink-4 focus:border-coral"
          />
          <Button variant="ink" className="h-11">
            남기기
          </Button>
        </form>
      </section>

      <section className="flex items-start gap-3 rounded-xl border border-dashed border-line-strong px-4 py-4">
        <FolderOpen className="mt-0.5 size-4 shrink-0 text-ink-3" />
        <p className="text-[13.5px] leading-6 text-ink-2">
          안내 포스터, 업체 견적과 영수증 같은 원본은 학생회 공용 드라이브에 두고 링크로 연결해요. 드라이브 연결은 다음 단계에서
          붙여요.
        </p>
      </section>
    </div>
  );
}
