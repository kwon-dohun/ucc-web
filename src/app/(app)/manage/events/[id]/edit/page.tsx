import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { EventForm } from "./event-form";
import { fmtTime } from "@/lib/format";
import type { EventOption, EventStats, UccEvent } from "@/lib/types";

export const metadata = { title: "행사 만들기" };

export default async function EditEvent({ params }: PageProps<"/manage/events/[id]/edit">) {
  const { id } = await params;
  const { org, orgTitle } = await requireOfficer();
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!event) notFound();
  if (event.status !== "draft") redirect(`/manage/events/${id}`);

  const [{ data: options }, { data: source }, { data: past }, { data: officers }, { data: staff }] = await Promise.all([
    supabase.from("event_options").select("*").eq("event_id", id).order("sort"),
    event.source_event_id
      ? supabase.from("events").select("*").eq("id", event.source_event_id).maybeSingle()
      : Promise.resolve({ data: null }),
    event.series_id
      ? supabase
          .from("events")
          .select("id, title, semester, stats, finished_at")
          .eq("series_id", event.series_id)
          .eq("status", "finished")
          .order("finished_at", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
    supabase
      .from("memberships")
      .select("user_id, title, sort, unit:org_units(name, sort), user:profiles(name)")
      .eq("org_id", org.id)
      .eq("active", true)
      .neq("role", "member"),
    supabase.from("event_staff").select("user_id").eq("event_id", id),
  ]);

  const src = source as UccEvent | null;
  type OfficerRow = { user_id: string; title: string; sort: number; unit: { name: string; sort: number } | null; user: { name: string } | null };
  const officerList = ((officers ?? []) as unknown as OfficerRow[])
    .sort((a, b) => (a.unit?.sort ?? 9) - (b.unit?.sort ?? 9) || a.sort - b.sort)
    .map((o) => ({ id: o.user_id, name: o.user?.name ?? "", title: o.title, unit: o.unit?.name ?? "" }));

  const pick = (iso: string | null | undefined, fallback: string) => (iso ? fmtTime(iso) : fallback);

  return (
    <EventForm
      orgTitle={orgTitle}
      orgRoom={org.room}
      event={event as UccEvent}
      options={(options ?? []) as EventOption[]}
      source={
        src
          ? {
              title: src.title,
              pickupStart: pick(src.pickup_starts_at, "18:30"),
              pickupEnd: pick(src.pickup_ends_at, "19:00"),
              openTime: pick(src.opens_at, "18:00"),
              options: ((src.stats as EventStats | null)?.options ?? []).map((o) => `${o.name} ${o.quantity}개`).join(", "),
            }
          : null
      }
      past={((past ?? []) as { id: string; title: string; semester: string; stats: EventStats | null }[]).map((p) => ({
        id: p.id,
        title: p.title,
        semester: p.semester,
        stats: p.stats,
      }))}
      officers={officerList}
      staff={(staff ?? []).map((s) => s.user_id)}
    />
  );
}
