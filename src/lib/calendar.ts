import { createClient } from "@/lib/supabase/server";
import { dayKey, fmtTime } from "@/lib/format";
import type { Viewer } from "@/lib/viewer";
import type { Opportunity } from "@/lib/types";

export type Layer = "org" | "school" | "mine" | "saved";

export type CalItem = {
  key: string;
  day: string;
  time: string | null;
  title: string;
  sub: string;
  layer: Layer;
  href: string;
  dotted?: boolean;
  at: number;
};

export type Band = { name: string; start: string; end: string };

export const LAYER_LABEL: Record<Layer, string> = {
  org: "학생회·동아리",
  school: "학교·학과",
  mine: "내 신청",
  saved: "저장만 함",
};

export async function loadCalendar(viewer: Viewer) {
  const supabase = await createClient();
  const orgIds = [...new Set([viewer.council?.id, ...viewer.memberships.map((m) => m.org_id)].filter(Boolean))] as string[];

  const [{ data: events }, { data: apps }, { data: saves }, { data: deptOpps }, { data: periods }] = await Promise.all([
    supabase.from("events").select("id, title, kind, opens_at, pickup_starts_at, org:orgs(name)").in("org_id", orgIds).eq("status", "published"),
    supabase.from("applications").select("event_id, seq").eq("user_id", viewer.profile.id),
    supabase.from("saves").select("opportunity:opportunities(*)").eq("user_id", viewer.profile.id),
    supabase.from("opportunities").select("*").eq("department_id", viewer.profile.department_id).not("starts_at", "is", null),
    supabase.from("academic_periods").select("*"),
  ]);

  const applied = new Map((apps ?? []).map((a) => [a.event_id, a.seq]));
  const items: CalItem[] = [];
  type Ev = { id: string; title: string; kind: string; opens_at: string | null; pickup_starts_at: string | null; org: { name: string } | null };
  for (const e of (events ?? []) as unknown as Ev[]) {
    const org = e.org?.name ?? "";
    if (e.kind === "giveaway") {
      if (e.opens_at)
        items.push({
          key: `${e.id}-open`,
          day: dayKey(e.opens_at),
          time: fmtTime(e.opens_at),
          title: `${e.title.replace(/^\d{4}\s*\d학기\s*/, "")} 신청 열림`,
          sub: `${org} 학생회`,
          layer: "org",
          href: `/events/${e.id}`,
          at: new Date(e.opens_at).getTime(),
        });
      if (e.pickup_starts_at)
        items.push({
          key: `${e.id}-pickup`,
          day: dayKey(e.pickup_starts_at),
          time: fmtTime(e.pickup_starts_at),
          title: "간식 받는 날",
          sub: applied.has(e.id) ? `${applied.get(e.id)}번째로 신청함` : "신청하면 자동으로 들어가요",
          layer: applied.has(e.id) ? "mine" : "org",
          href: `/events/${e.id}`,
          dotted: !applied.has(e.id),
          at: new Date(e.pickup_starts_at).getTime(),
        });
    } else if (e.opens_at) {
      items.push({
        key: e.id,
        day: dayKey(e.opens_at),
        time: fmtTime(e.opens_at),
        title: e.title.replace(/^\d{4}\s*/, ""),
        sub: `${org} 학생회`,
        layer: "org",
        href: `/events/${e.id}`,
        at: new Date(e.opens_at).getTime(),
      });
    }
  }

  const savedIds = new Set<string>();
  for (const s of (saves ?? []) as unknown as { opportunity: Opportunity | null }[]) {
    const o = s.opportunity;
    if (!o) continue;
    savedIds.add(o.id);
    const when = o.starts_at ?? o.deadline;
    if (!when) continue;
    items.push({
      key: `save-${o.id}`,
      day: dayKey(when),
      time: fmtTime(when),
      title: o.starts_at ? o.title : `${o.title} 마감`,
      sub: `저장해둔 것, ${o.source}`,
      layer: "saved",
      href: `/find/${o.id}`,
      dotted: true,
      at: new Date(when).getTime(),
    });
  }
  for (const o of (deptOpps ?? []) as Opportunity[]) {
    if (savedIds.has(o.id) || !o.starts_at) continue;
    items.push({
      key: `dept-${o.id}`,
      day: dayKey(o.starts_at),
      time: fmtTime(o.starts_at),
      title: o.title,
      sub: "학과 행사",
      layer: "school",
      href: `/find/${o.id}`,
      at: new Date(o.starts_at).getTime(),
    });
  }

  items.sort((a, b) => a.at - b.at);
  const bands: Band[] = (periods ?? []).map((p) => ({ name: p.name, start: p.starts_on, end: p.ends_on }));
  return { items, bands, savedIds };
}
