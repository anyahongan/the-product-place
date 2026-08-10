import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clip, Sheet, Tab, Tape } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { ApplicationProgress } from "@/components/apply/ApplicationProgress";
import { formatInterviewWhen, sampleInterviews } from "@/data/apply";
import { cn } from "@/lib/utils";
import type { InterviewItem, PrepModuleId } from "@/types/apply";

export function InterviewWorkspace() {
  const [openId, setOpenId] = useState<string | null>(sampleInterviews[0]?.id ?? null);
  const [moduleId, setModuleId] = useState<PrepModuleId>("product-sense");

  return (
    <div className="space-y-8">
      <Reveal from="up" distance={40}>
        <div>
          <Tab color="purple">Interview prep</Tab>
          <h2 className="mt-3 font-display text-[clamp(2rem,6.5vw,3.8rem)] font-black uppercase leading-[0.84]">
            You have an interview.
            <br />
            <span className="text-purple">Let&apos;s prepare for this role.</span>
          </h2>
          <p className="mt-4 max-w-[48ch] text-[1.02rem] text-ink-soft">
            Active interviews with role-specific modules. Static prompts for now — no AI generation
            yet.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-4">
          {sampleInterviews.map((item, i) => (
            <InterviewCard
              key={item.id}
              item={item}
              index={i}
              active={openId === item.id}
              onOpen={() => {
                setOpenId(item.id);
                setModuleId("product-sense");
              }}
            />
          ))}
        </div>

        <PrepPanel
          interview={sampleInterviews.find((i) => i.id === openId) ?? null}
          moduleId={moduleId}
          onModule={setModuleId}
        />
      </div>
    </div>
  );
}

function InterviewCard({
  item,
  index,
  active,
  onOpen,
}: {
  item: InterviewItem;
  index: number;
  active: boolean;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <Reveal from="left" distance={70} rotate={-1.5} delay={index * 0.06}>
      <motion.button
        type="button"
        onClick={onOpen}
        aria-pressed={active}
        whileHover={reduced ? {} : { x: 5 }}
        className={cn(
          "focus-ink w-full text-left outline-none",
          active && "ring-2 ring-ink ring-offset-2 ring-offset-paper",
        )}
      >
        <Sheet
          tone={item.tone}
          soft
          shadow="hard-sm"
          edge="corner-cut"
          tilt={index % 2 ? 0.5 : -0.5}
          className="relative px-5 py-5"
        >
          <Tape className="-right-3 top-4" color={item.tone} angle={90} width={50} height={22} />
          <p className="tag text-ink-faint">{item.stage}</p>
          <h3 className="mt-1 font-display text-[1.45rem] font-black">{item.company}</h3>
          <p className="mt-1 text-[0.95rem] text-ink-soft">{item.role}</p>
          <p className="tag mt-3 text-ink">{formatInterviewWhen(item.datetime)}</p>
          <div className="mt-4">
            <ApplicationProgress
              current={item.progressStage}
              reached={
                item.progressStage === "Final"
                  ? ["Submitted", "Recruiter Screen", "Interview", "Final"]
                  : ["Submitted", "Recruiter Screen", "Interview"]
              }
            />
          </div>
        </Sheet>
      </motion.button>
    </Reveal>
  );
}

function PrepPanel({
  interview,
  moduleId,
  onModule,
}: {
  interview: InterviewItem | null;
  moduleId: PrepModuleId;
  onModule: (id: PrepModuleId) => void;
}) {
  const reduced = useReducedMotion();
  const mod = interview?.modules.find((m) => m.id === moduleId) ?? interview?.modules[0];

  if (!interview || !mod) {
    return (
      <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
        <p className="font-display text-[1.3rem] font-black uppercase">Select an interview</p>
      </Sheet>
    );
  }

  return (
    <Reveal from="right" distance={70} rotate={1.5}>
      <Sheet tone="paper" pattern="ruled" shadow="hard" className="relative px-5 py-6 sm:px-8">
        <Clip className="absolute -top-5 left-1/2 -translate-x-1/2" color="purple" size={52} />
        <Tape className="-top-3 right-10" color="purple" angle={5} width={100} height={24} />

        <p className="tag text-ink-soft">Preparing for</p>
        <h3 className="mt-1 font-display text-[1.8rem] font-black uppercase leading-[0.9]">
          {interview.company}
        </h3>
        <p className="mt-2 text-ink-soft">{interview.role}</p>

        <div role="tablist" aria-label="Prep modules" className="mt-6 flex flex-wrap gap-2">
          {interview.modules.map((m) => {
            const active = m.id === mod.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onModule(m.id)}
                className={cn(
                  "focus-ink border-2 border-ink px-2.5 py-1.5 font-display text-[0.72rem] font-black uppercase outline-none sm:text-xs",
                  active ? "bg-purple text-paper" : "bg-paper hover:bg-purple-wash",
                )}
              >
                {m.title}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mod.id}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.2, 0.9, 0.2, 1] }}
            className="mt-6 border-2 border-ink bg-purple-wash px-4 py-5"
          >
            <h4 className="font-display text-[1.25rem] font-black uppercase">{mod.title}</h4>
            <p className="mt-3 text-[1.02rem] leading-snug text-ink">{mod.prompt}</p>
            <ul className="mt-4 space-y-2">
              {mod.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-[0.95rem] text-ink-soft">
                  <span aria-hidden className="mt-[0.4rem] h-2.5 w-2.5 shrink-0 bg-purple" />
                  {b}
                </li>
              ))}
            </ul>
            <p className="tag mt-5 text-ink-faint">
              Static sample content — AI prep not implemented yet
            </p>
          </motion.div>
        </AnimatePresence>
      </Sheet>
    </Reveal>
  );
}
