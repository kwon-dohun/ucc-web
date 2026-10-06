import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Membership, Org, Profile } from "@/lib/types";

export type Viewer = {
  profile: Profile;
  department: { id: string; name: string; short_name: string; college: string };
  memberships: (Membership & { org: Org; unit_name: string | null })[];
  /** 운영진(회장 포함)으로 있는 학생회·동아리 */
  officerOrgs: Org[];
  /** 내 학과 학생회 (없으면 null) */
  council: Org | null;
  isPresidentOf: (orgId: string) => boolean;
};

/** 지금 세션이 고른 페르소나. 없으면 첫 화면으로 보낸다. */
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createClient();
  const { data: profileId } = await supabase.rpc("me");
  if (!profileId) redirect("/");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*, department:departments(*)").eq("id", profileId).single(),
    supabase
      .from("memberships")
      .select("*, org:orgs(*), unit:org_units(name)")
      .eq("user_id", profileId)
      .eq("active", true)
      .order("sort"),
  ]);
  if (!profile) redirect("/");

  const ms = (memberships ?? []).map((m) => ({ ...m, unit_name: m.unit?.name ?? null })) as Viewer["memberships"];
  const { data: council } = await supabase
    .from("orgs")
    .select("*")
    .eq("kind", "council")
    .eq("department_id", profile.department_id)
    .maybeSingle();

  return {
    profile: profile as Profile,
    department: profile.department,
    memberships: ms,
    officerOrgs: ms.filter((m) => m.role !== "member").map((m) => m.org),
    council: (council as Org) ?? null,
    isPresidentOf: (orgId) => ms.some((m) => m.org_id === orgId && m.role === "president"),
  };
});

export function councilTitle(org: Pick<Org, "name" | "term">, departmentName = "ITM전공") {
  return `${departmentName} 제${org.term}대 학생회 ${org.name}`;
}
