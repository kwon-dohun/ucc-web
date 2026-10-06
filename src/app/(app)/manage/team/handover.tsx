"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type Officer = {
  id: string;
  name: string;
  studentNo: string;
  grade: number;
  title: string;
  unitId: string | null;
  unitName: string;
  role: string;
};

/** 4학년 아닌 임원이 기본으로 이어간다. 다음 직책은 한 단계 위로 제안 */
function suggestTitle(o: Officer) {
  if (o.title.endsWith("차장")) return o.title.replace("차장", "부장");
  if (o.title.endsWith("부원")) return o.title.replace("부원", "차장");
  return o.title;
}

export function Handover({ orgId, term, officers }: { orgId: string; term: number; officers: Officer[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const candidates = officers.filter((o) => o.role !== "president");
  const [next, setNext] = useState<string>(candidates.find((o) => o.title.includes("기획부장"))?.id ?? candidates[0]?.id ?? "");
  const [keep, setKeep] = useState<Record<string, string>>(() =>
    Object.fromEntries(officers.filter((o) => o.grade < 4 && o.role !== "president").map((o) => [o.id, suggestTitle(o)])),
  );
  const [keepUnits, setKeepUnits] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  const nextName = officers.find((o) => o.id === next)?.name;
  const leaving = officers.filter((o) => !keep[o.id] && o.id !== next);

  function submit() {
    start(async () => {
      const payload = Object.entries(keep)
        .filter(([id]) => id !== next)
        .map(([id, title]) => ({ user_id: id, unit_id: officers.find((o) => o.id === id)?.unitId ?? "", title }));
      const { error, data } = await supabase.rpc("handover_term", {
        p_org: orgId,
        p_next_president: next,
        p_keep: payload,
        p_keep_units: keepUnits,
      });
      if (error) return void toast.error(error.message);
      toast.success(`${data}대가 시작됐어요`, { description: `${nextName} 회장에게 넘겼어요. 지난 기록은 그대로 남아요.` });
      router.push("/me?handed=1");
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 md:p-6">
      <ol className="space-y-8">
        <li>
          <h3 className="text-[14.5px] font-bold">1. 다음 회장</h3>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="다음 회장">
            {candidates
              .filter((o) => o.grade < 4)
              .map((o) => (
                <button
                  key={o.id}
                  role="radio"
                  aria-checked={next === o.id}
                  onClick={() => setNext(o.id)}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-full pr-4 pl-1.5 text-[13.5px] font-semibold transition-colors",
                    next === o.id ? "bg-ink text-white" : "border border-line-strong bg-surface text-ink-2 hover:border-ink-4",
                  )}
                >
                  <Avatar name={o.name} size={30} tone={next === o.id ? "coral" : "neutral"} />
                  {o.name}
                  <span className={cn("text-[12px] font-medium", next === o.id ? "text-white/70" : "text-ink-3")}>{o.title}</span>
                </button>
              ))}
          </div>
        </li>

        <li>
          <h3 className="text-[14.5px] font-bold">
            2. {term + 1}대에도 이어가는 사람 <span className="num font-semibold text-ink-3">{Object.keys(keep).filter((id) => id !== next).length}</span>
          </h3>
          <p className="mt-0.5 text-[12.5px] text-ink-3">4학년은 기본으로 빠져 있어요. 체크하지 않은 사람은 권한이 정리돼요.</p>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {officers
              .filter((o) => o.id !== next && o.role !== "president")
              .map((o) => {
                const on = o.id in keep;
                return (
                  <li key={o.id} className="flex items-center gap-3 px-3 py-2">
                    <button
                      role="checkbox"
                      aria-checked={on}
                      aria-label={`${o.name} 이어가기`}
                      onClick={() =>
                        setKeep((p) => {
                          const c = { ...p };
                          if (on) delete c[o.id];
                          else c[o.id] = suggestTitle(o);
                          return c;
                        })
                      }
                      className={cn("grid size-6 shrink-0 place-items-center rounded-md border", on ? "border-ink bg-ink text-white" : "border-line-strong")}
                    >
                      {on ? <Check className="size-4" /> : null}
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="text-[14px] font-semibold">{o.name}</span>
                      <span className="ml-2 text-[12.5px] text-ink-3">
                        {o.grade}학년, {o.title}
                      </span>
                    </span>
                    {on ? (
                      <label className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
                        <span className="hidden sm:inline">다음 직책</span>
                        <input
                          aria-label={`${o.name} 다음 직책`}
                          value={keep[o.id]}
                          onChange={(e) => setKeep((p) => ({ ...p, [o.id]: e.target.value }))}
                          className="h-9 w-24 rounded-lg border border-line bg-surface-2 px-2 text-[13px] text-ink outline-none focus:border-coral"
                        />
                      </label>
                    ) : (
                      <span className="text-[12.5px] text-ink-4">권한 정리</span>
                    )}
                  </li>
                );
              })}
          </ul>
        </li>

        <li>
          <h3 className="text-[14.5px] font-bold">3. 조직도</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="조직도">
            {[
              [true, `${term}대 그대로`, "부서와 직책을 유지해요"],
              [false, "새로 짜기", `${term + 1}대 회장이 정해요`],
            ].map(([v, t, s]) => (
              <button
                key={String(v)}
                role="radio"
                aria-checked={keepUnits === v}
                onClick={() => setKeepUnits(v as boolean)}
                className={cn(
                  "rounded-xl px-4 py-3 text-left transition-colors",
                  keepUnits === v ? "border-2 border-ink bg-surface" : "border border-line-strong bg-surface hover:border-ink-4",
                )}
              >
                <span className="block text-[14px] font-semibold">{t as string}</span>
                <span className="block text-[12.5px] text-ink-3">{s as string}</span>
              </button>
            ))}
          </div>
        </li>
      </ol>

      <div className="mt-8 border-t border-line pt-5">
        {confirm ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-[13.5px] leading-6 text-ink-2">
              <b className="font-semibold text-ink">{nextName}</b> 회장에게 넘기고, {leaving.length}명의 권한을 정리해요. 지난 기록은 그대로 남아요.
            </p>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              다시 보기
            </Button>
            <Button variant="primary" onClick={submit} disabled={pending || !next}>
              {pending ? "넘기는 중" : `${term + 1}대 시작하기`}
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="lg" onClick={() => setConfirm(true)} disabled={!next}>
            {term + 1}대에 넘기기
          </Button>
        )}
      </div>
    </div>
  );
}
