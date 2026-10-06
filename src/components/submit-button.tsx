"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 서버 액션 form 안에서 누르면 바로 진행 중으로 바뀐다 */
export function SubmitButton({
  children,
  pendingText,
  className,
  ...props
}: ComponentProps<"button"> & { pendingText?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button {...props} disabled={pending || props.disabled} aria-busy={pending} className={cn(className, pending && "cursor-progress")}>
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="size-4 animate-spin" />
          {pendingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
