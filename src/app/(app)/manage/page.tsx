import Link from "next/link";
import { ChevronRight, CornerDownRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { loadEventConsole } from "@/lib/events";
import { LiveEvent } from "@/components/live-event";
import { Badge, ButtonLink, Empty, PageHeader, SectionTitle } from "@/components/ui";
import { answerSuggestion, cloneEvent } from "@/app/actions/manage";
import { daysOverdue, fmtDate, minutesLabel, msAgo, semesterLabel } from "@/lib/format";
import type { EventStats, Series, UccEvent } from "@/lib/types";

export const metadata = { title: "운영 홈" };

export default async function ManageHome() {
  const { org, viewer, membership, orgTitle } = await requireOfficer();
  const supabase = await createClient();

  const [{ data: events }, { data: series }, { data: overdue }, { data: waiting }] = await Promise.all([
    supabase.from("events").select("*").eq("org_id", org.id).order("finished_at", { ascending: false, nullsFirst: true }),
    supabase.from("event_series").select("*").eq("org_id", org.id).order("sort"),
    supabase
      .from("rentals")
      .select("id, qty, lent_at, item:rental_items(name)")
      .eq("org_id", org.id)
      .is("returned_at", null)
      .lt("lent_at", new Date(msAgo(1)).toISOString())
      .order("lent_at"),
    supabase.from("suggestions").select("*").eq("org_id", org.id).is("answer", null).order("created_at"),
  ]);

  const all = (events ?? []) as UccEvent[];
  const live = all.find((e) => e.status === "published" && e.kind === "giveaway");
  const drafts = all.filter((e) => e.status === "draft");
  const upcoming = all.filter((e) => e.status === "published" && e.kind !== "giveaway");
  const finished = all.filter((e) => e.status === "finished");
  const liveData = live ? await loadEventConsole(live.id) : null;

  // 작년 이맘때: 1년 전 오늘 기준 한 달 전부터 두 달 뒤까지 끝난 행사. 날짜만 보는 규칙이라 AI가 아니다
  const yearAgo = msAgo(365);
  const seriesById = new Map(((series ?? []) as Series[]).map((s) => [s.id, s]));
  const seen = new Set<string>();
  const suggestions = finished
    .filter((e) => {
      if (!e.finished_at || !e.series_id || seen.has(e.series_id)) return false;
      const t = new Date(e.finished_at).getTime();
      const hit = t > yearAgo - 30 * 86_400_000 && t < yearAgo + 70 * 86_400_000;
      if (hit) seen.add(e.series_id);
      return hit;
    })
    .sort((a, b) => new Date(a.finished_at!).getTime() - new Date(b.finished_at!).getTime())
    .slice(0, 3)
    .map((e) => ({ series: seriesById.get(e.series_id!)!, last: e }));

  const todo = [
    overdue?.length ? { href: "/manage/rental", text: `1일 넘게 반납 안 된 대여 ${overdue.length}건`, tone: "coral" as const } : null,
    waiting?.length ? { href: "#suggestions", text: `답을 기다리는 건의 ${waiting.length}개`, tone: "neutral" as const } : null,
    drafts.length ? { href: `/manage/events/${drafts[0].id}/edit`, text: `만들다 만 초안 ${drafts.length}개`, tone: "neutral" as const } : null,
  ].filter(Boolean) as { href: string; text: string; tone: "coral" | "neutral" }[];

  return (
    <div className="space-y-10">
      <PageHeader
        title={`${viewer.profile.name}님, 오늘 챙길 게 ${todo.length ? `${todo.length}가지 있어요` : "없어요"}`}
        description={`${orgTitle} · ${membership.title}`}
      />

      {todo.length ? (
        <ul className="-mt-6 flex flex-wrap gap-2">
          {todo.map((t) => (
            <li key={t.text}>
              <Link
                href={t.href}
                className={
                  t.tone === "coral"
                    ? "inline-flex h-9 items-center gap-1 rounded-full bg-coral-tint px-3.5 text-[13px] font-semibold text-coral-ink hover:bg-coral-line/50"
                    : "inline-flex h-9 items-center gap-1 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink-2 hover:border-ink-4"
                }
              >
                {t.text}
                <ChevronRight className="size-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {liveData ? (
        <LiveEvent
          variant="summary"
          event={liveData.event}
          options={liveData.options}
          applicants={liveData.applicants}
          staff={liveData.staff}
          me={{ id: viewer.profile.id, name: viewer.profile.name }}
        />
      ) : (
        <Empty
          title="지금 신청 받는 행사가 없어요"
          body="작년에 한 행사를 가져오면 날짜와 메뉴만 바꾸면 돼요."
          action={
            <ButtonLink href="/manage/events/new" variant="primary">
              새 행사 만들기
            </ButtonLink>
          }
        />
      )}

      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <section>
          <SectionTitle aside={<Link href="/manage/history" className="hover:text-ink">지난 활동 전체</Link>}>
            작년 이맘때 한 것
          </SectionTitle>
          {suggestions.length ? (
            <ul className="space-y-3">
              {suggestions.map(({ series: s, last }) => {
                const st = (last!.stats ?? {}) as EventStats;
                return (
                  <li key={s.id} className="rounded-xl border border-line bg-surface p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold">{s.name}</p>
                        <p className="mt-1 text-[13px] leading-5 text-ink-3">
                          작년엔 {fmtDate(last.finished_at!)}에 했어요 · {semesterLabel(last.semester)} {last.title.replace(/^\d{4}\s*(\d학기\s*)?/, "")}
                        </p>
                        {st.sold_out_minutes ? (
                          <p className="mt-2 text-[13.5px] text-ink-2">
                            <span className="num">{st.total}</span>개가 <b className="font-semibold text-ink">{minutesLabel(st.sold_out_minutes)}</b> 만에 마감,
                            안 온 신청자 <span className="num">{st.no_show}</span>명
                          </p>
                        ) : null}
                      </div>
                      <form action={cloneEvent.bind(null, last!.id)}>
                        <button className="inline-flex h-9 items-center rounded-[10px] bg-ink px-3.5 text-[13px] font-semibold text-white hover:bg-ink-2">
                          이걸로 시작하기
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-[13px] text-ink-3">
              이번 달과 다음 달에 하던 행사는 모두 만들었어요.
            </p>
          )}

          <SectionTitle className="mt-10">다가오는 일정</SectionTitle>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-[14px] font-semibold">{e.title}</span>
                <span className="text-[13px] text-ink-3">{e.opens_at ? fmtDate(e.opens_at) : "날짜 미정"}</span>
              </li>
            ))}
            {drafts.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link href={`/manage/events/${e.id}/edit`} className="flex items-center gap-2 text-[14px] font-semibold hover:underline">
                  {e.title}
                  <Badge tone="outline">초안</Badge>
                </Link>
                <span className="text-[13px] text-ink-3">이어서 쓰기</span>
              </li>
            ))}
            {!upcoming.length && !drafts.length ? <li className="px-4 py-4 text-[13px] text-ink-3">다가오는 일정이 없어요.</li> : null}
          </ul>
        </section>

        <section id="suggestions" className="scroll-mt-20">
          <SectionTitle aside="답하면 학생회 페이지에 올라가요">답을 기다리는 건의</SectionTitle>
          {waiting?.length ? (
            <ul className="space-y-3">
              {waiting.map((s) => (
                <li key={s.id} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-[14px] leading-6 font-medium">{s.body}</p>
                  <p className="mt-0.5 text-[12px] text-ink-3">익명, {fmtDate(s.created_at)}</p>
                  <form action={answerSuggestion.bind(null, s.id)} className="mt-3 flex gap-2">
                    <label className="sr-only" htmlFor={`a-${s.id}`}>
                      답변
                    </label>
                    <input
                      id={`a-${s.id}`}
                      name="answer"
                      placeholder="답변 쓰기"
                      className="h-10 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-surface px-3 text-[14px] outline-none placeholder:text-ink-4 focus:border-coral"
                    />
                    <button className="h-10 shrink-0 rounded-[10px] bg-panel px-3.5 text-[13px] font-semibold text-ink-2 hover:bg-line hover:text-ink">
                      답하기
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-[13px] text-ink-3">모든 건의에 답했어요.</p>
          )}

          {overdue?.length ? (
            <>
              <SectionTitle className="mt-10" aside={<Link href="/manage/rental" className="hover:text-ink">대여 관리</Link>}>
                반납이 늦은 대여
              </SectionTitle>
              <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
                {(overdue as unknown as { id: string; qty: number; lent_at: string; item: { name: string } | null }[]).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
                    <span className="flex items-center gap-2">
                      <CornerDownRight className="size-3.5 text-ink-4" />
                      {r.item?.name} {r.qty}개
                    </span>
                    <span className="num font-semibold text-coral-ink">{daysOverdue(r.lent_at)}일 지남</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
