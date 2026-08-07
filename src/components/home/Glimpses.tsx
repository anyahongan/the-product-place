import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Sheet, Tape, Paperclip, Label, HandArrow } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { Parallax } from "@/components/paper/Parallax";
import {
  networkActivity,
  lesson,
  projectPrompt,
  practicePaths,
} from "@/data/content";

/* ---------- NETWORK: overlapping notes, the newest on top ---------- */

function NetworkGlimpse() {
  const reduced = useReducedMotion();
  const stateInk = {
    replied: "text-green",
    waiting: "text-ink-faint",
    todo: "text-pink",
  } as const;

  return (
    <Reveal from="left" distance={54} rotate={-2} className="relative">
      <Label>Section 02 · Network</Label>
      <h3 className="mt-2 text-[1.9rem] leading-none sm:text-[2.2rem]">
        Who you owe a reply
      </h3>

      <div className="relative mt-7">
        {networkActivity.map((c, i) => (
          <motion.div
            key={c.id}
            whileHover={reduced ? {} : { y: -7, rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              marginTop: i === 0 ? 0 : -18,
              zIndex: i + 1,
              position: "relative",
            }}
          >
            <Sheet
              tone={i === 0 ? "pink" : i === 1 ? "warm" : "paper"}
              tilt={[-1.2, 0.9, -0.5][i] ?? 0}
              className="group px-5 pb-5 pt-4 sm:px-6"
            >
              {i === 2 && <Paperclip className="absolute -top-4 right-6" angle={16} size={40} />}
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate font-display text-[1.2rem]">{c.name}</p>
                <span className="hand shrink-0 text-[1.05rem] text-ink-faint">{c.when}</span>
              </div>
              <p className="text-[0.82rem] uppercase tracking-[0.14em] text-ink-faint">
                {c.role}
              </p>
              <p className={`mt-2 text-[0.95rem] ${stateInk[c.state]}`}>{c.note}</p>
            </Sheet>
          </motion.div>
        ))}
      </div>

      <Link
        to="/network"
        className="focus-ink ink-underline mt-6 inline-block font-display text-[1.2rem] focus:outline-none"
      >
        Open Network
      </Link>
    </Reveal>
  );
}

/* ---------- LEARN: a lesson measured on a ruler ---------- */

function LearnGlimpse() {
  return (
    <Reveal from="right" distance={54} rotate={1.6} delay={0.05}>
      <Sheet
        tone="green"
        pattern="ruled"
        tilt={0.8}
        edge="torn-bottom"
        className="group px-6 pb-14 pt-8 sm:px-9"
      >
        <Tape className="-top-3 left-8" color="green" angle={-6} width={98} />
        <Label>Section 03 · Learn · {lesson.track}</Label>
        <h3 className="mt-3 max-w-[24ch] text-[1.75rem] leading-[1.06]">
          {lesson.title}
        </h3>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.78rem] uppercase tracking-[0.18em] text-ink-faint">
              {lesson.chapter}
            </span>
            <span className="hand text-[1.15rem] text-ink-soft">
              {lesson.progress}% through
            </span>
          </div>
          {/* ruler-style progress */}
          <div className="relative mt-3 h-[26px] border-b border-ink/30">
            <div className="absolute inset-x-0 bottom-0 flex justify-between">
              {Array.from({ length: 21 }).map((_, i) => (
                <span
                  key={i}
                  className="w-px bg-ink/30"
                  style={{ height: i % 5 === 0 ? 16 : 8 }}
                />
              ))}
            </div>
            <div
              className="absolute bottom-0 left-0 h-[3px] bg-blue transition-[width] duration-700"
              style={{ width: `${lesson.progress}%` }}
            />
            <span
              className="hand absolute -top-1 -translate-x-1/2 text-[1.1rem] text-blue"
              style={{ left: `${lesson.progress}%` }}
            >
              ×
            </span>
          </div>
          <p className="hand mt-3 text-[1.15rem] text-ink-faint">{lesson.note}</p>
        </div>

        <Link
          to="/learn"
          className="focus-ink ink-underline mt-7 inline-block font-display text-[1.2rem] focus:outline-none"
        >
          Continue the lesson
        </Link>
      </Sheet>
    </Reveal>
  );
}

/* ---------- CREATE: a wide torn prompt taped across the page ---------- */

