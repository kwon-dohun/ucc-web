"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  CalendarDays,
  ClipboardList,
  House,
  LayoutDashboard,
  Plus,
  Search,
  Umbrella,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; match?: (p: string) => boolean };

export const STUDENT_NAV: Item[] = [
  { href: "/home", label: "홈", icon: House },
  { href: "/find", label: "찾기", icon: Search },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/org", label: "소속", icon: Users, match: (p) => p.startsWith("/org") || p.startsWith("/events") },
];

export const MANAGE_NAV: Item[] = [
  { href: "/manage", label: "운영 홈", icon: LayoutDashboard, match: (p) => p === "/manage" },
  {
    href: "/manage/events",
    label: "사업·행사",
    icon: ClipboardList,
    match: (p) => p.startsWith("/manage/events") && !p.startsWith("/manage/events/new"),
  },
  { href: "/manage/history", label: "지난 활동", icon: Archive, match: (p) => p.startsWith("/manage/history") },
  { href: "/manage/rental", label: "대여 관리", icon: Umbrella },
  { href: "/manage/team", label: "조직도 · 임기", icon: Users },
];

function isActive(item: Item, pathname: string) {
  return item.match ? item.match(pathname) : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SideNav({ isOfficer, orgLabel }: { isOfficer: boolean; orgLabel: string | null }) {
  const pathname = usePathname();
  return (
    <nav aria-label="주 메뉴" className="flex flex-col gap-6">
      {isOfficer ? (
        <div>
          <Link
            href="/manage/events/new"
            className="flex h-11 items-center justify-center gap-1.5 rounded-[10px] bg-coral text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-deep"
          >
            <Plus className="size-4" />새 행사 만들기
          </Link>
        </div>
      ) : null}

      {isOfficer ? (
        <div>
          <p className="mb-1.5 px-2.5 text-[12px] font-semibold text-ink-3">{orgLabel ?? "운영"}</p>
          <ul className="space-y-0.5">
            {MANAGE_NAV.map((item) => (
              <NavRow key={item.href} item={item} active={isActive(item, pathname)} />
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        {isOfficer ? <p className="mb-1.5 px-2.5 text-[12px] font-semibold text-ink-3">학생 화면</p> : null}
        <ul className="space-y-0.5">
          {STUDENT_NAV.map((item) => (
            <NavRow key={item.href} item={item} active={isActive(item, pathname)} />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function NavRow({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium transition-colors",
          active ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:bg-line/60 hover:text-ink",
        )}
      >
        <Icon className={cn("size-[17px]", active ? "text-coral" : "text-ink-3")} />
        {item.label}
      </Link>
    </li>
  );
}

export function TabBar({ isOfficer }: { isOfficer: boolean }) {
  const pathname = usePathname();
  const items: Item[] = isOfficer
    ? [
        { href: "/manage", label: "운영", icon: LayoutDashboard, match: (p) => p.startsWith("/manage") },
        ...STUDENT_NAV,
      ]
    : STUDENT_NAV;
  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                  active ? "text-ink" : "text-ink-3",
                )}
              >
                <Icon className={cn("size-[21px]", active && "text-coral")} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
