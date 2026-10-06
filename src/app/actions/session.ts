"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const HOME: Record<string, string> = { student: "/home", officer: "/manage", president: "/manage" };

export async function enterAs(role: string) {
  if (!(role in HOME)) throw new Error("없는 데모 역할이에요");
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      redirect(`/?error=${encodeURIComponent("데모 로그인이 아직 꺼져 있어요. 잠시 뒤 다시 시도해주세요.")}`);
    }
  }

  const { error } = await supabase.rpc("choose_persona", { p_role: role });
  if (error) redirect(`/?error=${encodeURIComponent(error.message)}`);
  redirect(HOME[role]);
}

export async function leave() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
