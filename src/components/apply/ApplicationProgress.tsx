import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ProgressStage } from "@/types/apply";

const STAGES: ProgressStage[] = ["Submitted", "Recruiter Screen", "Interview", "Final", "Offer"];

export function ApplicationProgress({
  current,
  reached,
}: {
  current: ProgressStage;
  reached: ProgressStage[];
}) {
  const reduced = useReducedMotion();
  const currentIdx = STAGES.indexOf(current);
  const maxReached = Math.max(...reached.map((s) => STAGES.indexOf(s)), currentIdx);

  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {STAGES.map((stage, i) => {
        const done = i <= maxReached;
        const isCurrent = stage === current;
        return (
          <li key={stage} className="relative min-w-0">
            {i > 0 && (
              <motion.span
                aria-hidden
                className="absolute -left-1 top-3 hidden h-0.5 w-2 bg-ink sm:block"
                initial={reduced ? false : { scaleX: 0 }}
                whileInView={{ scaleX: done ? 1 : 0.35 }}
                viewport={{ once: true }}
                style={{ originX: 0, opacity: done ? 1 : 0.25 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.2, 0.9, 0.2, 1] }}
              />
            )}
            <div
              className={cn(
                "border-2 border-ink px-2 py-2",
                isCurrent
                  ? "bg-blue text-paper"
                  : done
                    ? "bg-green-wash"
                    : "bg-paper-2 text-ink-faint",
              )}
            >
              <span className="tag block leading-tight">{stage}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
