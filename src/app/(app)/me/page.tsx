import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { leave } from "@/app/actions/session";
import { restoreTerm } from "@/app/actions/student";
import { Avatar, Badge, Button, SectionTitle } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "나" };

export default async function Me({ searchParams }: PageProps<"/me">) {
  const { handed } = await searchParams;
  const viewer = await getViewer();
  const { profile, department } = viewer;
  const supabase = await createClient();
  const [{ data: apps }, { data: council }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, seq, created_at, picked_up_at, event:events(id, title, status)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase.from("orgs").select("id, name, term").eq("slug", "itm").maybeSingle(),
  ]);
  type App = { id: string; seq: number; created_at: string; picked_up_at: string | null; event: { id: string; title: string; status: string } | null };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {handed ? (
        <p role="status" className="rounded-xl bg-green-tint px-4 py-3 text-[14px] font-medium text-green-ink">
          임기를 넘겼어요. 이제 {profile.name.slice(1)}님 운영 권한은 정리됐고, 지난 기록은 학생회에 그대로 남아요.
        </p>
      ) : null}

      <header className="flex items-center gap-4">
        <Avatar name={profile.name} size={56} tone="coral" />
        <div>
          <h1 className="text-[22px] font-bold">{profile.name}</h1>
          <p className="num text-[14px] text-ink-3">
            {profile.student_no}, {department.name} {profile.grade}학년
          </p>
          <p className="mt-0.5 text-[12.5px] text-green-ink">학교 메일 인증됨 (데모 계정)</p>
        </div>
      </header>

      <section>
        <SectionTitle aside="한 번만 넣으면 신청할 때 다시 안 물어봐요">내 정보</SectionTitle>
        <dl className="grid grid-cols-[5rem_1fr] gap-y-2 rounded-xl border border-line bg-surface p-4 text-[14px]">
          <dt className="text-ink-3">학과</dt>
          <dd>{department.name}</dd>
          <dt className="text-ink-3">학년</dt>
          <dd>{profile.grade}학년</dd>
          <dt className="text-ink-3">연락처</dt>
          <dd className="num">{profile.phone ?? "없음"}</dd>
        </dl>
      </section>

      <section>
        <SectionTitle aside="바꾸면 추천도 바로 바뀌어요">관심</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {[...profile.interests, ...profile.wants].map((t) => (
            <Badge key={t} tone="outline">
              {t}
            </Badge>
          ))}
        </div>
        {profile.skills.length ? (
          <p className="mt-3 text-[13.5px] text-ink-2">
            할 줄 아는 것 <span className="text-ink-3">·</span> {profile.skills.join(", ")}
          </p>
        ) : null}
      </section>

      <section>
        <SectionTitle aside="앱에서 한 것만 자동으로">활동 기록</SectionTitle>
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {((apps ?? []) as unknown as App[]).map((a) => (
            <li key={a.id}>
              <Link href={`/events/${a.event?.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2">
                <span className="text-[14px] font-semibold">{a.event?.title}</span>
                <span className="text-[12.5px] text-ink-3">
                  {a.picked_up_at ? "받음" : `${a.seq}번째 신청`} · {fmtDate(a.created_at)}
                </span>
              </Link>
            </li>
          ))}
          {viewer.memberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-[14px] font-semibold">
                {m.org.kind === "council" ? `${department.short_name} 학생회` : m.org.name} {m.title}
              </span>
              <span className="text-[12.5px] text-ink-3">{m.term}{m.org.kind === "council" ? "대" : "기"}</span>
            </li>
          ))}
          {!apps?.length && !viewer.memberships.length ? <li className="px-4 py-4 text-[13px] text-ink-3">아직 기록이 없어요.</li> : null}
        </ul>
      </section>

      <section className="rounded-xl border border-dashed border-line-strong p-4">
        <h2 className="text-[14px] font-bold">데모</h2>
        <p className="mt-1 text-[13px] leading-5 text-ink-3">
          지금 페르소나는 {profile.name}이에요. 다른 역할로 바꾸거나, 임기를 넘긴 뒤라면 학생회를 원래 기수로 되돌릴 수 있어요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/" className="inline-flex h-10 items-center rounded-[10px] border border-line-strong bg-surface px-4 text-[14px] font-semibold hover:border-ink-4">
            다른 역할로 보기
          </Link>
          {council && council.term > 15 ? (
            <form action={restoreTerm.bind(null, council.id)}>
              <Button variant="secondary">ITM 학생회를 {council.term - 1}대로 되돌리기</Button>
            </form>
          ) : null}
          <form action={leave}>
            <Button variant="ghost">나가기</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
