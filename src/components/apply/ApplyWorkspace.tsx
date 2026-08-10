import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LifecycleTabs } from "@/components/apply/LifecycleTabs";
import { ApplyDiscover } from "@/components/apply/ApplyDiscover";
import { AppliedOverview } from "@/components/apply/AppliedOverview";
import { InterviewWorkspace } from "@/components/apply/InterviewWorkspace";
import type { ApplicationMode, LifecycleTab } from "@/types/apply";

export function ApplyWorkspace() {
  const [tab, setTab] = useState<LifecycleTab>("apply");
  const [mode, setMode] = useState<ApplicationMode>("manual");
  const reduced = useReducedMotion();

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-12 sm:px-8 sm:pt-14">
      <div
        aria-hidden
        className="grid-bold pointer-events-none absolute inset-0 -z-10 opacity-55"
      />

      <div className="mx-auto max-w-[1320px]">
        <header className="mb-8 sm:mb-10">
          <p className="tag text-blue">The Product Place · Apply</p>
          <h1 className="mt-2 font-display text-[clamp(2.6rem,9vw,5.5rem)] font-black uppercase leading-[0.8]">
            Apply
          </h1>
          <p className="mt-4 max-w-[40ch] text-[1.02rem] text-ink-soft">
            Three workflows on one sheet — discover, track, prepare.
          </p>
          <div className="mt-7">
            <LifecycleTabs value={tab} onChange={setTab} />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={reduced ? false : { opacity: 0, y: 18, rotate: -0.4 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -12, rotate: 0.3 }}
            transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
          >
            {tab === "apply" && <ApplyDiscover mode={mode} onModeChange={setMode} />}
            {tab === "applied" && <AppliedOverview />}
            {tab === "interviewing" && <InterviewWorkspace />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
