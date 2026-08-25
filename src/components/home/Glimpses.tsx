import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Sheet, Tape, Label, Tab } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { Parallax } from "@/components/paper/Parallax";
import {
  networkActivity,
  projectPrompt,
  practicePaths,
} from "@/data/content";

/* ---------- NETWORK: a contact trail joined by a drawn line ---------- */

function NetworkGlimpse() {
  const reduced = useReducedMotion();
  const stateBlock = {
    replied: "bg-green text-ink",
    waiting: "bg-paper-2 text-ink",
    todo: "bg-pink text-paper",
  } as const;

  return (
    <div className="relative">
      <Reveal from="left" distance={70}>
        <Tab color="pink">Section 04 — Network</Tab>
        <h3 className="mt-4 font-display text-[clamp(2.1rem,5.5vw,3.4rem)] font-black leading-[0.82]">
          WHO&apos;VE YOU
          <br />
          <span className="text-pink">TALKED TO?</span>
        </h3>
      </Reveal>

      <div className="relative mt-9 space-y-5">
        {networkActivity.map((c, i) => (
          <Reveal key={c.id} from="right" distance={60} delay={i * 0.1}>
            <motion.div
              whileHover={reduced ? {} : { x: 8 }}
              transition={{ duration: 0.18 }}
              className="relative"
            >
              <Sheet
                tone={i === 0 ? "pink" : "paper"}
                soft
                shadow="hard-sm"
                tilt={i % 2 ? 0.5 : -0.6}
                className="px-5 py-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-[1.2rem] font-black">{c.name}</p>
                  <span className="tag text-ink-faint">{c.when}</span>
                </div>
                <p className="tag mt-1 text-ink-faint">{c.role}</p>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[0.95rem] text-ink">
                  <span className={`tag border-2 border-ink px-2 py-[0.15rem] ${stateBlock[c.state]}`}>
                    {c.state}
                  </span>
                  {c.note}
                </p>
              </Sheet>
            </motion.div>
          </Reveal>
        ))}
      </div>

      <Link
        to="/network"
        className="focus-ink swipe-underline mt-7 inline-block font-display text-[1rem] font-extrabold uppercase text-pink focus:outline-none"
      >
        Open Network
      </Link>
    </div>
  );
}

/* ---------- CREATE: a prompt assembled from paper fragments ---------- */

function CreateGlimpse() {
  const reduced = useReducedMotion();
  const words = projectPrompt.title.split(" ");

  return (
    <section className="relative overflow-hidden border-y-2 border-ink bg-purple/10 px-5 py-24 sm:px-8">
      <Parallax speed={40} className="pointer-events-none absolute inset-0 -z-10">
        <div className="dotpaper h-full w-full opacity-40" />
      </Parallax>

      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-center gap-4">
          <Tab color="purple">Section 06 — Create</Tab>
          <Label>{projectPrompt.label}</Label>
        </div>

        <h3 className="mt-6 flex flex-wrap gap-x-3 gap-y-1 font-display text-[clamp(1.8rem,5.4vw,3.6rem)] font-black leading-[0.92]">
          <span className="sr-only">{projectPrompt.title}</span>
          {words.map((w, i) => (
            <motion.span
              aria-hidden
              key={`${w}-${i}`}
              initial={reduced ? false : { y: 30, opacity: 0, rotate: i % 2 ? 3 : -3 }}
              whileInView={{ y: 0, opacity: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.32, delay: i * 0.035 }}
              className={
                i % 7 === 3
                  ? "border-2 border-ink bg-yellow px-2"
                  : i % 5 === 2
                    ? "text-purple"
                    : ""
              }
            >
              {w}
            </motion.span>
          ))}
        </h3>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-start">
          <div className="flex items-center gap-3 lg:justify-center lg:self-start">
            <Link
              to="/create"
              className="focus-ink tag border-2 border-ink bg-ink px-5 py-3 text-paper transition-transform hover:-translate-y-[3px] focus:outline-none lg:w-[90%] lg:max-w-none lg:px-10 lg:py-4 lg:text-center"
            >
              Take the prompt
            </Link>
          </div>
          <Sheet tone="paper" shadow="hard-sm" tilt={0.7} className="px-6 py-6">
            <Label>Constraints</Label>
            <ul className="mt-4 space-y-3">
              {projectPrompt.constraints.map((c) => (
                <li key={c} className="flex gap-3 text-[0.96rem] leading-snug text-ink">
                  <span aria-hidden className="mt-[0.35rem] h-[10px] w-[10px] shrink-0 bg-purple" />
                  {c}
                </li>
              ))}
            </ul>
          </Sheet>
        </div>
      </div>
    </section>
  );
}

