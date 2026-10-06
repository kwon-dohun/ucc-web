"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export async function toggleSave(opportunityId: string, save: boolean) {
  const { profile } = await getViewer();
  const supabase = await createClient();
  if (save) {
    await supabase.from("saves").upsert({ user_id: profile.id, opportunity_id: opportunityId });
  } else {
    await supabase.from("saves").delete().eq("user_id", profile.id).eq("opportunity_id", opportunityId);
  }
  revalidatePath("/home");
  revalidatePath("/calendar");
}

export async function sendSuggestion(orgId: string, form: FormData) {
  await getViewer();
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  const supabase = await createClient();
  await supabase.from("suggestions").insert({ org_id: orgId, body: body.slice(0, 500) });
  revalidatePath("/org");
}

export async function disputeRental(rentalId: string) {
  const supabase = await createClient();
  await supabase.rpc("dispute_rental", { p_rental: rentalId });
  revalidatePath("/org");
}

export async function restoreTerm(orgId: string) {
  const supabase = await createClient();
  await supabase.rpc("demo_restore_term", { p_org: orgId });
  revalidatePath("/", "layout");
}
