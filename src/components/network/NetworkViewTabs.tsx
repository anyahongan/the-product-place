import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { NetworkView } from "@/types/network";

const views: { id: NetworkView; label: string; hint: string }[] = [
  { id: "contacts", label: "Contacts", hint: "People & matches" },
  { id: "follow-ups", label: "Follow-ups", hint: "What to do next" },
  { id: "conversations", label: "Conversations", hint: "History trail" },
];

export function NetworkViewTabs({
  value,
  onChange,
}: {
  value: NetworkView;
  onChange: (v: NetworkView) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label="Network views"
      className="relative flex w-full flex-wrap gap-2 border-2 border-ink bg-paper p-2 shadow-hard-sm"
    >
      {views.map((view) => {
        const active = value === view.id;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(view.id)}
            className={cn(
              "focus-ink relative z-10 min-w-[7rem] flex-1 px-4 py-3 text-left outline-none",
              active ? "text-paper" : "text-ink hover:bg-pink-wash",
            )}
          >
            {active && (
              <motion.span
                {...(reduced ? {} : { layoutId: "network-view-indicator" })}
                className="absolute inset-0 z-[-1] bg-pink"
                transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
              />
            )}
            <span className="font-display text-[1.05rem] font-black uppercase leading-none tracking-[-0.03em] sm:text-[1.2rem]">
              {view.label}
            </span>
            <span className={cn("tag mt-1.5 block", active ? "text-paper/85" : "text-ink-faint")}>
              {view.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
