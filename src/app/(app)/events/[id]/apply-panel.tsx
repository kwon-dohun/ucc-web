"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, BellRing, CalendarPlus, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RollingNumber } from "@/components/rolling-number";
import { Badge, Button } from "@/components/ui";
import { eventPhase } from "@/lib/phase";
import { fmtDate, fmtTime } from "@/lib/format";
import type { EventOption, UccEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mine = { seq: number; option_id: string; picked_up_at: string | null; created_at: string } | null;

export function ApplyPanel({
  event,
  orgTitle,
  orgShort,
  options: initial,
  mine: initialMine,
  eligible,
  me,
}: {
  event: UccEvent;
  orgTitle: string;
  orgShort: string;
  options: EventOption[];
  mine: Mine;
  eligible: boolean;
  me: { name: string; line: string };
}) {
  const supabase = useMemo(() => createClient(), []);
  const [options, setOptions] = useState(initial);
  const [mine, setMine] = useState<Mine>(initialMine);
  const [picked, setChoice] = useState<string | null>(initial.length === 1 ? initial[0].id : null);
  const [now, setNow] = useState(() => Date.now());
  const [pending, start] = useTransition();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel(`apply-${event.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_options", filter: `event_id=eq.${event.id}` },
        (p) => setOptions((prev) => prev.map((o) => (o.id === (p.new as EventOption).id ? { ...o, ...(p.new as EventOption) } : o))),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [event.id, supabase]);

  const total = options.reduce((s, o) => s + o.quantity, 0);
  const taken = options.reduce((s, o) => s + o.taken, 0);
  const phase = eventPhase(event, total - taken, now);
  const pickedOption = options.find((o) => o.id === picked);
  // 고른 메뉴가 그사이 다 나가면 선택을 푼다
  const choice = pickedOption && pickedOption.taken < pickedOption.quantity ? picked : null;
  const chosen = choice ? pickedOption : undefined;
  const applied = mine ? options.find((o) => o.id === mine.option_id) : null;

  function apply() {
    if (!choice) return;
    start(async () => {
      const { data, error } = await supabase.rpc("apply_event", { p_event: event.id, p_option: choice });
      if (error) return void toast.error(error.message);
      setMine({ seq: data as number, option_id: choice, picked_up_at: null, created_at: new Date().toISOString() });
    });
  }

  const info = (
    <dl className="grid grid-cols-[4.25rem_1fr] gap-x-3 gap-y-2 text-[14px] leading-6">
      <dt className="text-ink-3">받는 날</dt>
      <dd className="font-medium">
        {event.pickup_starts_at ? `${fmtDate(event.pickup_starts_at)} ${fmtTime(event.pickup_starts_at)} – ${event.pickup_ends_at ? fmtTime(event.pickup_ends_at) : ""}` : "미정"}
      </dd>
      <dt className="text-ink-3">장소</dt>
      <dd className="font-medium">{event.location}</dd>
      <dt className="text-ink-3">대상</dt>
      <dd className="font-medium">{event.audience === "department" ? "ITM전공, 학생회비 상관없이" : event.audience === "college" ? "기술경영융합대학" : "누구나"}</dd>
      <dt className="text-ink-3">수량</dt>
      <dd className="font-medium">한 사람당 {event.per_person}개</dd>
    </dl>
  );

  // 신청 완료
  if (mine && applied) {
    return (
      <Shell orgShort={orgShort}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-7">
          <CheckCircle2 className="size-8 text-green" />
          <h1 className="mt-3 text-[24px] leading-9 font-bold">신청됐어요</h1>
          <p className="mt-1 text-[16px] text-ink-2">
            {applied.name}, <b className="num font-bold text-ink">{mine.seq}번째</b>로 신청했어요
          </p>
          {mine.picked_up_at ? (
            <p className="mt-4 rounded-xl bg-green-tint px-4 py-3 text-[14px] font-medium text-green-ink">{fmtTime(mine.picked_up_at)}에 받아갔어요.</p>
          ) : (
            <div className="mt-6 rounded-xl bg-surface-2 p-4">
              <p className="text-[15px] leading-7 font-semibold">
                {event.pickup_starts_at ? `${fmtDate(event.pickup_starts_at)} ${fmtTime(event.pickup_starts_at)}` : ""}
                {event.pickup_ends_at ? `, ${fmtTime(event.pickup_ends_at)}까지 ` : " "}
                {event.location}
              </p>
              <p className="mt-1 text-[14px] leading-6 text-ink-2">학생회실에서 이름이나 학번을 말하면 돼요.</p>
              {event.pickup_ends_at ? (
                <p className="mt-1 text-[13px] text-ink-3">{fmtTime(event.pickup_ends_at)}까지 안 오면 남은 간식은 다른 학생에게 가요.</p>
              ) : null}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/calendar" className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-4 text-[14px] font-semibold hover:border-ink-4">
              <CalendarPlus className="size-4" />
              캘린더에서 보기
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] text-ink-3">신청 취소는 없어요.</p>
        </div>
      </Shell>
    );
  }

  if (event.kind !== "giveaway") {
    return (
      <Shell orgShort={orgShort}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-7">
          <p className="text-[13px] text-ink-3">{orgTitle}</p>
          <h1 className="mt-1 text-[22px] leading-8 font-bold">{event.title}</h1>
          <dl className="mt-5 grid grid-cols-[4.25rem_1fr] gap-x-3 gap-y-2 text-[14px] leading-6">
            <dt className="text-ink-3">언제</dt>
            <dd className="font-medium">{event.opens_at ? fmtDate(event.opens_at) : "날짜 미정"}</dd>
            <dt className="text-ink-3">장소</dt>
            <dd className="font-medium">{event.location ?? "확인 중"}</dd>
          </dl>
          <p className="mt-5 text-[13.5px] text-ink-3">
            {event.status === "finished" ? "끝난 행사예요." : "신청 없이 알리는 일정이에요. 자세한 내용은 학생회가 정해지는 대로 올려요."}
          </p>
        </div>
      </Shell>
    );
  }

  const opensIn = event.opens_at ? new Date(event.opens_at).getTime() - now : 0;

  return (
    <Shell orgShort={orgShort}>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-7">
        <p className="text-[13px] text-ink-3">{orgTitle}</p>
        <h1 className="mt-1 text-[22px] leading-8 font-bold">{event.title}</h1>
        {event.greeting ? <p className="mt-2 text-[14.5px] leading-6 text-ink-2">{event.greeting}</p> : null}

        {phase === "scheduled" ? (
          <div className="mt-5 rounded-xl bg-surface-2 p-4">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-3">
              <Clock className="size-4" />
              신청 열리는 시간
            </p>
            <p className="mt-1 text-[20px] font-bold">{event.opens_at ? `${fmtDate(event.opens_at)} ${fmtTime(event.opens_at)}` : ""}</p>
            <p className="num mt-0.5 text-[14px] font-semibold text-coral-ink">{countdown(opensIn)} 남았어요</p>
            <p className="mt-2 text-[13px] text-ink-3">선착순 {total}개</p>
          </div>
        ) : null}

        {phase === "open" || phase === "soldout" ? (
          <p className={cn("mt-5 text-[14px] font-semibold", phase === "open" ? "text-coral-ink" : "text-ink-3")}>
            {phase === "open" ? (
              <>
                {event.opens_at ? `${fmtTime(event.opens_at)}에 열렸어요, ` : ""}지금 <span className="num">{taken}</span>명 신청
              </>
            ) : (
              `신청이 마감됐어요. ${total}개가 모두 신청됐어요`
            )}
          </p>
        ) : null}

        {phase !== "finished" ? (
          <section className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[14px] font-bold">{options.length > 1 ? "메뉴 고르기" : "메뉴"}</h2>
              {phase === "open" ? <Badge tone="coral">실시간</Badge> : null}
            </div>
            <ul className="space-y-2" role={options.length > 1 ? "radiogroup" : undefined} aria-label="메뉴">
              {options.map((o) => {
                const left = o.quantity - o.taken;
                const out = left <= 0;
                const low = !out && left <= Math.max(3, Math.round(o.quantity * 0.2));
                const selectable = phase === "open" && !out && eligible;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      role={options.length > 1 ? "radio" : undefined}
                      aria-checked={options.length > 1 ? choice === o.id : undefined}
                      disabled={!selectable}
                      onClick={() => setChoice(o.id)}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-xl px-4 text-left transition-colors",
                        choice === o.id ? "border-2 border-ink bg-surface" : "border border-line bg-surface",
                        selectable && choice !== o.id && "hover:border-ink-4",
                        out && "bg-surface-2",
                      )}
                    >
                      <span className={cn("flex-1 text-[15.5px] font-semibold", out && "text-ink-4 line-through")}>{o.name}</span>
                      {event.show_remaining ? (
                        <span className="flex items-baseline gap-0.5">
                          <RollingNumber value={Math.max(0, left)} className={cn("text-[22px] font-bold", out ? "text-ink-4" : low ? "text-coral-ink" : "text-ink")} />
                          <span className="text-[13px] font-semibold text-ink-3">개 남음</span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {phase === "soldout" && event.leftovers_open && event.pickup_ends_at ? (
          <div className="mt-4 rounded-xl bg-green-tint px-4 py-3">
            <p className="text-[14px] font-semibold text-green-ink">그래도 받을 수 있어요</p>
            <p className="mt-0.5 text-[13.5px] leading-6 text-ink-2">
              {fmtDate(event.pickup_ends_at)} {fmtTime(event.pickup_ends_at)}부터 남은 간식은 누구나 한 사람당 1개씩 받을 수 있어요.
            </p>
          </div>
        ) : null}

        <div className="mt-6 border-t border-line pt-5">{info}</div>

        {phase === "open" ? (
          <div className="mt-6">
            {eligible ? (
              <>
                <p className="mb-2 text-[13px] text-ink-3">
                  <b className="font-semibold text-ink">{me.name}</b>, {me.line} 정보로 신청돼요
                </p>
                <Button variant="primary" size="lg" block onClick={apply} disabled={!choice || pending}>
                  {pending ? "신청하는 중" : chosen ? `${chosen.name} 신청하기` : "메뉴를 골라주세요"}
                </Button>
              </>
            ) : (
              <p className="rounded-xl bg-surface-2 px-4 py-3 text-[14px] text-ink-2">이 행사는 ITM전공 학생만 신청할 수 있어요.</p>
            )}
          </div>
        ) : phase === "scheduled" ? (
          <Button variant="secondary" size="lg" block className="mt-6" disabled>
            <BellRing />
            {event.opens_at ? `${fmtTime(event.opens_at)}에 열려요` : "곧 열려요"}
          </Button>
        ) : phase === "finished" ? (
          <p className="mt-6 text-[14px] text-ink-3">끝난 행사예요.</p>
        ) : null}
      </div>
    </Shell>
  );
}

function Shell({ orgShort, children }: { orgShort: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/org" className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-3.5" />
        {orgShort} 학생회
      </Link>
      {children}
    </div>
  );
}

function countdown(ms: number) {
  if (ms <= 0) return "곧";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}일 ${h}시간`;
  if (h) return `${h}시간 ${m}분`;
  return `${m}분 ${s % 60}초`;
}
