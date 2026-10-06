import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer, councilTitle } from "@/lib/viewer";
import { ApplyPanel } from "./apply-panel";
import type { EventOption, UccEvent } from "@/lib/types";

export const metadata = { title: "행사 신청" };

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  const supabase = await createClient();
  const [{ data: event }, { data: options }, { data: mine }] = await Promise.all([
    supabase.from("events").select("*, org:orgs(*)").eq("id", id).maybeSingle(),
    supabase.from("event_options").select("*").eq("event_id", id).order("sort"),
    supabase.from("applications").select("seq, option_id, picked_up_at, created_at").eq("event_id", id).eq("user_id", viewer.profile.id).maybeSingle(),
  ]);
  if (!event || event.status === "draft") notFound();

  const eligible = event.audience !== "department" || event.org?.department_id === viewer.profile.department_id;

  return (
    <ApplyPanel
      event={event as UccEvent}
      orgTitle={event.org?.kind === "council" ? councilTitle(event.org, viewer.department.name) : (event.org?.name ?? "")}
      orgShort={event.org?.name ?? ""}
      options={(options ?? []) as EventOption[]}
      mine={mine}
      eligible={eligible}
      me={{ name: viewer.profile.name, line: `${viewer.department.name} ${viewer.profile.grade}학년` }}
    />
  );
}
