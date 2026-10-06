import { CalendarClock, Gift, Megaphone, Ticket } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { cloneEvent, createBlankEvent } from "@/app/actions/manage";
import { PageHeader, SectionTitle } from "@/components/ui";
import { fmtDate, minutesLabel, msAgo, semesterLabel } from "@/lib/format";
import type { EventStats, Series, UccEvent } from "@/lib/types";

export const metadata = { title: "새 행사" };

export default async function NewEvent() {
  const { org } = await requireOfficer();
  const supabase = await createClient();
  const [{ data: series }, { data: finished }] = await Promise.all([
    supabase.from("event_series").select("*").eq("org_id", org.id).order("sort"),
    supabase.from("events").select("*").eq("org_id", org.id).eq("status", "finished").order("finished_at", { ascending: false }),
  ]);
  const past = (finished ?? []) as UccEvent[];
  const latestBySeries = new Map<string, UccEvent>();
  for (const e of past) if (e.series_id && !latestBySeries.has(e.series_id)) latestBySeries.set(e.series_id, e);

  // 작년 이맘때 끝난 것 하나를 맨 위에
  const yearAgo = msAgo(365);
  const lastYear = past
    .filter((e) => e.finished_at && Math.abs(new Date(e.finished_at).getTime() - yearAgo) < 75 * 86_400_000 && e.kind === "giveaway")
    .at(0);
  const recentGiveaway = past.find((e) => e.kind === "giveaway");
  const lead = recentGiveaway ?? lastYear;
  const leadStats = (lead?.stats ?? {}) as EventStats;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHeader title="무엇을 만들까요?" description="지난번 걸 가져오면 날짜랑 내용만 바꾸면 돼요." />

      {lead ? (
        <section>
          <SectionTitle>지난번 한 것에서 시작</SectionTitle>
          <form action={cloneEvent.bind(null, lead.id)}>
            <SubmitButton className="group block w-full rounded-2xl border-2 border-coral bg-surface p-5 text-left shadow-sm transition-[transform,box-shadow] duration-150 hover:shadow-md active:translate-y-px">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-bold">{lead.title.replace(/^\d{4}\s*(\d학기\s*)?/, "")}</p>
                  <p className="mt-1 text-[13.5px] text-ink-3">
                    최근 {semesterLabel(lead.semester)}, {lead.finished_at ? fmtDate(lead.finished_at) : ""}
                    {lastYear && lastYear.id !== lead.id ? ` · 작년엔 ${fmtDate(lastYear.finished_at!)}에 했어요` : ""}
                  </p>
                  {leadStats.sold_out_minutes ? (
                    <p className="mt-3 text-[14px] text-ink-2">
                      {leadStats.options?.map((o) => `${o.name} ${o.quantity}개`).join(", ")}
                      {" · "}
                      <b className="font-semibold text-ink">{minutesLabel(leadStats.sold_out_minutes)}</b> 만에 마감 · 안 온 신청자{" "}
                      <span className="num">{leadStats.no_show}</span>명
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-[10px] bg-coral px-4 py-2.5 text-[14px] font-semibold text-white group-hover:bg-coral-deep">
                  이걸로 시작하기
                </span>
              </div>
            </SubmitButton>
          </form>
        </section>
      ) : null}

      <section>
        <SectionTitle aside={<span className="num">{(series ?? []).length}개</span>}>우리 양식</SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {((series ?? []) as Series[]).map((s) => {
            const last = latestBySeries.get(s.id);
            return (
              <li key={s.id}>
                <form action={last ? cloneEvent.bind(null, last.id) : createBlankEvent.bind(null, s.name, s.kind)}>
                  <SubmitButton className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-left hover:border-ink-4">
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold">{s.name}</span>
                      <span className="block truncate text-[12.5px] text-ink-3">
                        {last ? `마지막 ${semesterLabel(last.semester)}` : "아직 기록 없음"}
                      </span>
                    </span>
                    <span className="text-[12.5px] font-semibold text-ink-3">가져오기</span>
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionTitle>처음 하는 일</SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            { name: "", label: "나눠주기", ex: "간식행사처럼 선착순으로 나눠줘요", icon: Gift, kind: "giveaway" as const },
            { name: "", label: "참가 신청", ex: "개강파티처럼 신청만 받아요", icon: Ticket, kind: "signup" as const },
            { name: "", label: "자리 배정", ex: "사물함 배정처럼 칸을 나눠요", icon: CalendarClock, kind: "signup" as const },
            { name: "", label: "알리기만", ex: "신청 없이 일정만 알려요", icon: Megaphone, kind: "notice" as const },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <li key={t.label}>
                <form action={createBlankEvent.bind(null, t.name, t.kind)}>
                  <SubmitButton className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-left hover:border-ink-4 hover:bg-surface">
                    <Icon className="size-[18px] shrink-0 text-ink-3" />
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold">{t.label}</span>
                      <span className="block text-[12.5px] text-ink-3">{t.ex}</span>
                    </span>
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
