import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageSquareText, Ticket, Umbrella } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getViewer, councilTitle } from "@/lib/viewer";
import { sendSuggestion } from "@/app/actions/student";
import { StatsLine } from "@/components/stats-line";
import { Avatar, Badge, Button, SectionTitle } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import type { Org, UccEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "소속" };

export default async function OrgPage({ params }: PageProps<"/org/[slug]">) {
  const { slug } = await params;
  const viewer = await getViewer();
  const supabase = await createClient();
  const { data: orgRow } = await supabase.from("orgs").select("*").eq("slug", slug).maybeSingle();
  if (!orgRow) notFound();
  const org = orgRow as Org;

  const mine = [viewer.council, ...viewer.memberships.filter((m) => m.org.kind === "club").map((m) => m.org)].filter(Boolean) as Org[];
  const chips = mine.some((o) => o.id === org.id) ? mine : [...mine, org];

  const [{ data: events }, { data: suggestions }, { data: members }, { data: units }, rental] = await Promise.all([
    supabase.from("events").select("*").eq("org_id", org.id).neq("status", "draft").order("finished_at", { ascending: false, nullsFirst: true }),
    supabase.from("suggestions").select("*").eq("org_id", org.id).not("answer", "is", null).order("answered_at", { ascending: false }),
    supabase.from("memberships").select("user_id, unit_id, title, role, user:profiles(name)").eq("org_id", org.id).eq("active", true).order("sort"),
    supabase.from("org_units").select("*").eq("org_id", org.id).order("sort"),
    org.rental_enabled ? supabase.rpc("rental_availability", { p_org: org.id }) : Promise.resolve({ data: [] }),
  ]);
  const all = (events ?? []) as UccEvent[];
  const live = all.filter((e) => e.status === "published" && e.kind === "giveaway");
  const upcoming = all.filter((e) => e.status === "published" && e.kind !== "giveaway");
  const past = all.filter((e) => e.status === "finished");
  const thisYear = past.filter((e) => e.finished_at?.startsWith(String(new Date().getFullYear())));
  type M = { user_id: string; unit_id: string | null; title: string; role: string; user: { name: string } | null };
  const ms = (members ?? []) as unknown as M[];
  const officers = ms.filter((m) => m.role !== "member");
  const rentalItems = ((rental as { data: { name: string; kind: string; available: number | null }[] | null }).data ?? []).filter((i) => i.kind === "rental");
  const available = rentalItems.filter((i) => (i.available ?? 0) > 0);
  const myClub = viewer.memberships.find((m) => m.org_id === org.id);
  const title = org.kind === "council" ? councilTitle(org, org.department_id === viewer.profile.department_id ? viewer.department.name : "ITM전공") : org.name;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {chips.length > 1 ? (
        <nav aria-label="소속 바꾸기" className="flex gap-2">
          {chips.map((o) => (
            <Link
              key={o.id}
              href={`/org/${o.slug}`}
              aria-current={o.id === org.id ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold",
                o.id === org.id ? "bg-ink text-white" : "border border-line-strong bg-surface text-ink-2 hover:border-ink-4",
              )}
            >
              {o.kind === "council" ? `${viewer.department.short_name} 학생회` : `${o.name} 동아리`}
            </Link>
          ))}
        </nav>
      ) : null}

      <header className="flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-[22px] font-black text-white">{org.name.slice(0, 1)}</span>
        <div className="min-w-0">
          <h1 className="text-[22px] leading-8 font-bold">{title}</h1>
          <p className="mt-1 text-[14px] leading-6 text-ink-2">{org.intro}</p>
          <p className="mt-1.5 flex flex-wrap gap-x-3 text-[12.5px] text-ink-3">
            {org.kind === "council" ? (
              <>
                <span>임원 {officers.length}명</span>
                <span>올해 활동 {thisYear.length}개</span>
                {org.instagram ? <span>인스타그램 {org.instagram}</span> : null}
              </>
            ) : (
              <>
                <span>{org.category}</span>
                <span>{org.room}</span>
              </>
            )}
          </p>
        </div>
      </header>

      {org.kind === "council" ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Quick href={`/org/${org.slug}/rental`} icon={<Umbrella />} title="대여" sub={available.length ? `${available.length}가지 빌릴 수 있어요` : "모두 대여 중"} />
            <Quick
              href={live[0] ? `/events/${live[0].id}` : "#live"}
              icon={<Ticket />}
              title="신청 중"
              sub={live.length ? `${live.length}개` : "없어요"}
              hot={!!live.length}
            />
            <Quick href="#suggest" icon={<MessageSquareText />} title="건의하기" sub={`답변 ${suggestions?.length ?? 0}개`} />
          </div>

          {live.length ? (
            <section id="live">
              <SectionTitle>진행 중</SectionTitle>
              <ul className="space-y-2">
                {live.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.id}`} className="flex items-center gap-3 rounded-xl border border-coral-line bg-surface px-4 py-3.5 hover:border-coral">
                      <Badge tone="coral">신청 중</Badge>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{e.title}</span>
                      <ChevronRight className="size-4 text-ink-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {upcoming.length ? (
            <section>
              <SectionTitle>다가오는 일정</SectionTitle>
              <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex justify-between gap-3 px-4 py-3 text-[14px]">
                    <span className="font-semibold">{e.title.replace(/^\d{4}\s*/, "")}</span>
                    <span className="text-ink-3">{e.opens_at ? fmtDate(e.opens_at) : "예정"}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <SectionTitle aside={<span className="num">전체 {past.length}개</span>}>지난 활동</SectionTitle>
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
              {past.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
                  <span className="min-w-0 truncate">
                    <span className="num mr-2 text-ink-3">{e.finished_at ? fmtDate(e.finished_at).replace(/ \(.\)$/, "") : ""}</span>
                    <span className="font-semibold">{e.title.replace(/^\d{4}\s*/, "")}</span>
                  </span>
                  <span className="shrink-0 text-[13px] text-ink-3">
                    <StatsLine stats={e.stats} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="suggest" className="scroll-mt-20">
            <SectionTitle aside="이름 없이 보낼 수 있어요">건의함</SectionTitle>
            <ul className="space-y-2">
              {(suggestions ?? []).map((s) => (
                <li key={s.id} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-[14px] leading-6">
                    <span className="mr-2 text-[12px] font-bold text-ink-3">건의</span>
                    {s.body}
                  </p>
                  <p className="mt-2 text-[14px] leading-6 text-ink-2">
                    <span className="mr-2 text-[12px] font-bold text-green-ink">답변</span>
                    {s.answer}
                  </p>
                </li>
              ))}
            </ul>
            <form action={sendSuggestion.bind(null, org.id)} className="mt-3 flex gap-2">
              <label htmlFor="sg" className="sr-only">
                건의 내용
              </label>
              <input
                id="sg"
                name="body"
                maxLength={500}
                placeholder="학생회에 바라는 것"
                className="h-11 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-surface px-3 text-[14px] outline-none placeholder:text-ink-4 focus:border-coral"
              />
              <Button variant="ink" className="h-11">
                보내기
              </Button>
            </form>
          </section>
        </>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["인원", org.size_label],
            ["모임", org.meets],
            ["입회비", org.fee],
            ["모집", org.recruiting],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-xl border border-line bg-surface px-3.5 py-3">
              <p className="text-[12px] text-ink-3">{k}</p>
              <p className="mt-0.5 text-[14px] font-semibold">{v}</p>
            </div>
          ))}
          {myClub ? (
            <p className="col-span-full rounded-xl bg-surface-2 px-4 py-3 text-[14px] text-ink-2">
              {viewer.profile.name.slice(1)}님은 <b className="font-semibold">{myClub.title}</b>, {org.term}기예요. 합주 응답과 출석은 다음 단계에서 붙여요.
            </p>
          ) : null}
        </section>
      )}

      <section>
        <SectionTitle aside={<span className="num">{officers.length}명</span>}>조직도</SectionTitle>
        <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
          {(units ?? []).map((u) => {
            const list = officers.filter((m) => m.unit_id === u.id);
            if (!list.length) return null;
            return (
              <div key={u.id} className="grid gap-2 sm:grid-cols-[5rem_1fr]">
                <p className="text-[13px] font-bold text-ink-2">{u.name}</p>
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {list.map((m) => (
                    <li key={m.user_id} className="flex items-center gap-1.5 text-[13px]">
                      <Avatar name={m.user?.name ?? "?"} size={24} />
                      <span className="font-semibold">{m.user?.name}</span>
                      <span className="text-ink-3">{m.title.replace(u.name.replace("부", ""), "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Quick({ href, icon, title, sub, hot }: { href: string; icon: React.ReactNode; title: string; sub: string; hot?: boolean }) {
  return (
    <Link href={href} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-ink-4 md:p-4">
      <span className={hot ? "text-coral [&_svg]:size-5" : "text-ink-3 [&_svg]:size-5"}>{icon}</span>
      <span>
        <span className="block text-[14px] font-semibold">{title}</span>
        <span className={hot ? "block truncate text-[12.5px] font-medium text-coral-ink" : "block truncate text-[12.5px] text-ink-3"}>{sub}</span>
      </span>
    </Link>
  );
}
