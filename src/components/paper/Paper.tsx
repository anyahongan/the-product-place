import { cn } from "@/lib/utils";
import { type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export type Tone =
  | "paper"
  | "paper-2"
  | "blue"
  | "green"
  | "pink"
  | "yellow"
  | "purple"
  | "ink";

export type Pattern = "none" | "ruled" | "grid" | "grid-fine" | "dots";

const solid: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  "paper-2": "bg-paper-2 text-ink",
  blue: "bg-blue text-paper",
  green: "bg-green text-ink",
  pink: "bg-pink text-paper",
  yellow: "bg-yellow text-ink",
  purple: "bg-purple text-paper",
  ink: "bg-ink text-paper",
};

const wash: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  "paper-2": "bg-paper-2 text-ink",
  blue: "bg-blue-wash text-ink",
  green: "bg-green-wash text-ink",
  pink: "bg-pink-wash text-ink",
  yellow: "bg-yellow-wash text-ink",
  purple: "bg-purple-wash text-ink",
  ink: "bg-paper-2 text-ink",
};

const patterns: Record<Pattern, string> = {
  none: "",
  ruled: "ruled",
  grid: "gridpaper",
  "grid-fine": "gridpaper-fine",
  dots: "dotpaper",
};

/**
 * A rectangular sheet of paper. Straight edges, hard ink border, hard shadow.
 * Use `tone` for a real block of colour, `soft` for a light wash.
 */
export function Sheet({
  children,
  tone = "paper",
  pattern = "none",
  soft = false,
  tilt = 0,
  bordered = true,
  shadow = "sheet",
  edge = "clean",
  className,
  style,
}: {
  children?: ReactNode;
  tone?: Tone;
  pattern?: Pattern;
  soft?: boolean;
  tilt?: number;
  bordered?: boolean;
  shadow?: "none" | "sheet" | "hard" | "hard-sm" | "lift";
  edge?:
    | "clean"
    | "torn-bottom"
    | "torn-top"
    | "corner-cut"
    | "corner-cut-l"
    | "notch";
  className?: string;
  style?: CSSProperties;
}) {
  const shadows = {
    none: "",
    sheet: "shadow-sheet",
    hard: "shadow-hard",
    "hard-sm": "shadow-hard-sm",
    lift: "shadow-lift",
  } as const;

  return (
    <div
      className={cn(
        "relative",
        (soft ? wash : solid)[tone],
        patterns[pattern],
        bordered && "border-2 border-ink",
        shadows[shadow],
        edge === "torn-bottom" && "torn-bottom",
        edge === "torn-top" && "torn-top",
        edge === "corner-cut" && "corner-cut",
        edge === "corner-cut-l" && "corner-cut-l",
        edge === "notch" && "notch-both",
        className,
      )}
      style={{ rotate: `${tilt}deg`, ...style }}
    >
      {children}
    </div>
  );
}

/** A strip of bright washi tape. Position with absolute offsets on className. */
export function Tape({
  className,
  color = "yellow",
  angle = -4,
  width = 120,
  height = 30,
  variant = "stripe",
  style,
}: {
  className?: string;
  color?: "yellow" | "blue" | "pink" | "green" | "purple";
  angle?: number;
  width?: number | string;
  height?: number;
  variant?: "stripe" | "check" | "flat";
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "tape",
        variant === "check" && "tape-check",
        "group-hover:-translate-y-[3px]",
        className,
      )}
      style={{
        width,
        height,
        rotate: `${angle}deg`,
        ["--tape-color" as string]: `var(--${color})`,
        ...(variant === "flat" ? { backgroundImage: "none" } : null),
        ...style,
      }}
    />
  );
}

/** Dimensional binder clip that bites over a paper edge. */
export function Clip({
  className,
  angle = 0,
  size = 56,
  color = "ink",
}: {
  className?: string;
  angle?: number;
  size?: number;
  color?: "ink" | "blue" | "pink" | "purple" | "green" | "yellow";
}) {
  const slotStroke =
    color === "yellow" || color === "green" ? "var(--ink)" : "var(--paper)";
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 56"
      width={size * 0.72}
      height={size}
      className={cn("drop-shadow-[3px_3px_0_rgba(20,20,30,0.16)]", className)}
      style={{ rotate: `${angle}deg` }}
    >
      <path
        d="M4 6h32v34l-16 12L4 40Z"
        fill={`var(--${color})`}
        stroke="var(--ink)"
        strokeWidth="2"
      />
      <path d="M11 8v30M29 8v30" stroke={slotStroke} strokeWidth="2.4" opacity="0.75" />
      <rect x="9" y="1" width="22" height="7" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
    </svg>
  );
}

/** Kept for compatibility — now a graphic binder clip. */
export function Paperclip(props: Parameters<typeof Clip>[0]) {
  return <Clip {...props} />;
}

/** A thick arrow that draws itself into place on scroll. */
export function Arrow({
  className,
  flip = false,
  color = "currentColor",
  delay = 0,
}: {
  className?: string;
  flip?: boolean;
  color?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <svg
      aria-hidden
      viewBox="0 0 96 40"
      className={cn("h-9 w-24", className)}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <motion.path
        d="M4 10C28 34 58 34 90 20"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
        initial={reduced ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay, ease: [0.2, 0.9, 0.2, 1] }}
      />
      <motion.path
        d="M74 8l17 12-15 12"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.3, delay: delay + 0.4 }}
      />
    </svg>
  );
}

/** Kept for compatibility. */
export function HandArrow(props: Parameters<typeof Arrow>[0]) {
  return <Arrow {...props} />;
}

/** Mono, tracked-out micro label. */
export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("tag text-ink-soft", className)}>{children}</span>;
}

/** A page tab that sticks out of a sheet edge. */
export function Tab({
  children,
  color = "blue",
  className,
  side = "top",
}: {
  children: ReactNode;
  color?: "blue" | "pink" | "green" | "yellow" | "purple" | "ink";
  className?: string;
  side?: "top" | "left" | "right";
}) {
  const light = color === "yellow" || color === "green";
  return (
    <span
      className={cn(
        "tag inline-block border-2 border-ink px-3 py-1",
        light ? "text-ink" : "text-paper",
        side === "left" && "[writing-mode:vertical-rl] rotate-180",
        side === "right" && "[writing-mode:vertical-rl]",
        className,
      )}
      style={{
        background: `var(--${color})`,
        clipPath:
          side === "top"
            ? "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 10px 100%)"
            : undefined,
      }}
    >
      {children}
    </span>
  );
}

/** Oversized section number used as a graphic element. */
export function BigNumber({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none select-none font-display font-black leading-[0.7] tracking-[-0.06em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
