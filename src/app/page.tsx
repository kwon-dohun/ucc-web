import { ArrowRight, Check } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { enterAs } from "@/app/actions/session";
import { cn } from "@/lib/utils";

// 지난 간식행사 4회. 데모 화면에 들어가면 같은 숫자를 실제 기록으로 볼 수 있다.
const HISTORY = [
  { term: "2025-2 기말", menu: "컵밥 50개", minutes: "1시간 12분", noShow: 9, note: "14대 권태호", line: "줄이 복도 끝까지 섰어요. 테이블을 밖으로 빼두면 편해요." },
  { term: "2026-1 중간", menu: "육회덮밥 · 연어덮밥 60개", minutes: "38분", noShow: 6, note: "15대 이수민", line: "덮밥이 컵밥보다 훨씬 빨리 나가요." },
  { term: "2026-1 기말", menu: "DD삼겹 도시락 60개", minutes: "41분", noShow: 4, note: "15대 김서연", line: "메뉴를 둘로 나누면 인기 메뉴가 먼저 끝나요." },
];

const ROLES = [
  {
    role: "officer",
    who: "김서연",
    title: "운영진으로 둘러보기",
    sub: "ITM 학생회 부학생회장. 행사 만들기, 실시간 신청, 수령 체크, 대여",
  },
  {
    role: "president",
    who: "박지호",
    title: "학생회장으로",
    sub: "운영 전부 + 임기 넘기기",
  },
  {
    role: "student",
    who: "정하늘",
    title: "학생으로",
    sub: "ITM 2학년. 기회 찾기, 간식 신청, 대여 현황",
  },
];

export default async function Landing({ searchParams }: PageProps<"/">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-6xl content-center gap-12 px-5 py-10 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <section className="flex flex-col justify-center">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[10px] bg-coral text-[15px] font-black text-white">U</span>
          <span className="text-[15px] font-bold">UCC 유크크</span>
        </div>

        <h1 className="mt-10 text-[30px] leading-[1.25] font-bold md:text-[40px]">
          작년 행사에서 시작하고,
          <br />
          끝나면 저절로 기록돼요.
        </h1>
        <p className="mt-4 max-w-[34rem] text-[15px] leading-7 text-ink-2 md:text-base">
          학생회·동아리 운영을 카톡, 구글폼, 엑셀 대신 한곳에서. 학생은 이름과 학번을 다시 적지 않고 신청하고, 다음 기수는
          지난 기록 위에서 시작해요.
        </p>

        <div className="mt-9 max-w-md space-y-2.5">
          {ROLES.map((r, i) => (
            <form key={r.role} action={enterAs.bind(null, r.role)}>
              <SubmitButton
                type="submit"
                pendingText={<span className="py-3 text-[15px] font-bold">들어가는 중</span>}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl px-4 text-left transition-[background-color,border-color,transform] duration-150 active:translate-y-px",
                  i === 0
                    ? "min-h-16 bg-coral text-white shadow-md hover:bg-coral-deep"
                    : "min-h-14 border border-line-strong bg-surface hover:border-ink-4",
                )}
              >
                <span className="min-w-0 flex-1 py-3">
                  <span className="block text-[15px] font-bold">
                    {r.title}
                    <span className={cn("ml-2 text-[13px] font-medium", i === 0 ? "text-white/80" : "text-ink-3")}>{r.who}</span>
                  </span>
                  <span className={cn("mt-0.5 block text-[13px] leading-5", i === 0 ? "text-white/85" : "text-ink-3")}>{r.sub}</span>
                </span>
                <ArrowRight className="size-[18px] shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
              </SubmitButton>
            </form>
          ))}
        </div>
        {error ? (
          <p role="alert" className="mt-4 max-w-md rounded-lg bg-coral-tint px-3 py-2 text-[13px] font-medium text-coral-ink">
            {error}
          </p>
        ) : null}
        <p className="mt-6 text-[12.5px] leading-5 text-ink-3">
          데모예요. 화면 속 이름, 학번, 학생회 이름은 모두 가명이고 숫자는 예시예요.
        </p>
      </section>

      <section aria-label="간식행사 기록 예시" className="self-center">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-md md:p-7">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-bold">간식행사</h2>
            <span className="text-[13px] text-ink-3">ITM 학생회 · 지난 기록</span>
          </div>
          <ol className="mt-5 space-y-5">
            {HISTORY.map((h) => (
              <li key={h.term} className="grid grid-cols-[4.75rem_1fr] gap-3">
                <span className="num pt-0.5 text-[12.5px] font-semibold text-ink-3">{h.term}</span>
                <div className="min-w-0">
                  <p className="text-[14.5px] leading-6 font-semibold">
                    {h.menu}, <b className="font-bold">{h.minutes}</b> 만에 마감
                  </p>
                  <p className="text-[13px] text-ink-3">안 온 신청자 {h.noShow}명</p>
                  <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px] leading-5 text-ink-2">
                    “{h.line}” <span className="text-ink-3">— {h.note}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-coral-line bg-coral-tint/50 px-4 py-3.5">
            <Check className="size-4 shrink-0 text-coral-ink" />
            <p className="text-[13.5px] leading-5 text-ink-2">
              <b className="font-semibold text-ink">2026-2 중간고사</b>는 지난번 걸 복제해서 바뀐 4칸만 채웠어요. 지금 신청 받는 중.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
