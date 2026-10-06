// 날짜는 항상 한국 시간으로 보여준다.
const TZ = "Asia/Seoul";
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function parts(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(d);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? "";
  const dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    hh: get("hour") === "24" ? "00" : get("hour"),
    mm: get("minute"),
    w: WEEK[dayIdx],
    dayIdx,
  };
}

/** 2026-10-06 형식의 한국 날짜 키 */
export function dayKey(iso: string | Date) {
  const p = parts(iso);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function todayKey() {
  return dayKey(new Date());
}

export function fmtDate(iso: string | Date) {
  const p = parts(iso);
  return `${p.m}월 ${p.d}일 (${p.w})`;
}

export function fmtShortDate(iso: string | Date) {
  const p = parts(iso);
  return `${p.m}/${p.d}`;
}

export function fmtTime(iso: string | Date) {
  const p = parts(iso);
  return `${p.hh}:${p.mm}`;
}

export function fmtDateTime(iso: string | Date) {
  return `${fmtDate(iso)} ${fmtTime(iso)}`;
}

export function weekday(iso: string | Date) {
  return parts(iso).w;
}

export function monthDay(iso: string | Date) {
  const p = parts(iso);
  return { m: p.m, d: p.d, w: p.w, dayIdx: p.dayIdx };
}

/** 오늘부터 마감까지 남은 날. 지났으면 음수 */
export function daysUntil(iso: string) {
  const a = new Date(`${todayKey()}T00:00:00+09:00`).getTime();
  const b = new Date(`${dayKey(iso)}T00:00:00+09:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function dday(iso: string) {
  const n = daysUntil(iso);
  if (n === 0) return "오늘 마감";
  if (n < 0) return "마감";
  return `D-${n}`;
}

/** "3분 전", "2일 지남" 같은 상대 시간 */
export function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

export function daysOverdue(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function minutesLabel(min: number | null | undefined) {
  if (min == null) return null;
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

/** 2026-2 → 2026년 2학기 */
export function semesterLabel(s: string) {
  const [y, t] = s.split("-");
  return `${y}년 ${t}학기`;
}

/** KST 기준 date + "HH:MM" → ISO */
export function kstToIso(date: string, time: string) {
  return new Date(`${date}T${time}:00+09:00`).toISOString();
}

export function addDaysKey(key: string, n: number) {
  const d = new Date(`${key}T12:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
}

/** 지금으로부터 n일 전(음수면 뒤)의 시각(ms). 서버 렌더에서 쓰는 기준 시각 */
export function msAgo(days: number) {
  return Date.now() - days * 86_400_000;
}
