import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { loadEventConsole } from "@/lib/events";
import { LiveEvent } from "@/components/live-event";
import { Badge, Button } from "@/components/ui";
import { addHandoverNote } from "@/app/actions/manage";
import { fmtDate, minutesLabel } from "@/lib/format";
import type { EventStats } from "@/lib/types";

export const metadata = { title: "행사 운영" };

export default async function EventConsole({ params, searchParams }: PageProps<"/manage/events/[id]">) {
  const { id } = await params;
  const { published } = await searchParams;
  const { viewer, org } = await requireOfficer();
  const data = await loadEventConsole(id);
  if (!data || data.event.org_id !== org.id) notFound();
  if (data.event.status === "draft") redirect(`/manage/events/${id}/edit`);

  const back = (
    <Link href="/manage/events" className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
      <ArrowLeft className="size-3.5" />
      사업·행사
    </Link>
  );

  if (data.event.status === "finished") {
    const st = (data.event.stats ?? {}) as EventStats;
    const supabase = await createClient();
    const { data: notes } = data.event.series_id
      ? await supabase.from("handover_notes").select("*").eq("event_id", id).order("created_at")
      : { data: [] };
    const firstOut = [...(st.options ?? [])].filter((o) => o.sold_out_minutes != null).sort((a, b) => a.sold_out_minutes! - b.sold_out_minutes!)[0];

    return (
      <div className="mx-auto max-w-3xl space-y-8">
        {back}
        <header>
          <Badge>끝남 {data.event.finished_at ? fmtDate(data.event.finished_at) : ""}</Badge>
          <h1 className="mt-2 text-2xl font-bold">{data.event.title}</h1>
        </header>

        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-7">
          <h2 className="text-[15px] font-bold">아무도 안 적어도 정리됐어요</h2>
          <p className="mt-4 text-[22px] leading-9 font-bold md:text-[26px] md:leading-10">
            {st.sold_out_minutes != null ? (
              <>
                <span className="text-coral-ink">{minutesLabel(st.sold_out_minutes)}</span> 만에 {st.total}개 마감.
              </>
            ) : (
              <>{st.applied}명이 신청했어요.</>
            )}{" "}
            받아간 신청자 <span className="num">{st.picked}</span>명, 안 온 신청자 <span className="num">{st.no_show}</span>명
            {st.walkup ? (
              <>
                , 현장에서 <span className="num">{st.walkup}</span>개 나눔
              </>
            ) : null}
            .
          </p>
          {firstOut ? (
            <p className="mt-3 text-[14px] text-ink-2">
              먼저 끝난 메뉴는 <b className="font-semibold">{firstOut.name}</b>, {minutesLabel(firstOut.sold_out_minutes)} 만이었어요. 다음번 수량을 정할 때 같이 떠요.
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="text-[15px] font-bold">이번 행사 회고</h2>
          <p className="mt-1 text-[13px] text-ink-3">다음 사람이 알면 좋을 것 한 줄. 이름과 기수가 같이 남아요.</p>
          {notes?.length ? (
            <ul className="mt-3 space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-surface-2 px-4 py-3 text-[14px] leading-6">
                  “{n.body}” <span className="text-ink-3">— {n.author_label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {data.event.series_id ? (
            <form action={addHandoverNote.bind(null, data.event.series_id, id)} className="mt-3 flex gap-2">
              <label htmlFor="note" className="sr-only">
                한 줄 남기기
              </label>
              <input
                id="note"
                name="body"
                maxLength={300}
                placeholder="예: 치킨마요가 5분 만에 끝났어요. 다음엔 40개로 늘려보세요."
                className="h-11 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-surface px-3 text-[14px] outline-none placeholder:text-ink-4 focus:border-coral"
              />
              <Button variant="ink" size="md" className="h-11">
                남기기
              </Button>
            </form>
          ) : null}
          <p className="mt-4 flex items-center gap-1.5 text-[13px] text-ink-3">
            <FolderOpen className="size-4" />
            포스터, 영수증 같은 원본 파일은 드라이브에 두고 링크만 연결해요.
          </p>
        </section>

        {data.event.series_id ? (
          <Link href={`/manage/history/${data.event.series_id}`} className="inline-block text-[14px] font-semibold text-coral-ink hover:underline">
            같은 행사 모아보기
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {back}
      {published ? (
        <p role="status" className="rounded-xl bg-green-tint px-4 py-3 text-[14px] font-medium text-green-ink">
          공개했어요. 대상 학생의 홈과 캘린더에 바로 떠요.
        </p>
      ) : null}
      <LiveEvent
        variant="full"
        event={data.event}
        options={data.options}
        applicants={data.applicants}
        staff={data.staff}
        me={{ id: viewer.profile.id, name: viewer.profile.name }}
      />
    </div>
  );
}
