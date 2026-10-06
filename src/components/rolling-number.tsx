"use client";

import { cn } from "@/lib/utils";

/** 값이 바뀌면 새 숫자가 아래에서 올라온다. key가 바뀌어 애니메이션이 다시 돈다 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("num relative inline-flex overflow-hidden align-bottom", className)} aria-live="polite">
      <span key={value} className="animate-roll-in inline-block">
        {value}
      </span>
    </span>
  );
}
