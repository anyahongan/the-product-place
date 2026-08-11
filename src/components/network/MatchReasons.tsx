import { motion, useReducedMotion } from "motion/react";
import type { MatchReason } from "@/types/network";

export function MatchReasons({ reasons }: { reasons: MatchReason[] }) {
  const reduced = useReducedMotion();

  return (
    <div>
      <p className="tag font-black text-ink">Why this match?</p>
      <ul className="mt-2 space-y-1.5">
        {reasons.map((reason, i) => (
          <motion.li
            key={reason}
            initial={reduced ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
            className="flex items-start gap-2 text-[0.92rem] text-ink"
          >
            <span className="mt-1.5 h-2 w-2 shrink-0 bg-ink" aria-hidden />
            {reason}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
