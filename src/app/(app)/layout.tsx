import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { SideNav, TabBar } from "@/components/nav";
import { Avatar } from "@/components/ui";
import { getViewer } from "@/lib/viewer";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  const { profile, department } = viewer;
  const officer = viewer.memberships.find((m) => m.role !== "member" && m.org.kind === "council");
  const isOfficer = viewer.officerOrgs.length > 0;
  const roleLine = officer ? `${officer.title}, ${department.short_name} ${profile.grade}학년` : `${department.name} ${profile.grade}학년`;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-panel/60 px-4 py-5 lg:flex">
        <Link href={isOfficer ? "/manage" : "/home"} className="flex items-center gap-2.5 px-1.5">
          <span className="grid size-8 place-items-center rounded-[9px] bg-coral text-[14px] font-black text-white">U</span>
          <span className="text-[15px] font-bold">UCC 유크크</span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SideNav isOfficer={isOfficer} orgLabel={officer ? `${officer.org.name} 학생회` : null} />
        </div>
        <div className="space-y-1">
          <Link href="/me" className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-line/60">
            <Avatar name={profile.name} size={32} tone="coral" />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold">{profile.name}</span>
              <span className="block truncate text-[12px] text-ink-3">{roleLine}</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex h-8 items-center gap-2 rounded-lg px-2.5 text-[12.5px] font-medium text-ink-3 hover:bg-line/60 hover:text-ink"
          >
            <Repeat2 className="size-3.5" />
            다른 역할로 보기
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ground/90 px-4 backdrop-blur-sm lg:hidden">
          <Link href={isOfficer ? "/manage" : "/home"} className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-[8px] bg-coral text-[13px] font-black text-white">U</span>
            <span className="text-[14.5px] font-bold">UCC 유크크</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" className="rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-ink-3">
              역할 바꾸기
            </Link>
            <Link href="/me" aria-label="내 정보" className="grid size-11 place-items-center">
              <Avatar name={profile.name} size={30} tone="coral" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1120px] px-4 pt-5 pb-28 md:px-8 md:pt-8 lg:pb-16">{children}</main>
      </div>
      <TabBar isOfficer={isOfficer} />
    </div>
  );
}
