"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleSave } from "@/app/actions/student";
import { cn } from "@/lib/utils";

export function SaveButton({ id, saved, compact }: { id: string; saved: boolean; compact?: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? "저장 취소" : "저장"}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await toggleSave(id, !optimistic);
        })
      }
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-[10px] font-semibold transition-colors",
        compact ? "size-10" : "h-11 px-4 text-[14px]",
        optimistic ? "text-coral-ink" : "text-ink-3 hover:bg-panel hover:text-ink",
        !compact && (optimistic ? "bg-coral-tint" : "border border-line-strong bg-surface"),
      )}
    >
      <Bookmark className="size-[18px]" fill={optimistic ? "currentColor" : "none"} />
      {compact ? null : optimistic ? "저장함" : "저장"}
    </button>
  );
}
