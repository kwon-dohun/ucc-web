import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { countsTowardEpic, EPIC_GOAL, isEligible, isOpen, RECOGNIZED_CAP } from "@/lib/opportunities";
import { OpportunityRow } from "@/components/opportunity-row";
import { PageHeader, SectionTitle } from "@/components/ui";
import { fmtShortDate } from "@/lib/format";
import type { Opportunity } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "찾기" };

const FILTERS = [
  ["all", "전체"],
  ["epic", "EPiC 인정"],
  ["dept", "학과"],
  ["contest", "공모전"],
  ["scholarship", "장학"],
] as const;

export default async function Find({ searchParams }: PageProps<"/find">) {
  const sp = await searchParams;
  const f = (typeof sp.f === "string" ? sp.f : "all") as (typeof FILTERS)[number][0];
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const mineOnly = sp.mine !== "0";
  const { profile } = await getViewer();
  const supabase = await createClient();
  const [{ data }, { data: saves }] = await Promise.all([
    supabase.from("opportunities").select("*").order("deadline", { ascending: true, nullsFirst: false }),
    supabase.from("saves").select("opportunity_id").eq("user_id", profile.id),
  ]);
  const saved = new Set((saves ?? []).map((s) => s.opportunity_id));
  const all = (data ?? []) as Opportunity[];
  const notices = all.filter((o) => o.admin_notice && (!o.department_id || o.department_id === profile.department_id));

  let list = all.filter((o) => !o.admin_notice && isOpen(o));
  if (mineOnly) list = list.filter((o) => isEligible(o, profile));
  if (q) list = list.filter((o) => (o.title + o.summary + o.source).includes(q));
  if (f === "epic") list = list.filter((o) => o.epic_points);
  if (f === "dept") list = list.filter((o) => o.source_kind === "department");
  if (f === "contest") list = list.filter((o) => o.source_kind === "contest");
  if (f === "scholarship") list = list.filter((o) => o.source_kind === "scholarship");

  const href = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const cur = { f, q, mine: mineOnly ? null : "0", ...patch };
    for (const [k, v] of Object.entries(cur)) if (v && !(k === "f" && v === "all")) next.set(k, v);
    const s = next.toString();
    return s ? `/find?${s}` : "/find";
  };

  const epic = profile.epic ?? { total: 0, recognized: 0, language: 0 };
  const capped = epic.recognized >= RECOGNIZED_CAP;
  const counting = list.filter((o) => countsTowardEpic(o, profile));
  const notCounting = list.filter((o) => !countsTowardEpic(o, profile));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="찾기" description="학교, 학과, EPiC, 공모전 공지를 한곳에서. 기본은 나한테 해당되는 것만, 마감 임박 순이에요." />

      <form action="/find" className="relative">
        {f !== "all" ? <input type="hidden" name="f" value={f} /> : null}
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
        <input
          name="q"
          defaultValue={q}
          placeholder="프로그램 이름이나 키워드"
          aria-label="프로그램 검색"
          className="h-12 w-full rounded-xl border border-line-strong bg-surface pr-4 pl-10 text-[15px] outline-none placeholder:text-ink-4 focus:border-coral"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(([k, l]) => (
          <Link
            key={k}
            href={href({ f: k })}
            aria-current={f === k ? "true" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors",
              f === k ? "bg-ink text-white" : "border border-line-strong bg-surface text-ink-2 hover:border-ink-4",
            )}
          >
            {l}
          </Link>
        ))}
        <Link href={href({ mine: mineOnly ? "0" : null })} className="ml-auto text-[12.5px] font-medium text-ink-3 hover:text-ink">
          {mineOnly ? "대상 아닌 것도 보기" : "나한테 해당되는 것만"}
        </Link>
      </div>

      {f === "epic" ? (
        <section className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[14px] font-bold">EPiC 졸업요건</h2>
            <a href="https://epic.seoultech.ac.kr" target="_blank" rel="noreferrer" className="text-[12.5px] text-ink-3 hover:text-ink">
              EPiC에서 자세히
            </a>
          </div>
          <p className="mt-1 text-[20px] font-bold">
            <span className="num">{epic.total}</span>
            <span className="text-ink-3"> / {EPIC_GOAL}점</span>
            <span className="ml-2 text-[14px] font-semibold text-ink-2">{Math.max(0, EPIC_GOAL - epic.total)}점 남음</span>
          </p>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-panel" aria-hidden>
            <span className="bg-d-plan" style={{ width: `${(epic.language / EPIC_GOAL) * 100}%` }} />
            <span className="bg-green" style={{ width: `${(epic.recognized / EPIC_GOAL) * 100}%` }} />
          </div>
          <p className="mt-2 text-[12.5px] text-ink-3">
            외국어 {epic.language} · 인정 비교과 {epic.recognized}/{RECOGNIZED_CAP}
          </p>
          {capped ? (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5 text-[13.5px] leading-6 text-ink-2">
              인정 비교과는 300점까지만 졸업요건에 들어가요. 이미 다 채워서, 남은 {EPIC_GOAL - epic.total}점은 공모전, 마이크로디그리, 현장실습으로 채워야 해요.
            </p>
          ) : null}
        </section>
      ) : null}

      {f === "epic" && capped ? (
        <>
          <section>
            <SectionTitle aside={<span className="num">{counting.length}개</span>}>남은 점수를 채우는 것</SectionTitle>
            <List items={counting} profile={profile} saved={saved} />
          </section>
          <section>
            <SectionTitle aside="들어도 좋지만 졸업요건 점수는 더 안 올라가요">인정 비교과</SectionTitle>
            <List items={notCounting} profile={profile} saved={saved} quiet />
          </section>
        </>
      ) : (
        <section>
          <SectionTitle aside={<span className="num">{list.length}개</span>}>{f === "all" ? "모든 기회" : FILTERS.find((x) => x[0] === f)?.[1]}</SectionTitle>
          <List items={list} profile={profile} saved={saved} />
        </section>
      )}

      {notices.length && f === "all" ? (
        <section>
          <SectionTitle aside="알아야 하는 행정 공지는 여기 따로 모아요">학과 공지</SectionTitle>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {notices.map((n) => (
              <li key={n.id}>
                <a href={n.original_url ?? "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2">
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold">{n.title}</span>
                    <span className="block truncate text-[12.5px] text-ink-3">{n.summary}</span>
                  </span>
                  <span className="num shrink-0 text-[12.5px] text-ink-3">{n.posted_at ? `${fmtShortDate(n.posted_at)} 게시` : ""}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function List({
  items,
  profile,
  saved,
  quiet,
}: {
  items: Opportunity[];
  profile: Awaited<ReturnType<typeof getViewer>>["profile"];
  saved: Set<string>;
  quiet?: boolean;
}) {
  if (!items.length)
    return <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-3">조건에 맞는 기회가 없어요.</p>;
  return (
    <ul className={cn("divide-y divide-line overflow-hidden rounded-xl border border-line", quiet && "opacity-80")}>
      {items.map((o) => (
        <OpportunityRow key={o.id} o={o} profile={profile} saved={saved.has(o.id)} showReason={!quiet} />
      ))}
    </ul>
  );
}
