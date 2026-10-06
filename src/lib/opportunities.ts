import { daysUntil } from "@/lib/format";
import type { Opportunity, Profile } from "@/lib/types";

export const RECOGNIZED_CAP = 300; // 인정 비교과는 졸업요건에 300점까지만
export const EPIC_GOAL = 700;

export function isEligible(o: Opportunity, p: Profile) {
  if (o.eligible_grades?.length && !o.eligible_grades.includes(p.grade)) return false;
  if (o.eligible_departments?.length && !o.eligible_departments.includes(p.department_id)) return false;
  return true;
}

export function isOpen(o: Opportunity) {
  return !o.deadline || daysUntil(o.deadline) >= 0;
}

/** 인정 비교과 점수가 이미 한도면, 들어도 졸업요건 점수가 안 오른다 */
export function countsTowardEpic(o: Opportunity, p: Profile) {
  if (!o.epic_points) return false;
  if (o.epic_category === "recognized") return (p.epic?.recognized ?? 0) < RECOGNIZED_CAP;
  return true;
}

/** 추천 이유: 원문과 학생이 고른 정보에서 확인되는 사실만 */
export function reasons(o: Opportunity, p: Profile): string[] {
  const out: string[] = [];
  if (o.eligible_grades?.length && o.eligible_grades.includes(p.grade)) out.push(`${p.grade}학년에게 맞는 회차예요`);
  if (o.eligible_departments?.includes(p.department_id) && o.source_kind === "department")
    out.push("학과 홈페이지에만 올라와서 놓치기 쉬운 공지예요");
  if (o.department_id && o.department_id !== p.department_id && !o.eligible_departments?.length)
    out.push("다른 학과 프로그램이지만 누구나 들을 수 있어요");
  if (o.mode === "online") out.push("온라인이라 시간을 맞출 필요가 없어요");
  const overlap = o.tags.filter((t) => p.interests.includes(t) || p.wants.includes(t));
  if (overlap.length) out.push(`관심으로 고른 ${overlap.slice(0, 2).join(", ")}과 맞아요`);
  if (o.epic_points && countsTowardEpic(o, p)) out.push(`EPiC 졸업요건 ${o.epic_points}점이 인정돼요`);
  return out;
}

export function score(o: Opportunity, p: Profile) {
  let s = 0;
  if (!isEligible(o, p) || !isOpen(o) || o.admin_notice) return -1;
  s += o.tags.filter((t) => p.interests.includes(t) || p.wants.includes(t)).length * 3;
  if (o.eligible_grades?.includes(p.grade)) s += 2;
  if (o.eligible_departments?.includes(p.department_id)) s += 2;
  if (countsTowardEpic(o, p)) s += 1;
  if (o.deadline) s += Math.max(0, 3 - daysUntil(o.deadline) / 15);
  return s;
}

export const SOURCE_LABEL: Record<Opportunity["source_kind"], string> = {
  school: "학교",
  department: "학과",
  epic: "EPiC",
  contest: "공모전",
  scholarship: "장학",
  org: "학생회",
};
