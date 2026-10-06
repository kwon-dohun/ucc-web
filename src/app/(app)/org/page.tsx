import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";

/** 소속 탭은 내 학과 학생회 페이지로 바로 간다. 학생회가 없는 학과면 동아리로 */
export default async function OrgIndex() {
  const viewer = await getViewer();
  if (viewer.council) redirect(`/org/${viewer.council.slug}`);
  const club = viewer.memberships.find((m) => m.org.kind === "club");
  if (club) redirect(`/org/${club.org.slug}`);
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6">
      <h1 className="text-lg font-bold">{viewer.department.name} 학생회는 아직 UCC를 안 써요</h1>
      <p className="mt-2 text-[14px] leading-6 text-ink-2">학생회가 시작하면 신청, 대여, 건의를 여기서 할 수 있어요. 그동안 기회 찾기는 그대로 쓸 수 있어요.</p>
      <Link href="/find" className="mt-4 inline-block text-[14px] font-semibold text-coral-ink hover:underline">
        기회 찾기로 가기
      </Link>
    </div>
  );
}
