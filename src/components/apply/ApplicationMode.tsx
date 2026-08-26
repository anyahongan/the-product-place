import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ApplicationMode as Mode } from "@/types/apply";

const modes: {
  id: Mode;
  label: string;
  blurb: string;
}[] = [
  {
    id: "manual",
    label: "Manual",
    blurb: "Opens the original employer application link. You drive every step.",
  },
  {
    id: "quick",
    label: "Quick",
    blurb: "Opens a materials packet from your Profile, then the employer link. You still submit.",
  },
  {
    id: "auto",
    label: "Auto",
    blurb: "Queues roles locally and walks you through opening them. Never auto-submits.",
  },
];

export function ApplicationMode({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (mode: Mode) => void;
}) {
  const reduced = useReducedMotion();
  const active = modes.find((m) => m.id === value) ?? modes[0]!;

  return (
    <div className="border-2 border-ink bg-paper shadow-hard-sm">
      <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-blue px-4 py-2 text-paper">
        <span className="font-display text-[1.05rem] font-black uppercase tracking-[-0.03em]">
          Application mode
        </span>
        <span className="tag text-paper/80">Saved on this device</span>
      </div>

      <div
        role="radiogroup"
        aria-label="Application mode"
        className="relative grid grid-cols-3 border-b-2 border-ink"
      >
        {modes.map((mode) => {
          const selected = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(mode.id)}
              className={cn(
                "focus-ink relative z-10 px-2 py-3.5 text-center outline-none sm:px-4",
                selected ? "text-ink" : "text-ink-soft hover:bg-yellow-wash",
              )}
            >
              {selected && (
                <motion.span
                  {...(reduced ? {} : { layoutId: "mode-indicator" })}
                  className="absolute inset-0 z-[-1] bg-yellow"
                  transition={{ duration: 0.2, ease: [0.2, 0.9, 0.2, 1] }}
                />
              )}
              <span className="font-display text-[0.95rem] font-black uppercase tracking-[-0.02em] sm:text-[1.15rem]">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>

      <p
        className="px-4 py-3 text-[0.92rem] leading-snug text-ink-soft"
        id="mode-help"
      >
        <span className="tag text-ink">{active.label}: </span>
        {active.blurb}
      </p>
    </div>
  );
}
