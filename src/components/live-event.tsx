"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronRight, Search, Sparkles, Undo2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RollingNumber } from "@/components/rolling-number";
import { Badge, Button, buttonStyles } from "@/components/ui";
import { eventPhase, PHASE_LABEL } from "@/lib/phase";
import { ago, fmtDate, fmtTime } from "@/lib/format";
import type { EventOption, UccEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Applicant = {
  id: string;
  seq: number;
  option_id: string;
  created_at: string;
  picked_up_at: string | null;
  picked_up_by_name: string | null;
  user: { name: string; student_no: string; grade: number };
};

type Props = {
  event: UccEvent;
  options: EventOption[];
  applicants: Applicant[];
  staff: string[];
  me: { id: string; name: string };
  variant: "summary" | "full";
};

type Tab = "applied" | "pickup" | "walkup" | "finish";

export function LiveEvent({ event, options: initialOptions, applicants: initialApplicants, staff, me, variant }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [options, setOptions] = useState(initialOptions);
  const [applicants, setApplicants] = useState(initialApplicants);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("applied");
  const [, forceTick] = useState(0);
  const known = useRef(new Set(initialApplicants.map((a) => a.id)));

  // 1분마다 "3분 전" 같은 상대 시간을 다시 그린다
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`event-${event.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_options", filter: `event_id=eq.${event.id}` },
        (payload) => {
          const row = payload.new as EventOption;
          setOptions((prev) => prev.map((o) => (o.id === row.id ? { ...o, ...row } : o)));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications", filter: `event_id=eq.${event.id}` },
        async (payload) => {
          const row = payload.new as {
            id: string;
            seq: number;
            option_id: string;
            created_at: string;
            picked_up_at: string | null;
            picked_up_by: string | null;
            user_id: string;
          };
          if (!row?.id) return;
          if (known.current.has(row.id)) {
            setApplicants((prev) =>
              prev.map((a) =>
                a.id === row.id
                  ? { ...a, picked_up_at: row.picked_up_at, picked_up_by_name: row.picked_up_at ? (a.picked_up_by_name ?? "운영진") : null }
                  : a,
              ),
            );
            return;
          }
          known.current.add(row.id);
          const { data: user } = await supabase
            .from("profiles")
            .select("name, student_no, grade")
            .eq("id", row.user_id)
            .single();
          setApplicants((prev) =>
            [
              {
                id: row.id,
                seq: row.seq,
                option_id: row.option_id,
                created_at: row.created_at,
                picked_up_at: row.picked_up_at,
                picked_up_by_name: null,
                user: user ?? { name: "학생", student_no: "", grade: 0 },
              },
              ...prev,
            ].sort((a, b) => b.seq - a.seq),
          );
          setFresh((s) => new Set(s).add(row.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, supabase]);

  const total = options.reduce((s, o) => s + o.quantity, 0);
  const taken = options.reduce((s, o) => s + o.taken, 0);
  const remaining = total - taken;
  const picked = applicants.filter((a) => a.picked_up_at).length;
  const phase = eventPhase(event, remaining);
  const optionName = (id: string) => options.find((o) => o.id === id)?.name ?? "";

  const [simulating, startSimulate] = useTransition();
  function simulate() {
    startSimulate(async () => {
      const { data, error } = await supabase.rpc("demo_simulate_applications", { p_event: event.id, p_count: 3 });
      if (error) toast.error(error.message);
      else if (!data) toast("더 신청할 학생이 없거나 다 나갔어요");
    });
  }

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <PhaseBadge phase={phase} />
          {event.opens_at && phase !== "scheduled" ? (
            <span className="text-[12.5px] text-ink-3">{fmtTime(event.opens_at)}에 열림</span>
          ) : null}
        </div>
        <h2 className="mt-1.5 text-lg leading-7 font-bold md:text-xl">{event.title}</h2>
        <p className="mt-0.5 text-[13px] text-ink-3">
          {event.pickup_starts_at
            ? `${fmtDate(event.pickup_starts_at)} ${fmtTime(event.pickup_starts_at)}–${event.pickup_ends_at ? fmtTime(event.pickup_ends_at) : ""} 배부`
            : "일정 미정"}
          {staff.length ? `, 현장 담당 ${staff.join(", ")}` : ""}
        </p>
      </div>
      {variant === "summary" ? (
        <Link href={`/manage/events/${event.id}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
          운영 화면 열기
          <ChevronRight />
        </Link>
      ) : (
        <Link href={`/events/${event.id}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
          학생 화면 보기
        </Link>
      )}
    </div>
  );

  const counters = (
    <div className="mt-5 grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-[1.1fr_repeat(var(--n),1fr)]" style={{ "--n": options.length, "--cols": options.length + 1 } as React.CSSProperties}>
      <div className="min-w-0 bg-surface px-3 py-3 sm:px-4 sm:py-4">
        <p className="text-[12.5px] font-medium text-ink-3">신청</p>
        <p className="mt-1 flex items-baseline gap-1">
          <RollingNumber value={taken} className="text-[26px] leading-8 font-bold sm:text-[34px] sm:leading-10" />
          <span className="num text-[13px] font-semibold text-ink-3 sm:text-[15px]">/ {total}</span>
        </p>
        <p className="mt-1 text-[12.5px] text-ink-3">
          {picked > 0 ? `${picked}명 받아감` : remaining > 0 ? `${remaining}개 남음` : "모두 신청됐어요"}
        </p>
      </div>
      {options.map((o) => {
        const left = o.quantity - o.taken;
        const low = left > 0 && left <= Math.max(3, Math.round(o.quantity * 0.15));
        return (
          <div key={o.id} className="min-w-0 bg-surface px-3 py-3 sm:px-4 sm:py-4">
            <p className="truncate text-[12.5px] font-medium text-ink-3">{o.name}</p>
            <p className="mt-1 flex items-baseline gap-1">
              <RollingNumber
                value={left}
                className={cn("text-[26px] leading-8 font-bold sm:text-[34px] sm:leading-10", left === 0 ? "text-ink-4" : low ? "text-coral-ink" : "text-ink")}
              />
              <span className="text-[12px] font-semibold text-ink-3 sm:text-[13px]">개<span className="hidden sm:inline"> 남음</span></span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel" aria-hidden>
              <div
                className={cn("h-full rounded-full transition-[width] duration-500 ease-out", left === 0 ? "bg-ink-4" : "bg-coral")}
                style={{ width: `${(o.taken / Math.max(1, o.quantity)) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const recent = (
    <ApplicantList
      applicants={applicants.slice(0, variant === "summary" ? 6 : 200)}
      fresh={fresh}
      optionName={optionName}
      showPickup={variant === "full"}
    />
  );

  if (variant === "summary") {
    return (
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm md:p-6">
        {header}
        {counters}
        <div className="mt-5 flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-bold">
            방금 들어온 신청 <span className="num font-semibold text-ink-3">{applicants.length}</span>
          </h3>
          {phase === "open" ? (
            <Button variant="ghost" size="sm" onClick={simulate} disabled={simulating}>
              <UserPlus />
              {simulating ? "들어오는 중" : "데모: 신청 3건 더"}
            </Button>
          ) : null}
        </div>
        <div className="mt-2">{recent}</div>
      </section>
    );
  }

  return (
    <div>
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm md:p-6">
        {header}
        {counters}
      </section>

      <div role="tablist" aria-label="운영 단계" className="mt-6 flex gap-1 overflow-x-auto rounded-xl bg-panel p-1">
        {(
          [
            ["applied", `신청 ${applicants.length}`],
            ["pickup", `수령 ${picked}/${applicants.length}`],
            ["walkup", "현장 배부"],
            ["finish", "끝내기"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "num h-10 flex-1 rounded-lg px-2 text-[12.5px] font-semibold whitespace-nowrap transition-colors sm:px-3 sm:text-[13.5px]",
              tab === key ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "applied" ? (
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[13px] text-ink-3">누가 몇 번째로 들어왔는지 실시간으로 쌓여요.</p>
              {phase === "open" ? (
                <Button variant="ghost" size="sm" onClick={simulate} disabled={simulating}>
                  <UserPlus />
                  {simulating ? "들어오는 중" : "데모: 신청 3건 더"}
                </Button>
              ) : null}
            </div>
            {recent}
          </section>
        ) : null}
        {tab === "pickup" ? <PickupCheck applicants={applicants} setApplicants={setApplicants} optionName={optionName} me={me} /> : null}
        {tab === "walkup" ? <Walkup options={options} applicants={applicants} setOptions={setOptions} /> : null}
        {tab === "finish" ? (
          <Finish
            eventId={event.id}
            total={total}
            applied={applicants.length}
            picked={picked}
            walkup={options.reduce((s, o) => s + o.walkup, 0)}
            onDone={() => router.refresh()}
          />
        ) : null}
      </div>
    </div>
  );
}

export function PhaseBadge({ phase }: { phase: ReturnType<typeof eventPhase> }) {
  const tone = phase === "open" || phase === "pickup" ? "coral" : phase === "finished" ? "neutral" : phase === "leftover" ? "amber" : "outline";
  return (
    <Badge tone={tone}>
      {phase === "open" || phase === "pickup" ? <span className="size-1.5 animate-pulse rounded-full bg-coral" aria-hidden /> : null}
      {PHASE_LABEL[phase]}
    </Badge>
  );
}

function ApplicantList({
  applicants,
  fresh,
  optionName,
  showPickup,
}: {
  applicants: Applicant[];
  fresh: Set<string>;
  optionName: (id: string) => string;
  showPickup: boolean;
}) {
  if (!applicants.length) return <p className="py-6 text-center text-[13px] text-ink-3">아직 신청이 없어요.</p>;
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {applicants.map((a) => (
        <li
          key={a.id}
          className={cn("grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 bg-surface px-3 py-2.5 md:px-4", fresh.has(a.id) && "animate-row-in")}
        >
          <span className="num text-[13px] font-bold text-ink-3">{a.seq}</span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold">
              {a.user.name}
              <span className="num ml-2 text-[12.5px] font-normal text-ink-3">
                {a.user.student_no}, {a.user.grade}학년
              </span>
            </span>
          </span>
          <span className="flex items-center gap-3 text-[12.5px] text-ink-3">
            <span className="hidden text-ink-2 sm:inline">{optionName(a.option_id)}</span>
            {showPickup && a.picked_up_at ? <Badge tone="green">받음</Badge> : null}
            <span className="num w-12 text-right">{ago(a.created_at)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function PickupCheck({
  applicants,
  setApplicants,
  optionName,
  me,
}: {
  applicants: Applicant[];
  setApplicants: React.Dispatch<React.SetStateAction<Applicant[]>>;
  optionName: (id: string) => string;
  me: { id: string; name: string };
}) {
  const supabase = useMemo(() => createClient(), []);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const query = q.trim();
  const match = (a: Applicant) => !query || a.user.name.includes(query) || a.user.student_no.includes(query);
  const waiting = applicants.filter((a) => !a.picked_up_at && match(a)).sort((a, b) => a.seq - b.seq);
  const done = applicants.filter((a) => a.picked_up_at && match(a));

  async function toggle(a: Applicant, undo: boolean) {
    setBusy(a.id);
    const at = undo ? null : new Date().toISOString();
    setApplicants((prev) => prev.map((x) => (x.id === a.id ? { ...x, picked_up_at: at, picked_up_by_name: undo ? null : me.name } : x)));
    const { error } = await supabase.rpc("check_pickup", { p_application: a.id, p_undo: undo });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      setApplicants((prev) => prev.map((x) => (x.id === a.id ? a : x)));
    } else if (!undo) {
      toast.success(`${a.user.name} 수령 체크`, { description: `${fmtTime(at!)}, 확인한 사람 ${me.name}` });
    }
  }

  return (
    <section>
      <label className="relative block">
        <span className="sr-only">이름이나 학번으로 찾기</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름이나 학번으로 찾기"
          inputMode="search"
          className="h-12 w-full rounded-xl border border-line-strong bg-surface pr-4 pl-10 text-[15px] outline-none placeholder:text-ink-4 focus:border-coral"
        />
      </label>
      <p className="mt-2 text-[12.5px] text-ink-3">
        체크하면 시각과 확인한 사람이 서명 대신 남아요. 여러 임원이 각자 폰으로 체크해도 숫자는 하나로 합쳐져요.
      </p>

      <h3 className="mt-5 mb-2 text-[13.5px] font-bold">
        아직 안 받은 사람 <span className="num text-ink-3">{waiting.length}</span>
      </h3>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {waiting.map((a) => (
          <li key={a.id} className="flex items-center gap-3 bg-surface px-3 py-2 md:px-4">
            <span className="num w-8 text-[13px] font-bold text-ink-3">{a.seq}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{a.user.name}</span>
              <span className="num block text-[12.5px] text-ink-3">
                {a.user.student_no}, {optionName(a.option_id)}
              </span>
            </span>
            <Button variant="ink" size="md" className="min-w-[96px]" disabled={busy === a.id} onClick={() => toggle(a, false)}>
              <Check />
              드리고 체크
            </Button>
          </li>
        ))}
        {!waiting.length ? <li className="bg-surface px-4 py-6 text-center text-[13px] text-ink-3">{query ? "찾는 사람이 없어요." : "모두 받아갔어요."}</li> : null}
      </ul>

      {done.length ? (
        <>
          <h3 className="mt-6 mb-2 text-[13.5px] font-bold">
            받아간 사람 <span className="num text-ink-3">{done.length}</span>
          </h3>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {done.map((a) => (
              <li key={a.id} className="flex items-center gap-3 bg-surface-2 px-3 py-2 md:px-4">
                <span className="num w-8 text-[13px] font-bold text-ink-4">{a.seq}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink-2">{a.user.name}</span>
                  <span className="num block text-[12px] text-ink-3">
                    {fmtTime(a.picked_up_at!)} 받음{a.picked_up_by_name ? `, 확인 ${a.picked_up_by_name}` : ""}
                  </span>
                </span>
                <Button variant="ghost" size="sm" disabled={busy === a.id} onClick={() => toggle(a, true)}>
                  <Undo2 />
                  취소
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function Walkup({
  options,
  applicants,
  setOptions,
}: {
  options: EventOption[];
  applicants: Applicant[];
  setOptions: React.Dispatch<React.SetStateAction<EventOption[]>>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const noShow = applicants.filter((a) => !a.picked_up_at).length;

  async function give(o: EventOption) {
    setBusy(o.id);
    setOptions((prev) => prev.map((x) => (x.id === o.id ? { ...x, walkup: x.walkup + 1 } : x)));
    const { error } = await supabase.rpc("give_walkup", { p_option: o.id });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      setOptions((prev) => prev.map((x) => (x.id === o.id ? o : x)));
    }
  }

  return (
    <section>
      <p className="text-[13.5px] leading-6 text-ink-2">
        수령 시간이 끝나면 남은 건 누구나 한 사람당 1개. 이름을 찾지 않고 줄 때마다 숫자만 줄여요. 지금 안 온 신청자{" "}
        <b className="num font-semibold text-ink">{noShow}명</b>의 몫이 남아 있어요.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const pickedHere = applicants.filter((a) => a.option_id === o.id && a.picked_up_at).length;
          const left = Math.max(0, o.quantity - pickedHere - o.walkup);
          return (
            <li key={o.id} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[14px] font-semibold">{o.name}</p>
              <p className="mt-1 flex items-baseline gap-1">
                <RollingNumber value={left} className="text-[30px] leading-9 font-bold" />
                <span className="text-[13px] font-semibold text-ink-3">개 남음</span>
                {o.walkup ? <span className="num ml-auto text-[12.5px] text-ink-3">현장 {o.walkup}개 줌</span> : null}
              </p>
              <Button variant="ink" size="lg" block className="mt-3" disabled={!left || busy === o.id} onClick={() => give(o)}>
                1개 줬어요
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Finish({
  eventId,
  total,
  applied,
  picked,
  walkup,
  onDone,
}: {
  eventId: string;
  total: number;
  applied: number;
  picked: number;
  walkup: number;
  onDone: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [pending, start] = useTransition();
  function finish() {
    start(async () => {
      const { error } = await supabase.rpc("finish_event", { p_event: eventId });
      if (error) toast.error(error.message);
      else {
        toast.success("행사를 끝냈어요. 기록에 들어갔어요.");
        onDone();
      }
    });
  }
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h3 className="text-[15px] font-bold">끝내면 아무도 안 적어도 정리돼요</h3>
      <p className="mt-1 text-[13.5px] leading-6 text-ink-2">
        신청, 수령 체크, 현장 배부 기록에서 숫자를 뽑아 간식행사 기록에 넣어요. 다음 간식행사를 만들 때 이 숫자가 같이 떠요.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["준비", total],
          ["신청", applied],
          ["받아감", picked],
          ["현장 배부", walkup],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-lg bg-surface-2 px-3 py-2.5">
            <dt className="text-[12px] text-ink-3">{k}</dt>
            <dd className="num text-lg font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[13px] text-ink-3">안 온 신청자 {Math.max(0, applied - picked)}명은 기록에 따로 남아요.</p>
      <Button variant="primary" size="lg" className="mt-5" onClick={finish} disabled={pending}>
        <Sparkles />
        {pending ? "정리하는 중" : "행사 끝내기"}
      </Button>
    </section>
  );
}
