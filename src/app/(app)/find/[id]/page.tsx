import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowUpRight, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { countsTowardEpic, isEligible, reasons } from "@/lib/opportunities";
import { SaveButton } from "@/components/save-button";
import { Badge, buttonStyles } from "@/components/ui";
import { dday, fmtDate, fmtDateTime } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

export const metadata = { title: "기회 상세" };

export default async function OpportunityPage({ params }: PageProps<"/find/[id]">) {
  const { id } = await params;
  const { profile, department } = await getViewer();
  const supabase = await createClient();
  const [{ data }, { data: save }] = await Promise.all([
    supabase.from("opportunities").select("*").eq("id", id).maybeSingle(),
    supabase.from("saves").select("opportunity_id").eq("user_id", profile.id).eq("opportunity_id", id).maybeSingle(),
  ]);
  if (!data) notFound();
  const o = data as Opportunity;
  const ok = isEligible(o, profile);
  const why = reasons(o, profile);
  const counts = countsTowardEpic(o, profile);
  const modeLabel = o.mode === "online" ? "온라인" : o.mode === "mixed" ? "현장, 온라인" : "현장";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/find" className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-3.5" />
        찾기
      </Link>

      <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-3">
          <span>{o.source}</span>
          {o.department_id && o.department_id !== profile.department_id ? <Badge>다른 학과</Badge> : null}
          {o.epic_points ? <Badge tone={counts ? "green" : "neutral"}>EPiC {o.epic_points}점</Badge> : null}
        </div>
        <h1 className="mt-2 text-[22px] leading-8 font-bold">{o.title}</h1>
        <p className="mt-2 text-[14.5px] leading-6 text-ink-2">{o.summary}</p>

        <section className={ok ? "mt-5 rounded-xl bg-green-tint p-4" : "mt-5 rounded-xl bg-surface-2 p-4"}>
          <p className={ok ? "flex items-center gap-1.5 text-[15px] font-bold text-green-ink" : "flex items-center gap-1.5 text-[15px] font-bold text-ink-2"}>
            {ok ? <Check className="size-[18px]" /> : <X className="size-[18px]" />}
            {ok ? `${profile.name.slice(1)}님도 할 수 있어요` : "이번엔 대상이 아니에요"}
          </p>
          {o.eligibility_note ? <p className="mt-1 text-[13.5px] leading-6 text-ink-2">{o.eligibility_note}</p> : null}
          {!ok ? (
            <p className="mt-1 text-[13px] text-ink-3">
              지금 {department.name} {profile.grade}학년으로 되어 있어요.
            </p>
          ) : null}
        </section>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["마감", o.deadline ? `${fmtDate(o.deadline)}` : "상시", o.deadline ? dday(o.deadline) : null],
            ["방식", modeLabel, o.location],
            ["EPiC", o.epic_points ? `${o.epic_points}점` : "없음", o.epic_points && !counts ? "비교과 점수 다 참" : null],
            ["정원", o.capacity ? `${o.capacity}명` : "제한 없음", null],
          ].map(([k, v, s]) => (
            <div key={k as string} className="rounded-lg border border-line px-3 py-2.5">
              <dt className="text-[12px] text-ink-3">{k}</dt>
              <dd className="mt-0.5 text-[14px] font-semibold">{v}</dd>
              {s ? <dd className="truncate text-[12px] text-ink-3">{s}</dd> : null}
            </div>
          ))}
        </dl>

        {o.steps.length ? (
          <section className="mt-7">
            <h2 className="text-[15px] font-bold">신청 방법</h2>
            <ol className="mt-3 space-y-3">
              {o.steps.map((s, i) => (
                <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-3">
                  <span className="num grid size-7 place-items-center rounded-full bg-ink text-[13px] font-bold text-white">{i + 1}</span>
                  <div>
                    <p className="text-[14.5px] font-semibold">{s.title}</p>
                    <p className="text-[13.5px] leading-6 text-ink-2">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {o.warning ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-coral-tint px-4 py-3 text-[14px] font-semibold text-coral-ink">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {o.warning}
              </p>
            ) : null}
          </section>
        ) : null}

        {why.length ? (
          <section className="mt-7">
            <h2 className="text-[15px] font-bold">왜 보여줬나요</h2>
            <ul className="mt-2 space-y-1.5">
              {why.map((w) => (
                <li key={w} className="flex gap-2 text-[14px] leading-6 text-ink-2">
                  <span className="mt-2.5 size-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                  {w}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-7 rounded-xl bg-surface-2 px-4 py-3 text-[12.5px] leading-5 text-ink-3">
          {o.posted_at ? `${o.source}에 ${fmtDateTime(`${o.posted_at}T09:00:00+09:00`).replace(/ \d\d:\d\d$/, "")} 올라온 원문을 정리했어요. ` : ""}
          바뀌었을 수 있으니 신청 전에 원문을 한 번 확인해 주세요. 공식 신청과 수료, 점수는 EPiC에 그대로 남아요.
        </p>

        <div className="mt-5 flex gap-2">
          <SaveButton id={o.id} saved={!!save} />
          {o.original_url ? (
            <a
              href={o.original_url}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: ok ? "primary" : "secondary", size: "lg", className: "flex-1" })}
            >
              {o.source_kind === "epic" ? "EPiC에서 신청하기" : "원문에서 신청하기"}
              <ArrowUpRight />
            </a>
          ) : null}
        </div>
      </article>
    </div>
  );
}
