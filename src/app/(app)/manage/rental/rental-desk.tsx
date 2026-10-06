"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, Badge, Button } from "@/components/ui";
import { daysOverdue, fmtDateTime, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ItemRow = { id: string; name: string; kind: "rental" | "consumable" | "fixture"; total: number; available: number | null; present: boolean };
export type OpenRental = {
  id: string;
  qty: number;
  lent_at: string;
  disputed_at: string | null;
  item: { name: string } | null;
  user: { name: string; student_no: string } | null;
};
type Student = { id: string; name: string; student_no: string; grade: number; department_id: string };
type Tab = "open" | "lend" | "give" | "stock";

export function RentalDesk({ items, open, me }: { orgId: string; me: string; items: ItemRow[]; open: OpenRental[] }) {
  const [tab, setTab] = useState<Tab>("open");
  const overdue = open.filter((r) => daysOverdue(r.lent_at) >= 1).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Count label="지금 대여 중" value={open.reduce((s, r) => s + r.qty, 0)} />
        <Count label="1일 넘게 반납 안 됨" value={overdue} tone={overdue ? "coral" : undefined} />
        <div className="col-span-2 flex items-center gap-2 sm:justify-end">
          <Button variant={tab === "lend" ? "ink" : "secondary"} size="lg" className="flex-1 sm:flex-none" onClick={() => setTab("lend")}>
            빌려주기
          </Button>
          <Button variant={tab === "give" ? "ink" : "secondary"} size="lg" className="flex-1 sm:flex-none" onClick={() => setTab("give")}>
            소모품 주기
          </Button>
        </div>
      </div>

      <div role="tablist" aria-label="대여 보기" className="mt-6 flex gap-1 border-b border-line">
        {(
          [
            ["open", "대여 중"],
            ["stock", "재고"],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px h-11 border-b-2 px-3 text-[14px] font-semibold",
              tab === k ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "open" ? <OpenList open={open} /> : null}
        {tab === "stock" ? <Stock items={items} /> : null}
        {tab === "lend" ? <Lend items={items.filter((i) => i.kind === "rental")} me={me} kind="rental" onDone={() => setTab("open")} /> : null}
        {tab === "give" ? <Lend items={items.filter((i) => i.kind === "consumable")} me={me} kind="consumable" onDone={() => setTab("stock")} /> : null}
      </div>
    </div>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone?: "coral" }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className={cn("num text-[26px] leading-8 font-bold", tone === "coral" && "text-coral-ink")}>{value}</p>
      <p className="text-[12.5px] text-ink-3">{label}</p>
    </div>
  );
}

function OpenList({ open }: { open: OpenRental[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());

  async function giveBack(r: OpenRental) {
    setBusy(r.id);
    const { error } = await supabase.rpc("return_rental", { p_rental: r.id });
    setBusy(null);
    if (error) return toast.error(error.message);
    setGone((s) => new Set(s).add(r.id));
    toast.success(`${r.user?.name} ${r.item?.name} 반납`, { description: `${fmtTime(new Date())}에 확인했어요` });
    router.refresh();
  }

  const rows = open.filter((r) => !gone.has(r.id));
  if (!rows.length) return <p className="py-8 text-center text-[13px] text-ink-3">빌려간 물건이 없어요.</p>;
  return (
    <>
      <p className="mb-2 text-[12.5px] text-ink-3">오래된 순. 물건을 눈으로 확인한 뒤 반납을 누르면 반납 시각과 확인한 사람이 남아요.</p>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {rows.map((r) => {
          const d = daysOverdue(r.lent_at);
          return (
            <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 md:px-4">
              <Avatar name={r.user?.name ?? "?"} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold">
                  {r.user?.name} <span className="num text-[12.5px] font-normal text-ink-3">{r.user?.student_no}</span>
                </p>
                <p className="text-[13px] text-ink-2">
                  {r.item?.name} {r.qty}개 · <span className="text-ink-3">{fmtDateTime(r.lent_at)}</span>
                </p>
              </div>
              {r.disputed_at ? <Badge tone="amber">본인 확인 요청</Badge> : null}
              {d >= 1 ? <Badge tone="coral">{d}일 지남</Badge> : null}
              <Button variant="secondary" size="md" disabled={busy === r.id} onClick={() => giveBack(r)}>
                반납
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Stock({ items }: { items: ItemRow[] }) {
  const groups: [string, ItemRow[], string][] = [
    ["대여 물품", items.filter((i) => i.kind === "rental"), "빌려가고 돌려줘요"],
    ["소모품", items.filter((i) => i.kind === "consumable"), "가져가면 기록해요"],
    ["비치 물품", items.filter((i) => i.kind === "fixture"), "학생회실에서 바로 써요"],
  ];
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {groups.map(([title, list, sub]) => (
        <section key={title}>
          <h3 className="text-[14px] font-bold">{title}</h3>
          <p className="mb-2 text-[12.5px] text-ink-3">{sub}</p>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {list.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[14px]">
                <span>{i.name}</span>
                {i.kind === "fixture" ? (
                  <span className={i.present ? "text-green-ink" : "text-coral-ink"}>{i.present ? "있어요" : "없어요"}</span>
                ) : (
                  <span className={cn("num font-semibold", i.available === 0 ? "text-coral-ink" : "text-green-ink")}>
                    {i.kind === "rental" ? `${i.available}/${i.total}` : `${i.available}개`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Lend({ items, me, kind, onDone }: { items: ItemRow[]; me: string; kind: "rental" | "consumable"; onDone: () => void }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [pending, start] = useTransition();

  useEffect(() => {
    const query = q.trim();
    if (query.length < 1 || student) return;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, student_no, grade, department_id")
        .or(`name.ilike.%${query}%,student_no.ilike.%${query}%`)
        .limit(6);
      setResults((data ?? []) as Student[]);
    }, 150);
    return () => clearTimeout(t);
  }, [q, student, supabase]);

  const chosen = Object.entries(qty).filter(([, n]) => n > 0);
  const summary = chosen.map(([id, n]) => `${items.find((i) => i.id === id)?.name} ${n}개`).join(", ");

  function submit() {
    if (!student || !chosen.length) return;
    start(async () => {
      for (const [id, n] of chosen) {
        const { error } =
          kind === "rental"
            ? await supabase.rpc("lend_item", { p_item: id, p_user: student.id, p_qty: n })
            : await supabase.rpc("give_consumable", { p_item: id, p_user: student.id, p_qty: n });
        if (error) return void toast.error(error.message);
      }
      toast.success(`${student.name}에게 ${summary}`, { description: `${fmtTime(new Date())}, 확인한 사람 ${me}` });
      router.refresh();
      onDone();
    });
  }

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-4 shadow-sm md:p-6">
      <h3 className="text-[16px] font-bold">{kind === "rental" ? "빌려주기" : "소모품 주기"}</h3>
      <p className="mt-0.5 text-[13px] text-ink-3">학생 폰이 없어도 임원 폰으로 끝나요. 학번이나 이름으로 찾아요.</p>

      {student ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-2 px-3.5 py-3">
          <Avatar name={student.name} size={36} tone="coral" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">{student.name}</p>
            <p className="num text-[12.5px] text-ink-3">
              {student.student_no}, {student.grade}학년
            </p>
          </div>
          <span className="text-[12.5px] text-ink-3">이름을 불러서 확인해요</span>
          <Button variant="ghost" size="sm" onClick={() => setStudent(null)}>
            바꾸기
          </Button>
        </div>
      ) : (
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="학번이나 이름"
            aria-label="학번이나 이름"
            className="h-12 w-full rounded-xl border border-line-strong bg-surface pr-4 pl-10 text-[15px] outline-none placeholder:text-ink-4 focus:border-coral"
          />
          {results.length && q.trim() ? (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-md">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setStudent(s)}
                    className="flex h-12 w-full items-center gap-3 px-3.5 text-left hover:bg-surface-2"
                  >
                    <span className="text-[14.5px] font-semibold">{s.name}</span>
                    <span className="num text-[12.5px] text-ink-3">
                      {s.student_no}, {s.grade}학년
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
        {items.map((i) => {
          const n = qty[i.id] ?? 0;
          const left = i.available ?? 0;
          return (
            <li key={i.id} className={cn("flex items-center gap-3 px-3.5 py-2", !left && "opacity-50")}>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-medium">{i.name}</span>
                <span className={cn("block text-[12.5px]", left ? "text-ink-3" : "text-coral-ink")}>{left ? `${left}개 남음` : "모두 나감"}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  aria-label={`${i.name} 하나 빼기`}
                  disabled={!n}
                  onClick={() => setQty((p) => ({ ...p, [i.id]: Math.max(0, n - 1) }))}
                  className="grid size-10 place-items-center rounded-lg border border-line text-ink-2 disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span className="num w-7 text-center text-[15px] font-semibold">{n}</span>
                <button
                  aria-label={`${i.name} 하나 더`}
                  disabled={n >= left}
                  onClick={() => setQty((p) => ({ ...p, [i.id]: n + 1 }))}
                  className="grid size-10 place-items-center rounded-lg border border-line text-ink-2 disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[13px] leading-5 text-ink-3">
        {student && chosen.length
          ? kind === "rental"
            ? `${student.name} 폰에 기록이 가고, 확인한 사람은 ${me}으로 남아요. 하루가 지나면 반납 목록 맨 위로 올라와요.`
            : `누가 언제 가져갔는지는 임원만 볼 수 있게 남고, 학생 화면의 남은 개수가 같이 줄어요.`
          : "학생과 물품을 고르면 버튼이 열려요."}
      </p>
      <Button variant="primary" size="lg" block className="mt-3" disabled={!student || !chosen.length || pending} onClick={submit}>
        {pending ? "기록하는 중" : student && chosen.length ? `${summary} ${kind === "rental" ? "빌려주기" : "주기"}` : kind === "rental" ? "빌려주기" : "주기"}
      </Button>
    </section>
  );
}
