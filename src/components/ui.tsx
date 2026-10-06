import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export const buttonStyles = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-150 select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-coral text-white shadow-sm hover:bg-coral-deep",
        secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2 hover:border-ink-4",
        quiet: "bg-panel text-ink-2 hover:bg-line hover:text-ink",
        ghost: "text-ink-2 hover:bg-panel hover:text-ink",
        ink: "bg-ink text-white hover:bg-ink-2",
        danger: "text-coral-ink hover:bg-coral-tint",
      },
      size: {
        sm: "h-8 px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-10 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-5 text-[15px] [&_svg]:size-[18px]",
        icon: "size-10 [&_svg]:size-[18px]",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

type ButtonVariants = VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, block, ...props }: ComponentProps<"button"> & ButtonVariants) {
  return <button className={cn(buttonStyles({ variant, size, block }), className)} {...props} />;
}

export function ButtonLink({
  className,
  variant,
  size,
  block,
  ...props
}: ComponentProps<typeof Link> & ButtonVariants) {
  return <Link className={cn(buttonStyles({ variant, size, block }), className)} {...props} />;
}

const badgeStyles = cva(
  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] leading-4 font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-panel text-ink-2",
        coral: "bg-coral-tint text-coral-ink",
        green: "bg-green-tint text-green-ink",
        amber: "bg-amber-tint text-amber-ink",
        ink: "bg-ink text-white",
        outline: "border border-line-strong text-ink-2",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  tone,
  className,
  children,
}: VariantProps<typeof badgeStyles> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeStyles({ tone }), className)}>{children}</span>;
}

/** 페이지 제목. 위에 작은 라벨 없이, 제목이 스스로 말한다 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        <h1 className="text-[22px] leading-8 font-bold md:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm leading-6 text-ink-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-baseline justify-between gap-4", className)}>
      <h2 className="text-[15px] leading-6 font-bold">{children}</h2>
      {aside ? <div className="text-[13px] text-ink-3">{aside}</div> : null}
    </div>
  );
}

export function Surface({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-line bg-surface", className)} {...props} />;
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center">
      <p className="text-sm font-semibold text-ink-2">{title}</p>
      {body ? <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-ink-3">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** 이니셜 동그라미. 사진 대신 쓴다 */
export function Avatar({ name, size = 28, tone = "neutral" }: { name: string; size?: number; tone?: "neutral" | "coral" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-bold",
        tone === "coral" ? "bg-coral-tint text-coral-ink" : "bg-panel text-ink-2",
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {name.replace(/^(남궁|선우|제갈|황보)/, "").slice(0, 1)}
    </span>
  );
}

export function Stat({ value, label, tone }: { value: ReactNode; label: string; tone?: "coral" | "green" }) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "num text-[22px] leading-7 font-bold",
          tone === "coral" && "text-coral-ink",
          tone === "green" && "text-green-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[12.5px] text-ink-3">{label}</div>
    </div>
  );
}