function CreateGlimpse() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-8">
      <Parallax speed={34} className="pointer-events-none absolute inset-0 -z-10">
        <div className="dotpaper h-full w-full opacity-45" />
      </Parallax>

      <Reveal from="up" distance={60} rotate={-1.2} className="mx-auto max-w-[980px]">
        <Sheet
          tone="warm"
          edge="torn-top"
          className="group relative px-6 pb-12 pt-14 sm:px-14"
        >
          <Tape className="-top-1 left-10" color="yellow" angle={-8} width={120} />
          <Tape className="-top-1 right-10" color="pink" angle={7} width={104} />

          <Label>Section 04 · Create</Label>
          <div className="mt-4 grid gap-9 lg:grid-cols-[1.4fr_0.85fr] lg:gap-14">
            <div>
              <p className="hand text-[1.2rem] text-pink">{projectPrompt.label}</p>
              <h3 className="mt-2 text-[clamp(1.8rem,4.4vw,2.9rem)] leading-[1.02]">
                {projectPrompt.title}
              </h3>
              <Link
                to="/create"
                className="focus-ink ink-underline mt-7 inline-block font-display text-[1.25rem] focus:outline-none"
              >
                Take the prompt
              </Link>
            </div>
            <div className="border-t border-dashed border-ink/25 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <Label>Constraints</Label>
              <ul className="mt-4 space-y-3">
                {projectPrompt.constraints.map((c) => (
                  <li key={c} className="flex gap-3 text-[0.96rem] leading-snug text-ink-soft">
                    <span
                      aria-hidden
                      className="mt-[0.45rem] h-[6px] w-[6px] shrink-0 rounded-full bg-purple"
                    />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Sheet>
      </Reveal>
    </section>
  );
}

/* ---------- PRACTICE: four index cards, fanned, uneven ---------- */

function PracticeGlimpse() {
  const reduced = useReducedMotion();
  const heights = ["pt-8 pb-12", "pt-12 pb-8", "pt-7 pb-14", "pt-14 pb-7"];
  const tilts = [-2.2, 1.4, -0.9, 2.4];
  const nudge = ["lg:mt-0", "lg:mt-10", "lg:mt-4", "lg:mt-14"];

  return (
    <section className="px-4 pb-28 pt-4 sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        <Reveal from="down" distance={22} className="flex flex-wrap items-end gap-x-5">
          <div>
            <Label>Section 05 · Practice</Label>
            <h3 className="mt-2 text-[clamp(2rem,5vw,3rem)] leading-[0.98]">
              Four rooms to sit in
            </h3>
          </div>
          <span className="hand mb-1 flex items-center gap-1 text-[1.2rem] text-ink-faint">
            <HandArrow flip className="h-6 w-12 text-pink/70" />
            pick the one you avoid
          </span>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {practicePaths.map((p, i) => (
            <Reveal
              key={p.id}
              from={i % 2 === 0 ? "up" : "down"}
              distance={46}
              rotate={tilts[i]!}
              delay={i * 0.07}
              className={nudge[i] ?? ""}
            >
              <motion.div
                whileHover={reduced ? {} : { y: -8, rotate: 0 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                <Link
                  to="/practice"
                  className="focus-ink block h-full focus:outline-none"
                >
                  <Sheet
                    tone={p.tone}
                    pattern={i % 2 === 0 ? "grid-fine" : "dots"}
                    tilt={tilts[i]!}
                    className={`group flex h-full flex-col px-5 ${heights[i]} sm:px-6`}
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 h-full w-[4px]"
                      style={{ background: `var(--${p.tone})`, opacity: 0.45 }}
                    />
                    <Label>{p.count}</Label>
                    <h4 className="mt-2 font-display text-[1.35rem] leading-tight">
                      {p.title}
                    </h4>
                    <p className="mt-4 flex-1 text-[0.93rem] leading-snug text-ink-soft">
                      &ldquo;{p.prompt}&rdquo;
                    </p>
                    <span className="hand mt-5 text-[1.15rem] text-ink-faint opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      answer it out loud →
                    </span>
                  </Sheet>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Glimpses() {
  return (
    <>
      <section className="px-4 py-24 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
          <NetworkGlimpse />
          <div className="lg:mt-24">
            <LearnGlimpse />
          </div>
        </div>
      </section>
      <CreateGlimpse />
      <PracticeGlimpse />
    </>
  );
}
