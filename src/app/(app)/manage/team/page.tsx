import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { Avatar, PageHeader, SectionTitle } from "@/components/ui";
import { Handover, type Officer } from "./handover";

export const metadata = { title: "조직도 · 임기" };

const UNIT_COLOR: Record<string, string> = {
  회장단: "var(--d-head)",
  기획부: "var(--d-plan)",
  사무부: "var(--d-admin)",
  홍보부: "var(--d-promo)",
};

export default async function Team() {
  const { org, isPresident, orgTitle } = await requireOfficer();
  const supabase = await createClient();
  const [{ data: units }, { data: members }] = await Promise.all([
    supabase.from("org_units").select("*").eq("org_id", org.id).order("sort"),
    supabase
      .from("memberships")
      .select("user_id, unit_id, title, role, sort, user:profiles(name, student_no, grade)")
      .eq("org_id", org.id)
      .eq("active", true)
      .neq("role", "member")
      .order("sort"),
  ]);
  type Row = { user_id: string; unit_id: string | null; title: string; role: string; sort: number; user: { name: string; student_no: string; grade: number } | null };
  const rows = (members ?? []) as unknown as Row[];
  const officers: Officer[] = rows.map((r) => ({
    id: r.user_id,
    name: r.user?.name ?? "",
    studentNo: r.user?.student_no ?? "",
    grade: r.user?.grade ?? 0,
    title: r.title,
    unitId: r.unit_id,
    unitName: (units ?? []).find((u) => u.id === r.unit_id)?.name ?? "",
    role: r.role,
  }));
  const unassigned = rows.filter((r) => !r.unit_id);

  return (
    <div className="space-y-10">
      <PageHeader title="조직도" description={`${orgTitle} · 임원 ${rows.length}명`} />

      <section className="grid gap-4 md:grid-cols-2">
        {(units ?? []).map((u) => {
          const list = rows.filter((r) => r.unit_id === u.id);
          return (
            <div key={u.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="flex items-center gap-2 text-[15px] font-bold">
                  <span className="size-2.5 rounded-full" style={{ background: UNIT_COLOR[u.name] ?? "var(--ink-4)" }} aria-hidden />
                  {u.name}
                </h2>
                <span className="num text-[13px] text-ink-3">{list.length}명</span>
              </div>
              {u.description ? <p className="mt-0.5 text-[12.5px] text-ink-3">{u.description}</p> : null}
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3">
                {list.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-2">
                    <Avatar name={m.user?.name ?? "?"} size={30} />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[13.5px] font-semibold">{m.user?.name}</span>
                      <span className="block truncate text-[11.5px] text-ink-3">{m.title}</span>
                    </span>
                  </li>
                ))}
                {!list.length ? <li className="col-span-full text-[13px] text-ink-3">아직 아무도 없어요</li> : null}
              </ul>
            </div>
          );
        })}
        {unassigned.length ? (
          <div className="rounded-xl border border-line bg-surface p-4">
            <h2 className="text-[15px] font-bold">부서 정하기 전</h2>
            <ul className="mt-3 space-y-2">
              {unassigned.map((m) => (
                <li key={m.user_id} className="flex items-center gap-2 text-[13.5px]">
                  <Avatar name={m.user?.name ?? "?"} size={28} />
                  {m.user?.name} <span className="text-ink-3">{m.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section>
        <SectionTitle aside={isPresident ? "회장만 할 수 있어요" : "회장이 해요"}>임기 넘기기</SectionTitle>
        {isPresident ? (
          <Handover orgId={org.id} term={org.term} officers={officers} />
        ) : (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-[13.5px] leading-6 text-ink-3">
            임기가 끝나면 회장이 다음 회장과 이어가는 사람을 골라 한 번에 넘겨요. 공용 계정 비밀번호를 바꿔 넘기던 일이 이 한 장으로 끝나요.
          </p>
        )}
      </section>
    </div>
  );
}
