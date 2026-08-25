import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const PINK = "var(--pink)";
const BLUE = "var(--blue)";
const YELLOW = "var(--yellow)";
const GREEN = "var(--green)";
const PURPLE = "var(--purple)";
const PAPER = "var(--paper)";
const INK = "var(--ink)";

type Variant = "paper" | "ink" | "close" | "closeSm" | "xs" | "tag";
export type HoverAccent = "pink" | "yellow" | "blue" | "green" | "purple";

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

function accentColors(accent: HoverAccent): { bg: string; fg: string } {
  switch (accent) {
    case "yellow":
      return { bg: YELLOW, fg: INK };
    case "green":
      return { bg: GREEN, fg: INK };
    case "blue":
      return { bg: BLUE, fg: PAPER };
    case "purple":
      return { bg: PURPLE, fg: PAPER };
    case "pink":
      return { bg: PINK, fg: PAPER };
    default:
      return { bg: PINK, fg: PAPER };
  }
}

/**
 * Guaranteed hover fill (CSS-only hover was unreliable / too subtle on this page).
 * Default accent is pink; pass hoverAccent for step/section themes.
 */
export function PinkHoverButton({
  variant = "paper",
  hoverAccent = "pink",
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
  hoverAccent?: HoverAccent;
  children: ReactNode;
}) {
  const [hot, setHot] = useState(false);
  const idleBg = variant === "ink" ? INK : PAPER;
  const idleFg = variant === "ink" ? PAPER : INK;
  const { bg: hotBg, fg: hotFg } = accentColors(hoverAccent);

  return (
    <button
      type="button"
      {...props}
      className={cn(baseByVariant[variant], className)}
      style={{
        ...style,
        background: hot ? hotBg : ((style?.background as string | undefined) ?? idleBg),
        color: hot ? hotFg : ((style?.color as string | undefined) ?? idleFg),
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
