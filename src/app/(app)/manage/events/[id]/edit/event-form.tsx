"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, CornerDownLeft, Plus, Trash2, X } from "lucide-react";
import { saveEvent, deleteDraft, type SaveState } from "@/app/actions/manage";
import { Badge, Button } from "@/components/ui";
import { dayKey, fmtDate, minutesLabel, semesterLabel } from "@/lib/format";
import type { EventOption, EventStats, UccEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  orgTitle: string;
  orgRoom: string | null;
  event: UccEvent;
  options: EventOption[];
  source: { title: string; pickupStart: string; pickupEnd: string; openTime: string; options: string } | null;
  past: { id: string; title: string; semester: string; stats: EventStats | null }[];
  officers: { id: string; name: string; title: string; unit: string }[];
  staff: string[];
};

const AUDIENCE = [
  ["department", "우리 학과"],
  ["college", "단과대"],
  ["all", "학교 전체"],
] as const;

export function EventForm({ orgTitle, orgRoom, event, options, source, past, officers, staff: initialStaff }: Props) {
  const [pickupDate, setPickupDate] = useState(event.pickup_starts_at ? dayKey(event.pickup_starts_at) : "");
  const [pickupStart, setPickupStart] = useState(source?.pickupStart ?? "18:30");
  const [pickupEnd, setPickupEnd] = useState(source?.pickupEnd ?? "19:00");
  const [openDate, setOpenDate] = useState(event.opens_at ? dayKey(event.opens_at) : "");
  const [openTime, setOpenTime] = useState(source?.openTime ?? "18:00");
  const [location, setLocation] = useState(event.location ?? orgRoom ?? "");
  const [menus, setMenus] = useState(
    options.length ? options.map((o) => ({ name: o.name, qty: o.quantity })) : [{ name: "", qty: 60 }],
  );
  const [audience, setAudience] = useState(event.audience);
  const [perPerson, setPerPerson] = useState(event.per_person);
  const [staff, setStaff] = useState<string[]>(initialStaff);
  const [greeting, setGreeting] = useState(event.greeting ?? "");
  const [title, setTitle] = useState(event.title);
  const [staffOpen, setStaffOpen] = useState(false);

  const [saveState, saveAction, saving] = useActionState<SaveState, FormData>(saveEvent.bind(null, event.id, false), { ok: true });
  const [pubState, publishAction, publishing] = useActionState<SaveState, FormData>(saveEvent.bind(null, event.id, true), {
    ok: true,
  });

  const giveaway = event.kind === "giveaway";
  const total = menus.reduce((s, m) => s + (Number(m.qty) || 0), 0);
  const blanks = [
    !pickupDate && "수령 날짜",
    !openDate && "신청 열리는 날",
    giveaway && menus.some((m) => !m.name.trim()) && "메뉴 이름",
    giveaway && !staff.length && "현장 담당",
  ].filter(Boolean) as string[];

  const audienceText = audience === "department" ? "ITM전공 학우 모두" : audience === "college" ? "기술경영융합대학 학생 모두" : "서울과기대 학생 누구나";
  const staffNames = useMemo(() => officers.filter((o) => staff.includes(o.id)).map((o) => o.name), [officers, staff]);

  return (
    <form className="pb-28">
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="greeting" value={greeting} />
      <input type="hidden" name="location" value={location} />
      <input type="hidden" name="audience" value={audience} />
      <input type="hidden" name="per_person" value={perPerson} />
      <input type="hidden" name="pickup_date" value={pickupDate} />
      <input type="hidden" name="pickup_start" value={pickupStart} />
      <input type="hidden" name="pickup_end" value={pickupEnd} />
      <input type="hidden" name="open_date" value={openDate} />
      <input type="hidden" name="open_time" value={openTime} />
      <input type="hidden" name="show_remaining" value="on" />
      <input type="hidden" name="leftovers_open" value="on" />
      {(giveaway ? menus : []).map((m, i) => (
        <span key={i}>
          <input type="hidden" name="option_name" value={m.name} />
          <input type="hidden" name="option_qty" value={m.qty} />
        </span>
      ))}
      {staff.map((s) => (
        <input key={s} type="hidden" name="staff" value={s} />
      ))}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] text-ink-3">{orgTitle}</p>
          <input
            aria-label="행사 이름"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full max-w-xl rounded-lg bg-transparent text-[22px] leading-8 font-bold outline-none hover:bg-surface focus:bg-surface md:text-2xl"
          />
          {source ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-3">
              <CornerDownLeft className="size-3.5" />
              {source.title}에서 가져왔어요. 회색 글씨는 지난번 값 그대로예요.
            </p>
          ) : null}
        </div>
        <Badge tone={blanks.length ? "coral" : "green"}>{blanks.length ? `채울 칸 ${blanks.length}` : "다 채웠어요"}</Badge>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <Group title="수령">
            <Row label="날짜">
              <Blank filled={!!pickupDate}>
                <input
                  type="date"
                  aria-label="수령 날짜"
                  value={pickupDate}
                  onChange={(e) => {
                    setPickupDate(e.target.value);
                    if (!openDate && e.target.value) {
                      const d = new Date(`${e.target.value}T12:00:00+09:00`);
                      d.setUTCDate(d.getUTCDate() - 7);
                      setOpenDate(dayKey(d));
                    }
                  }}
                  className="h-full w-full bg-transparent px-3 outline-none"
                />
              </Blank>
            </Row>
            <Row label="시간" hint="자주 쓰는 시간">
              <Carried>
                <input aria-label="수령 시작" type="time" value={pickupStart} onChange={(e) => setPickupStart(e.target.value)} className="w-[7.25rem] bg-transparent outline-none" />
                <span className="text-ink-4">–</span>
                <input aria-label="수령 끝" type="time" value={pickupEnd} onChange={(e) => setPickupEnd(e.target.value)} className="w-[7.25rem] bg-transparent outline-none" />
              </Carried>
            </Row>
            <Row label="장소" hint="자주 쓰는 곳">
              <Carried>
                <input aria-label="장소" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-transparent outline-none" />
              </Carried>
            </Row>
          </Group>

          {giveaway ? (
          <Group title="메뉴" aside={source?.options ? `지난번 메뉴는 ${source.options}였어요` : undefined}>
            <ul className="space-y-2">
              {menus.map((m, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Blank filled={!!m.name.trim()}>
                      <input
                        aria-label={`메뉴 ${i + 1} 이름`}
                        value={m.name}
                        placeholder="메뉴 이름"
                        onChange={(e) => setMenus((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                        className="h-full w-full bg-transparent px-3 outline-none placeholder:text-coral-ink/60"
                      />
                    </Blank>
                  </div>
                  <label className="flex h-11 items-center gap-1 rounded-[10px] border border-line bg-surface-2 px-3 text-[14px] text-ink-2">
                    <input
                      aria-label={`메뉴 ${i + 1} 수량`}
                      type="number"
                      min={0}
                      value={m.qty}
                      onChange={(e) => setMenus((prev) => prev.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))}
                      className="num w-14 bg-transparent text-right outline-none"
                    />
                    개
                  </label>
                  {menus.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`메뉴 ${i + 1} 빼기`}
                      onClick={() => setMenus((prev) => prev.filter((_, j) => j !== i))}
                      className="grid size-11 place-items-center rounded-[10px] text-ink-3 hover:bg-panel hover:text-ink"
                    >
                      <X className="size-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setMenus((prev) => {
                    const half = Math.max(1, Math.round((prev[0]?.qty ?? 60) / 2));
                    return prev.length === 1 ? [{ ...prev[0], qty: half }, { name: "", qty: half }] : [...prev, { name: "", qty: 30 }];
                  })
                }
              >
                <Plus />
                메뉴 추가
              </Button>
              <p className="text-[13px] text-ink-3">
                총 <b className="num font-semibold text-ink">{total}</b>개, 한 사람당{" "}
                <input
                  aria-label="한 사람당 개수"
                  type="number"
                  min={1}
                  value={perPerson}
                  onChange={(e) => setPerPerson(Number(e.target.value) || 1)}
                  className="num w-8 rounded bg-surface-2 text-center text-ink outline-none"
                />
                개
              </p>
            </div>
            {menus.length > 1 ? <p className="mt-2 text-[12.5px] text-ink-3">메뉴가 두 개 이상이면 학생 화면에 “메뉴 고르기”가 생겨요.</p> : null}
          </Group>
          ) : null}

          <Group title="신청">
            <Row label="열리는 때">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-44">
                  <Blank filled={!!openDate}>
                    <input
                      type="date"
                      aria-label="신청 열리는 날"
                      value={openDate}
                      onChange={(e) => setOpenDate(e.target.value)}
                      className="h-full w-full bg-transparent px-3 outline-none"
                    />
                  </Blank>
                </div>
                <Carried>
                  <input aria-label="신청 열리는 시간" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="w-[7.25rem] bg-transparent outline-none" />
                </Carried>
              </div>
            </Row>
            <Row label="공개 범위">
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="공개 범위">
                {AUDIENCE.map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={audience === v}
                    onClick={() => setAudience(v)}
                    className={cn(
                      "h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
                      audience === v ? "bg-ink text-white" : "border border-line-strong bg-surface text-ink-2 hover:border-ink-4",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="방식">
              <p className="text-[14px] text-ink-2">선착순, 학생에게 남은 개수 실시간으로 보이기</p>
            </Row>
            <Row label="남은 건">
              <p className="text-[14px] text-ink-2">
                수령 시간이 끝나면 <span className="font-semibold text-green-ink">{pickupEnd}</span>부터 누구나 한 사람당 1개, 받은 사람은 기록하지 않아요
              </p>
            </Row>
          </Group>

          {giveaway ? (
          <Group title="현장 담당" aside="여기 들어간 사람 폰에 수령 체크 화면이 열려요">
            <div className="relative">
              <Blank filled={staff.length > 0}>
                <button type="button" onClick={() => setStaffOpen((v) => !v)} className="flex h-full w-full items-center px-3 text-left" aria-expanded={staffOpen}>
                  {staffNames.length ? staffNames.join(", ") : <span className="text-coral-ink/70">임원 고르기</span>}
                </button>
              </Blank>
              {staffOpen ? (
                <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-md">
                  {officers.map((o) => {
                    const on = staff.includes(o.id);
                    return (
                      <button
                        type="button"
                        key={o.id}
                        onClick={() => setStaff((prev) => (on ? prev.filter((x) => x !== o.id) : [...prev, o.id]))}
                        className="flex h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left hover:bg-surface-2"
                      >
                        <span
                          className={cn(
                            "grid size-5 place-items-center rounded-md border",
                            on ? "border-ink bg-ink text-white" : "border-line-strong",
                          )}
                        >
                          {on ? <Check className="size-3.5" /> : null}
                        </span>
                        <span className="text-[14px] font-semibold">{o.name}</span>
                        <span className="text-[12.5px] text-ink-3">{o.title}</span>
                      </button>
                    );
                  })}
                  <div className="sticky bottom-0 flex justify-end bg-surface pt-1.5">
                    <Button type="button" size="sm" variant="ink" onClick={() => setStaffOpen(false)}>
                      다 골랐어요
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Group>
          ) : null}

          <Group title="받는 정보" aside="계정에서 자동으로 들어가서 따로 묻지 않아요">
            <div className="flex flex-wrap gap-1.5">
              {["이름", "학번", "학년"].map((x) => (
                <span key={x} className="inline-flex h-8 items-center gap-1 rounded-full bg-green-tint px-3 text-[13px] font-semibold text-green-ink">
                  <Check className="size-3.5" />
                  {x}
                </span>
              ))}
            </div>
          </Group>

          <Group title="안내문" aside="직접 고치는 건 인사말뿐이에요">
            <div className="rounded-xl border border-line bg-surface p-4">
              <textarea
                aria-label="인사말"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg bg-surface-2 px-3 py-2 text-[14px] leading-6 outline-none focus:ring-2 focus:ring-coral-line"
              />
              <dl className="mt-3 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5 text-[14px] leading-6">
                <dt className="text-ink-3">일시</dt>
                <dd className={pickupDate ? "text-green-ink" : "text-ink-4"}>
                  {pickupDate ? `${fmtDate(`${pickupDate}T12:00:00+09:00`)} ${pickupStart} – ${pickupEnd}` : "날짜를 고르면 채워져요"}
                </dd>
                <dt className="text-ink-3">장소</dt>
                <dd className="text-green-ink">{location || "장소를 적으면 채워져요"}</dd>
                <dt className="text-ink-3">메뉴</dt>
                <dd className={menus.every((m) => m.name.trim()) ? "text-green-ink" : "text-ink-4"}>
                  {menus.every((m) => m.name.trim()) ? menus.map((m) => `${m.name} ${m.qty}개`).join(", ") : "메뉴를 적으면 채워져요"}
                </dd>
                <dt className="text-ink-3">대상</dt>
                <dd className="text-green-ink">{audienceText} (학생회비 납부와 상관없이)</dd>
                <dt className="text-ink-3">안내</dt>
                <dd className="text-green-ink">신청한 분께 먼저 드리고, {pickupEnd}부터 남은 건 선착순이에요</dd>
              </dl>
              <p className="mt-3 text-[12.5px] text-ink-3">초록 글씨는 위 칸을 따라 바뀌어요.</p>
            </div>
          </Group>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-[14px] font-bold">지난 {past[0]?.title.replace(/^.*?(\S+)$/, "$1") ?? "행사"}</h2>
          {past.length ? (
            <ul className="space-y-2">
              {past.map((p) => (
                <li key={p.id} className="rounded-xl border border-line bg-surface p-3.5">
                  <p className="text-[12.5px] font-semibold text-ink-3">{semesterLabel(p.semester)}</p>
                  <p className="mt-0.5 text-[13.5px] leading-5 font-semibold">{p.stats?.options?.map((o) => `${o.name} ${o.quantity}개`).join(", ") || p.title}</p>
                  {p.stats?.sold_out_minutes ? (
                    <p className="mt-1 text-[12.5px] text-ink-3">
                      <b className="font-semibold text-coral-ink">{minutesLabel(p.stats.sold_out_minutes)}</b> 만에 마감 · 안 온 신청자 {p.stats.no_show}명
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-3">처음 하는 행사예요. 끝나면 여기에 기록이 쌓여요.</p>
          )}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-line bg-surface/95 backdrop-blur-sm lg:bottom-0 lg:left-[248px]">
        <div className="mx-auto flex max-w-[1120px] items-center gap-3 px-4 py-3 md:px-8">
          <p className={cn("min-w-0 flex-1 text-[13px]", blanks.length ? "text-coral-ink" : "text-green-ink")} aria-live="polite">
            {pubState.message && !pubState.ok
              ? pubState.message
              : blanks.length
                ? `${blanks.join(", ")} ${blanks.length}칸을 채우면 공개할 수 있어요`
                : "다 채웠어요. 공개하면 대상 학생의 홈과 캘린더에 떠요"}
            {saveState.message && saveState.ok && !pubState.message ? <span className="ml-2 text-ink-3">· {saveState.message}</span> : null}
          </p>
          <button formAction={deleteDraft.bind(null, event.id)} className="hidden h-10 items-center gap-1 rounded-[10px] px-3 text-[13px] font-semibold text-ink-3 hover:bg-coral-tint hover:text-coral-ink sm:inline-flex">
            <Trash2 className="size-4" />
            초안 버리기
          </button>
          <Button formAction={saveAction} variant="secondary" disabled={saving}>
            {saving ? "저장 중" : "저장"}
          </Button>
          <Button formAction={publishAction} variant="primary" disabled={publishing || blanks.length > 0}>
            {publishing ? "공개하는 중" : "공개하기"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Group({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {aside ? <p className="text-[12.5px] text-ink-3">{aside}</p> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-1.5 sm:grid-cols-[6.5rem_1fr] sm:gap-4">
      <div className="text-[13.5px] font-medium text-ink-2">
        {label}
        {hint ? <span className="ml-1.5 text-[11.5px] font-normal text-ink-4 sm:ml-0 sm:block">{hint}</span> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** 이번에 바꿀 칸. 비어 있으면 코럴 점선, 채우면 실선 */
function Blank({ filled, children }: { filled: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "h-11 rounded-[10px] text-[14.5px] transition-colors focus-within:ring-2 focus-within:ring-coral-line",
        filled ? "border border-line-strong bg-surface text-ink" : "border-2 border-dashed border-coral bg-coral-tint/60 text-coral-ink",
      )}
    >
      {children}
    </div>
  );
}

/** 지난번 값을 그대로 가져온 칸 */
function Carried({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-[10px] border border-line bg-surface-2 px-3 text-[14.5px] text-ink-3 focus-within:border-ink-4 focus-within:text-ink">
      {children}
    </div>
  );
}
