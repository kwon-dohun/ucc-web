"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOfficer } from "@/lib/manage";
import { kstToIso } from "@/lib/format";

/** 지난 행사를 복제해서 초안을 만든다. 날짜와 메뉴 수량만 비워두고 나머지는 그대로 */
export async function cloneEvent(sourceId: string) {
  const { org, viewer } = await requireOfficer();
  const supabase = await createClient();
  const { data: src } = await supabase.from("events").select("*").eq("id", sourceId).eq("org_id", org.id).single();
  if (!src) throw new Error("가져올 행사를 찾지 못했어요");
  const { data: srcOptions } = await supabase.from("event_options").select("name, quantity, sort").eq("event_id", sourceId).order("sort");

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      org_id: org.id,
      series_id: src.series_id,
      source_event_id: src.id,
      kind: src.kind,
      status: "draft",
      title: nextTitle(src.title),
      semester: currentSemester(),
      term: org.term,
      greeting: src.greeting,
      location: src.location,
      audience: src.audience,
      dues_only: src.dues_only,
      per_person: src.per_person,
      show_remaining: src.show_remaining,
      leftovers_open: src.leftovers_open,
      created_by: viewer.profile.id,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "초안을 만들지 못했어요");

  // 메뉴는 이름을 비워둔다. 지난번 메뉴는 화면에 힌트로 보여준다
  const qty = srcOptions?.reduce((s, o) => s + o.quantity, 0) ?? 60;
  await supabase.from("event_options").insert({ event_id: created.id, name: "", quantity: qty, sort: 0 });
  redirect(`/manage/events/${created.id}/edit`);
}

export async function createBlankEvent(seriesName: string, kind: "giveaway" | "signup" | "notice") {
  const { org, viewer } = await requireOfficer();
  const supabase = await createClient();
  let { data: series } = await supabase.from("event_series").select("id").eq("org_id", org.id).eq("name", seriesName).maybeSingle();
  if (!series && seriesName) {
    const { data } = await supabase.from("event_series").insert({ org_id: org.id, name: seriesName, kind }).select("id").single();
    series = data;
  }
  const { data: created, error } = await supabase
    .from("events")
    .insert({
      org_id: org.id,
      series_id: series?.id ?? null,
      kind,
      status: "draft",
      title: seriesName || "새 행사",
      semester: currentSemester(),
      term: org.term,
      location: org.room,
      created_by: viewer.profile.id,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "초안을 만들지 못했어요");
  if (kind === "giveaway") await supabase.from("event_options").insert({ event_id: created.id, name: "", quantity: 60, sort: 0 });
  redirect(`/manage/events/${created.id}/edit`);
}

export type SaveState = { ok: boolean; message?: string; missing?: string[] };

/** 초안 저장. publish=true면 빈칸을 확인하고 공개한다 */
export async function saveEvent(eventId: string, publish: boolean, _prev: SaveState, form: FormData): Promise<SaveState> {
  await requireOfficer();
  const supabase = await createClient();
  const { data: current } = await supabase.from("events").select("status, kind").eq("id", eventId).single();
  if (!current || current.status !== "draft") return { ok: false, message: "공개된 행사는 여기서 고칠 수 없어요" };

  const s = (k: string) => String(form.get(k) ?? "").trim();
  const date = s("pickup_date");
  const start = s("pickup_start");
  const end = s("pickup_end");
  const openDate = s("open_date");
  const openTime = s("open_time");
  const names = form.getAll("option_name").map((v) => String(v).trim());
  const qtys = form.getAll("option_qty").map((v) => Number(v));
  const staff = form.getAll("staff").map(String);

  const giveaway = current.kind === "giveaway";
  const missing: string[] = [];
  if (!date) missing.push("수령 날짜");
  if (!openDate) missing.push("신청 열리는 날");
  if (giveaway && (names.length === 0 || names.some((n) => !n))) missing.push("메뉴 이름");
  if (giveaway && !staff.length) missing.push("현장 담당");
  if (publish && missing.length) return { ok: false, missing, message: `${missing.length}칸을 채우면 공개할 수 있어요` };

  const patch: Record<string, unknown> = {
    title: s("title") || "새 행사",
    greeting: s("greeting") || null,
    location: s("location") || null,
    audience: s("audience") || "department",
    dues_only: s("dues_only") === "on",
    per_person: Math.max(1, Number(s("per_person")) || 1),
    show_remaining: s("show_remaining") === "on",
    leftovers_open: s("leftovers_open") === "on",
    pickup_starts_at: date && start ? kstToIso(date, start) : null,
    pickup_ends_at: date && end ? kstToIso(date, end) : null,
    opens_at: openDate && openTime ? kstToIso(openDate, openTime) : null,
  };
  if (publish) {
    patch.status = "published";
    patch.published_at = new Date().toISOString();
  }
  const { error } = await supabase.from("events").update(patch).eq("id", eventId);
  if (error) return { ok: false, message: error.message };

  await supabase.from("event_options").delete().eq("event_id", eventId);
  const rows = names
    .map((name, i) => ({ event_id: eventId, name, quantity: Math.max(0, qtys[i] || 0), sort: i }))
    .filter((r) => r.name || !publish);
  if (rows.length) await supabase.from("event_options").insert(rows);

  await supabase.from("event_staff").delete().eq("event_id", eventId);
  if (staff.length) await supabase.from("event_staff").insert(staff.map((user_id) => ({ event_id: eventId, user_id })));

  revalidatePath("/manage");
  if (publish) redirect(`/manage/events/${eventId}?published=1`);
  return { ok: true, message: "저장했어요" };
}

export async function deleteDraft(eventId: string) {
  await requireOfficer();
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", eventId).eq("status", "draft");
  redirect("/manage/events");
}

export async function answerSuggestion(id: string, form: FormData) {
  await requireOfficer();
  const answer = String(form.get("answer") ?? "").trim();
  if (!answer) return;
  const supabase = await createClient();
  await supabase.from("suggestions").update({ answer, answered_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/manage");
}

export async function addHandoverNote(seriesId: string, eventId: string | null, form: FormData) {
  const { viewer, org } = await requireOfficer();
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  const supabase = await createClient();
  await supabase.from("handover_notes").insert({
    series_id: seriesId,
    event_id: eventId,
    author_id: viewer.profile.id,
    author_label: `${org.term}대 ${viewer.profile.name}`,
    body: body.slice(0, 300),
  });
  revalidatePath(`/manage/history/${seriesId}`);
  if (eventId) revalidatePath(`/manage/events/${eventId}`);
}

function currentSemester() {
  const now = new Date(Date.now() + 9 * 3600_000);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  return m >= 8 ? `${y}-2` : m >= 2 ? `${y}-1` : `${y - 1}-2`;
}

/** "2026 1학기 기말고사 간식행사" → "2026 2학기 기말고사 간식행사". 학기와 해만 이번 것으로 바꾼다 */
function nextTitle(title: string) {
  const [y, t] = currentSemester().split("-");
  if (/\d{4}\s*\d학기/.test(title)) return title.replace(/\d{4}\s*\d학기/, `${y} ${t}학기`);
  return title.replace(/\d{4}/, y);
}
