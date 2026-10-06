import Link from "next/link";
import { ChevronRight, MessageSquareText, Ticket, Umbrella } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { loadCalendar } from "@/lib/calendar";
import { score } from "@/lib/opportunities";
import { Agenda } from "@/components/agenda";
import { OpportunityRow } from "@/components/opportunity-row";
import { SectionTitle } from "@/components/ui";
import type { Opportunity } from "@/lib/types";

export const metadata = { title: "홈" };

export default async function Home() {
  const viewer = await getViewer();
  const { profile, council, department } = viewer;
  const supabase = await createClient();
  const [{ items, bands, savedIds }, { data: opps }, rental, { data: openEvents }, { count: answered }] = await Promise.all([
    loadCalendar(viewer),
    supabase.from("opportunities").select("*"),
    council ? supabase.rpc("rental_availability", { p_org: council.id }) : Promise.resolve({ data: [] }),
    council
      ? supabase.from("events").select("id, title, opens_at").eq("org_id", council.id).eq("status", "published").eq("kind", "giveaway")
      : Promise.resolve({ data: [] }),
    council
      ? supabase.from("suggestions").select("id", { count: "exact", head: true }).eq("org_id", council.id).not("answer", "is", null)
      : Promise.resolve({ count: 0 }),
  ]);

  const ranked = ((opps ?? []) as Opportunity[])
    .map((o) => ({ o, s: score(o, profile) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.o);
  const umbrella = (rental as { data: { name: string; available: number | null }[] | null }).data?.find((i) => i.name === "우산");

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-10">
        <header>
          <h1 className="text-[22px] leading-8 font-bold md:text-2xl">{profile.name.slice(1)}님의 이번 주</h1>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {department.name} {profile.grade}학년
          </p>
        </header>

        <section>
          <SectionTitle aside={<Link href="/calendar" className="hover:text-ink">캘린더 전체</Link>}>앞으로 2주</SectionTitle>
          <Agenda items={items} bands={bands} days={16} />
        </section>

        <section>
          <SectionTitle aside={<Link href="/find" className="hover:text-ink">찾기에서 전체 보기</Link>}>나한테 맞는 기회</SectionTitle>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {ranked.map((o) => (
              <OpportunityRow key={o.id} o={o} profile={profile} saved={savedIds.has(o.id)} />
            ))}
          </ul>
          <p className="mt-2 text-[12.5px] text-ink-3">추천 이유는 원문과 내가 고른 관심에서 확인되는 사실만 적어요.</p>
        </section>
      </div>

      {council ? (
        <aside className="space-y-3 lg:pt-14">
          <SectionTitle aside={<Link href={`/org/${council.slug}`} className="hover:text-ink">학생회 페이지</Link>}>
            {department.short_name} 학생회
          </SectionTitle>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <QuickLink href={`/org/${council.slug}/rental`} icon={<Umbrella />} title="대여" sub={umbrella ? `우산 ${umbrella.available}개 남음` : "대여 현황"} />
            <QuickLink
              href={openEvents?.[0] ? `/events/${openEvents[0].id}` : "/org"}
              icon={<Ticket />}
              title="신청 중"
              sub={openEvents?.length ? `${openEvents[0].title.replace(/^\d{4}\s*\d학기\s*/, "").replace(/ 간식행사$/, " 간식")}` : "없어요"}
              hot={!!openEvents?.length}
            />
            <QuickLink href={`/org/${council.slug}#suggest`} icon={<MessageSquareText />} title="건의하기" sub={`답변 ${answered ?? 0}개`} />
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function QuickLink({ href, icon, title, sub, hot }: { href: string; icon: React.ReactNode; title: string; sub: string; hot?: boolean }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-ink-4 lg:flex-row lg:items-center lg:gap-3 lg:px-4"
    >
      <span className={hot ? "text-coral [&_svg]:size-5" : "text-ink-3 [&_svg]:size-5"}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">{title}</span>
        <span className={hot ? "block truncate text-[12.5px] font-medium text-coral-ink" : "block truncate text-[12.5px] text-ink-3"}>{sub}</span>
      </span>
      <ChevronRight className="hidden size-4 text-ink-4 lg:block" />
    </Link>
  );
}
