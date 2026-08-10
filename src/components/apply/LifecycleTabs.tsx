import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { LifecycleTab } from "@/types/apply";

const tabs: { id: LifecycleTab; label: string; hint: string }[] = [
  { id: "apply", label: "Apply", hint: "Discover & submit" },
  { id: "applied", label: "Applied", hint: "Track progress" },
  { id: "interviewing", label: "Interviewing", hint: "Prepare for roles" },
];

export function LifecycleTabs({
  value,
  onChange,
}: {
  value: LifecycleTab;
  onChange: (tab: LifecycleTab) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label="Application lifecycle"
      className="relative flex flex-wrap gap-2 border-2 border-ink bg-paper p-2 shadow-hard-sm sm:inline-flex sm:flex-nowrap"
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            id={`lifecycle-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "focus-ink relative z-10 min-w-[7.5rem] flex-1 px-4 py-3 text-left outline-none sm:flex-none",
              active ? "text-paper" : "text-ink hover:bg-blue-wash",
            )}
          >
            {active && (
              <motion.span
                {...(reduced ? {} : { layoutId: "lifecycle-indicator" })}
                className="absolute inset-0 z-[-1] bg-blue"
                transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
              />
            )}
            <span className="font-display text-[1.15rem] font-black uppercase leading-none tracking-[-0.03em] sm:text-[1.35rem]">
              {tab.label}
            </span>
            <span className={cn("tag mt-1.5 block", active ? "text-paper/85" : "text-ink-faint")}>
              {tab.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
