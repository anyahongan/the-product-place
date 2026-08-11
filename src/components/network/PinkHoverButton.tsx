import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const PINK = "var(--pink)";
const PAPER = "var(--paper)";
const INK = "var(--ink)";

type Variant = "paper" | "ink" | "close" | "closeSm" | "xs" | "tag";

const baseByVariant: Record<Variant, string> = {
  paper:
    "focus-ink border-2 border-ink px-3 py-2 font-display text-xs font-black uppercase outline-none transition-[background-color,color] duration-150",
  ink: "focus-ink border-2 border-ink px-3 py-2 font-display text-xs font-black uppercase outline-none transition-[background-color,color] duration-150",
  close:
    "focus-ink border-2 border-ink px-3 py-2 font-display text-sm font-black uppercase outline-none transition-[background-color,color] duration-150",
  closeSm:
    "focus-ink border-2 border-ink px-3 py-1.5 font-display text-sm font-black uppercase outline-none transition-[background-color,color] duration-150",
  xs: "focus-ink border-2 border-ink px-2.5 py-1.5 font-display text-[0.65rem] font-black uppercase leading-none outline-none transition-[background-color,color] duration-150",
  tag: "focus-ink tag border-2 border-ink px-2 py-1 font-black uppercase outline-none transition-[background-color,color] duration-150",
};

/**
 * Guaranteed pink hover fill (same approach as the outreach-format chooser).
 * CSS-only hover was unreliable / too subtle on this page.
 */
export function PinkHoverButton({
  variant = "paper",
  className,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  const [hot, setHot] = useState(false);
  const idleBg = variant === "ink" ? INK : PAPER;
  const idleFg = variant === "ink" ? PAPER : INK;

  return (
    <button
      type="button"
      {...props}
      className={cn(baseByVariant[variant], className)}
      style={{
        ...style,
        background: hot ? PINK : ((style?.background as string | undefined) ?? idleBg),
        color: hot ? PAPER : ((style?.color as string | undefined) ?? idleFg),
      }}
      onMouseEnter={(e) => {
        setHot(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHot(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setHot(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setHot(false);
        onBlur?.(e);
      }}
    >
      {children}
    </button>
  );
}