/* ---------- PRACTICE: four bold selectable blocks ---------- */

function PracticeGlimpse() {
  const [active, setActive] = useState(practicePaths[0]!.id);
  const current = practicePaths.find((p) => p.id === active) ?? practicePaths[0]!;
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const stripX = useTransform(scrollYProgress, [0, 1], ["8%", "-38%"]);

  return (
    <section className="relative overflow-hidden border-t-2 border-ink bg-yellow/15 px-5 pb-28 pt-16 sm:px-8">
      {/* horizontal ticker strip that slides as you scroll vertically */}
      <motion.div
        aria-hidden
        style={reduced ? {} : { x: stripX }}
        className="pointer-events-none absolute left-0 top-6 flex w-[200%] gap-6 whitespace-nowrap"
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const tone =
            i % 3 === 0 ? "yellow" : i % 3 === 1 ? "paper" : "lavender";
          return (
            <span
              key={i}
              className="tag border-2 border-ink px-3 py-1"
              style={{
                background:
                  tone === "lavender"
                    ? "oklch(0.88 0.06 295)"
                    : `var(--${tone})`,
                color: "var(--ink)",
              }}
            >
              Practice
            </span>
          );
        })}
      </motion.div>

      <div ref={ref} className="relative mx-auto mt-14 max-w-[1320px]">
        <Reveal from="down" distance={30}>
          <Tab color="yellow">Section 07 — Practice</Tab>
          <h3 className="mt-4 font-display text-[clamp(2.2rem,6vw,4rem)] font-black leading-[0.82]">
            <span className="text-yellow-ink">PREPARE</span>{" "}
            <span className="text-ink">FOR</span>
            <br />
            <span className="text-ink">THE</span>{" "}
            <span className="text-yellow-ink">INTERVIEW</span>
          </h3>
          <p className="mt-5 text-[1rem] leading-relaxed text-ink-soft">
            Walk through cases, behaviorals, and technicals.
            <br />
            Learn how to think product and practice execution.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {practicePaths.map((p, i) => {
            const on = p.id === active;
            return (
              <Reveal key={p.id} from={i % 2 ? "up" : "down"} distance={60} delay={i * 0.07}>
                <button
                  type="button"
                  onClick={() => setActive(p.id)}
                  aria-pressed={on}
                  className="focus-ink block h-full w-full border-2 border-ink bg-paper px-5 py-6 text-left text-ink transition-[transform,background-color] duration-200 hover:-translate-y-[5px] hover:bg-yellow focus:outline-none"
                >
                  <span className="tag opacity-70">{p.count}</span>
                  <span className="mt-3 block font-display text-[1.3rem] font-black uppercase leading-[0.9]">
                    {p.title}
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>

        <motion.div key={current.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Sheet tone="paper" shadow="hard" className="mt-8 px-6 py-8 sm:px-10">
            <Tape className="-top-3 left-12" color="purple" angle={-4} width={130} />
            <Label>{current.title} — sample prompt</Label>
            <p className="mt-3 max-w-[42ch] font-display text-[clamp(1.3rem,3.4vw,2.1rem)] font-extrabold uppercase leading-[0.95]">
              {current.prompt}
            </p>
            <Link
              to="/practice"
              className="focus-ink swipe-underline mt-6 inline-block font-display text-[1rem] font-extrabold uppercase text-yellow-ink focus:outline-none"
            >
              Answer it out loud
            </Link>
          </Sheet>
        </motion.div>
      </div>
    </section>
  );
}

export function Glimpses() {
  return (
    <>
      <section className="relative overflow-hidden px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1320px]">
          <NetworkGlimpse />
        </div>
      </section>
      <CreateGlimpse />
      <PracticeGlimpse />
    </>
  );
}
