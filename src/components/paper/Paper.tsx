import { cn } from "@/lib/utils";
import { type CSSProperties, type ReactNode } from "react";

type Tone =
  | "paper"
  | "cream"
  | "warm"
  | "blue"
  | "green"
  | "pink"
  | "yellow"
  | "purple";

type Pattern = "none" | "ruled" | "grid" | "grid-fine" | "dots";

const tones: Record<Tone, string> = {
  paper: "bg-paper",
  cream: "bg-cream",
  warm: "bg-paper-warm",
  blue: "bg-paper-blue",
  green: "bg-paper-green",
  pink: "bg-paper-pink",
  yellow: "bg-paper-yellow",
  purple: "bg-paper-purple",
};

const patterns: Record<Pattern, string> = {
  none: "",
  ruled: "ruled",
  grid: "gridpaper",
  "grid-fine": "gridpaper-fine",
  dots: "dotpaper",
};

export function Sheet({
  children,
  tone = "paper",
  pattern = "none",
  tilt = 0,
  className,
  style,
  edge = "clean",
}: {
  children?: ReactNode;
  tone?: Tone;
  pattern?: Pattern;
  tilt?: number;
  className?: string;
  style?: CSSProperties;
  edge?: "clean" | "torn-bottom" | "torn-top";
}) {
  return (
    <div
      className={cn(
        "grain relative shadow-sheet",
        tones[tone],
        patterns[pattern],
        edge === "torn-bottom" && "torn-bottom",
        edge === "torn-top" && "torn-top",
        className,
      )}
      style={{ rotate: `${tilt}deg`, ...style }}
    >
      {children}
    </div>
  );
}

/** A short strip of washi tape. Position with the className (absolute offsets). */
export function Tape({
  className,
  color = "yellow",
  angle = -4,
  width = 92,
}: {
  className?: string;
  color?: "yellow" | "blue" | "pink" | "green" | "purple";
  angle?: number;
  width?: number;
}) {
  const tint: Record<string, string> = {
    yellow: "var(--yellow)",
    blue: "var(--blue)",
    pink: "var(--pink)",
    green: "var(--green)",
    purple: "var(--purple)",
  };
  return (
    <span
      aria-hidden
      className={cn("tape group-hover:-translate-y-[2px]", className)}
      style={{
        width,
        height: 26,
        rotate: `${angle}deg`,
        background: `color-mix(in oklab, ${tint[color]} 42%, oklch(1 0 0))`,
        clipPath:
          "polygon(0 3px, 100% 0, 100% calc(100% - 2px), 0 100%)",
      }}
    />
  );
}

/** Restrained metal paperclip that overlaps a page edge. */
export function Paperclip({
  className,
  angle = -14,
  size = 46,
}: {
  className?: string;
  angle?: number;
  size?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 60"
      width={size * 0.4}
      height={size}
      className={cn("drop-shadow-[0_2px_3px_rgba(90,70,40,0.28)]", className)}
      style={{ rotate: `${angle}deg` }}
    >
      <path
        d="M7 12v33a5 5 0 0 0 10 0V10a7 7 0 0 0-14 0v38a9 9 0 0 0 18 0V17"
        fill="none"
        stroke="oklch(0.72 0.012 250)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M7 12v33a5 5 0 0 0 10 0V10a7 7 0 0 0-14 0v38a9 9 0 0 0 18 0V17"
        fill="none"
        stroke="oklch(0.94 0.008 250)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small hand-drawn arrow used for margin annotations. */
export function HandArrow({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 80 40"
      className={cn("h-8 w-16 text-ink-faint", className)}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M3 8c18 22 42 27 70 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M62 24c5 3 9 5 11 8m-3-16c1 4 2 7 3 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Editorial micro-label, e.g. "section 02 · deadlines" */
export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-ink-faint",
        className,
      )}
    >
      {children}
    </span>
  );
}
