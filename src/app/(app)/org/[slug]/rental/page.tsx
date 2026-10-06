import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { disputeRental } from "@/app/actions/student";
import { SectionTitle } from "@/components/ui";
import { daysOverdue, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "대여 현황" };

type Item = { id: string; name: string; kind: "rental" | "consumable" | "fixture"; total: number; available: number | null; present: boolean };

export default async function RentalStatus({ params }: PageProps<"/org/[slug]/rental">) {
  const { slug } = await params;
  const { profile } = await getViewer();
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("*").eq("slug", slug).maybeSingle();
  if (!org || !org.rental_enabled) notFound();
  const [{ data: items }, { data: mine }] = await Promise.all([
    supabase.rpc("rental_availability", { p_org: org.id }),
    supabase
      .from("rentals")
      .select("id, qty, lent_at, disputed_at, item:rental_items(name), lender:profiles!rentals_lent_by_fkey(name)")
      .eq("org_id", org.id)
      .eq("user_id", profile.id)
      .is("returned_at", null),
  ]);
  const list = (items ?? []) as Item[];
  type Mine = { id: string; qty: number; lent_at: string; disputed_at: string | null; item: { name: string } | null; lender: { name: string } | null };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href={`/org/${slug}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
          <ArrowLeft className="size-3.5" />
          {org.name} 학생회
        </Link>
        <h1 className="mt-3 text-[22px] font-bold">대여사업</h1>
        <p className="mt-0.5 text-[14px] text-ink-3">{org.room} · 가기 전에 남아 있는지 먼저 봐요</p>
      </div>

      {(mine as unknown as Mine[] | null)?.length ? (
        <section>
          <SectionTitle>내가 빌린 것</SectionTitle>
          <ul className="space-y-2">
            {(mine as unknown as Mine[]).map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-[15px] font-bold">
                  {r.item?.name} {r.qty}개
                </p>
                <p className="mt-1 text-[13px] leading-5 text-ink-3">
                  {fmtDateTime(r.lent_at)}에 빌렸어요{r.lender ? `, 확인한 임원 ${r.lender.name}` : ""}
                  {daysOverdue(r.lent_at) >= 1 ? ` · ${daysOverdue(r.lent_at)}일 지났어요` : ""}
                </p>
                {r.disputed_at ? (
                  <p className="mt-2 text-[13px] font-medium text-amber-ink">학생회에 알렸어요. 임원이 확인할 거예요.</p>
                ) : (
                  <form action={disputeRental.bind(null, r.id)} className="mt-2">
                    <button className="text-[13px] font-semibold text-ink-3 underline hover:text-ink">제가 안 빌렸어요</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(
        [
          ["rental", "대여 물품", "빌려가고 돌려줘요"],
          ["consumable", "소모품", "반납 안 해도 돼요. 임원이 기록하고 드려요"],
          ["fixture", "비치 물품", "학생회실에서 바로 써요"],
        ] as const
      ).map(([kind, t, s]) => (
        <section key={kind}>
          <SectionTitle aside={s}>{t}</SectionTitle>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {list
              .filter((i) => i.kind === kind)
              .map((i) => {
                const ok = kind === "fixture" ? i.present : (i.available ?? 0) > 0;
                return (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-[14.5px] font-medium">{i.name}</span>
                    <span className={cn("flex items-center gap-1.5 text-[13.5px] font-semibold", ok ? "text-green-ink" : "text-coral-ink")}>
                      <span className={cn("size-2 rounded-full", ok ? "bg-green" : "bg-coral")} aria-hidden />
                      {kind === "fixture"
                        ? i.present
                          ? "있어요"
                          : "없어요"
                        : kind === "rental"
                          ? ok
                            ? i.available === i.total
                              ? `${i.total}개 모두 있어요`
                              : `${i.total}개 중 ${i.available}개 남음`
                            : "모두 대여 중"
                          : `${i.available}개 남음`}
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
