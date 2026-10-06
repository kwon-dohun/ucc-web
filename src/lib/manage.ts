import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";

/** 운영 화면은 학생회 운영진만. 아니면 학생 홈으로 */
export async function requireOfficer() {
  const viewer = await getViewer();
  const membership = viewer.memberships.find((m) => m.role !== "member" && m.org.kind === "council");
  if (!membership) redirect("/home");
  return {
    viewer,
    org: membership.org,
    membership,
    isPresident: membership.role === "president",
    orgTitle: `${viewer.department.name} 제${membership.org.term}대 학생회 ${membership.org.name}`,
  };
}
