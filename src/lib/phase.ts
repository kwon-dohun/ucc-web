export type EventPhase = "draft" | "scheduled" | "open" | "soldout" | "pickup" | "leftover" | "closed" | "finished";

/** 시간과 남은 개수로 지금 단계를 정한다 */
export function eventPhase(
  e: { status: string; opens_at: string | null; pickup_starts_at: string | null; pickup_ends_at: string | null },
  remaining: number,
  now = Date.now(),
): EventPhase {
  if (e.status === "draft") return "draft";
  if (e.status === "finished") return "finished";
  const t = (s: string | null) => (s ? new Date(s).getTime() : null);
  const opens = t(e.opens_at);
  const ps = t(e.pickup_starts_at);
  const pe = t(e.pickup_ends_at);
  if (opens && now < opens) return "scheduled";
  if (ps && now < ps) return remaining > 0 ? "open" : "soldout";
  if (pe && now < pe) return "pickup";
  if (pe && now >= pe) return "leftover";
  return remaining > 0 ? "open" : "soldout";
}

export const PHASE_LABEL: Record<EventPhase, string> = {
  draft: "초안",
  scheduled: "열리기 전",
  open: "신청 중",
  soldout: "신청 마감",
  pickup: "수령 중",
  leftover: "현장 배부",
  closed: "마감",
  finished: "끝남",
};
