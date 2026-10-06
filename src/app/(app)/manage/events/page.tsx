import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { eventPhase, PHASE_LABEL } from "@/lib/phase";
import { Badge, ButtonLink, Empty, PageHeader, SectionTitle } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import type { EventOption, UccEvent } from "@/lib/types";

export const metadata = { title: "사업·행사" };

export default async function EventsPage() {
  const { org } = await requireOfficer();
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, options:event_options(*)")
    .eq("org_id", org.id)
    .neq("status", "finished")
    .order("created_at", { ascending: false });
  const events = (data ?? []) as (UccEvent & { options: EventOption[] })[];
  const active = events.filter((e) => e.status === "published");
  const drafts = events.filter((e) => e.status === "draft");

  return (
    <div className="space-y-10">
      <PageHeader
        title="사업·행사"
        description="진행 중인 것과 만들다 만 초안. 끝난 행사는 지난 활동에 쌓여요."
        actions={
          <ButtonLink href="/manage/events/new" variant="primary">
            <Plus />새 행사
          </ButtonLink>
        }
      />

      <section>
        <SectionTitle aside={<span className="num">{active.length}개</span>}>진행 중</SectionTitle>
        {active.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {active.map((e) => {
              const total = e.options.reduce((s, o) => s + o.quantity, 0);
              const taken = e.options.reduce((s, o) => s + o.taken, 0);
              const phase = eventPhase(e, total - taken);
              return (
                <li key={e.id}>
                  <Link href={`/manage/events/${e.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-surface-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge tone={phase === "open" ? "coral" : "outline"}>{PHASE_LABEL[phase]}</Badge>
                        <span className="truncate text-[15px] font-semibold">{e.title}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-ink-3">
                        {e.pickup_starts_at ? `${fmtDate(e.pickup_starts_at)} 배부` : e.opens_at ? fmtDate(e.opens_at) : "날짜 미정"}
                      </p>
                    </div>
                    {total ? (
                      <span className="num text-right text-[14px] font-semibold">
                        {taken}
                        <span className="text-ink-3"> / {total}</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="진행 중인 행사가 없어요" />
        )}
      </section>

      <section>
        <SectionTitle aside={<span className="num">{drafts.length}개</span>}>초안</SectionTitle>
        {drafts.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {drafts.map((e) => (
              <li key={e.id}>
                <Link href={`/manage/events/${e.id}/edit`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-surface-2">
                  <span className="truncate text-[15px] font-semibold">{e.title}</span>
                  <span className="text-[13px] text-ink-3">이어서 쓰기</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-3">초안이 없어요.</p>
        )}
      </section>
    </div>
  );
}
