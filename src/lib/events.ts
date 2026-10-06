import { createClient } from "@/lib/supabase/server";
import type { Applicant } from "@/components/live-event";
import type { EventOption, UccEvent } from "@/lib/types";

export async function loadEventConsole(eventId: string) {
  const supabase = await createClient();
  const [{ data: event }, { data: options }, { data: apps }, { data: staff }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase.from("event_options").select("*").eq("event_id", eventId).order("sort"),
    supabase
      .from("applications")
      .select(
        "id, seq, option_id, created_at, picked_up_at, user:profiles!applications_user_id_fkey(name, student_no, grade), picker:profiles!applications_picked_up_by_fkey(name)",
      )
      .eq("event_id", eventId)
      .order("seq", { ascending: false }),
    supabase.from("event_staff").select("user:profiles(name)").eq("event_id", eventId),
  ]);
  if (!event) return null;

  type AppRow = {
    id: string;
    seq: number;
    option_id: string;
    created_at: string;
    picked_up_at: string | null;
    user: { name: string; student_no: string; grade: number } | null;
    picker: { name: string } | null;
  };
  const applicants: Applicant[] = ((apps ?? []) as unknown as AppRow[]).map((a) => ({
    id: a.id,
    seq: a.seq,
    option_id: a.option_id,
    created_at: a.created_at,
    picked_up_at: a.picked_up_at,
    picked_up_by_name: a.picker?.name ?? null,
    user: a.user ?? { name: "학생", student_no: "", grade: 0 },
  }));

  return {
    event: event as UccEvent,
    options: (options ?? []) as EventOption[],
    applicants,
    staff: ((staff ?? []) as unknown as { user: { name: string } | null }[]).map((s) => s.user?.name).filter(Boolean) as string[],
  };
}
