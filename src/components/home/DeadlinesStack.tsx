import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Sheet, Tape, Label, Arrow, Tab } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { deadlines, type Deadline } from "@/data/content";

const statusBlock: Record<Deadline["status"], string> = {
  "Not started": "bg-paper-2 text-ink",
  Drafting: "bg-blue text-paper",
  Submitted: "bg-green text-ink",
  Interviewing: "bg-purple text-paper",
};

const entry = [
  { from: "left" as const, rotate: -4 },
  { from: "right" as const, rotate: 4 },
  { from: "up" as const, rotate: -2.5 },
  { from: "right" as const, rotate: 3 },
];

function Ticket({ item, index }: { item: Deadline; index: number }) {
  const reduced = useReducedMotion();
  const e = entry[index % 4]!;
  const offset = ["lg:ml-0", "lg:ml-[10%]", "lg:ml-[4%]", "lg:ml-[14%]"][index % 4];

  return (
    <Reveal
      from={e.from}
      distance={130}
      rotate={e.rotate}
      delay={index * 0.09}
      amount={0.35}
      className={offset}
    >
      <motion.article
        whileHover={reduced ? {} : { x: 8, y: -4 }}
        transition={{ duration: 0.18, ease: [0.2, 0.9, 0.2, 1] }}
        tabIndex={0}
        className="focus-ink group relative outline-none"
      >
        <Sheet
          tone={item.tone}
          soft
          shadow="hard-sm"
          edge="corner-cut"
          tilt={index % 2 ? 0.6 : -0.7}
          className="relative grid gap-4 px-5 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-7 sm:px-8"
        >
          {/* the date as a real block of colour */}
          <div
            className="flex w-max items-baseline gap-2 border-2 border-ink px-3 py-2"
            style={{ background: `var(--${item.tone})` }}
          >
            <span
              className={`font-display text-[2.1rem] font-black leading-none tracking-[-0.04em] ${
                item.tone === "yellow" || item.tone === "green" ? "text-ink" : "text-paper"
              }`}
            >
              {item.deadline.split(" ")[1]}
            </span>
            <span
              className={`tag ${
                item.tone === "yellow" || item.tone === "green" ? "text-ink" : "text-paper"
              }`}
            >
              {item.deadline.split(" ")[0]}
            </span>
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-display text-[1.4rem] font-black sm:text-[1.7rem]">
              {item.company}
            </h3>
            <p className="mt-1 text-[0.95rem] text-ink-soft">{item.role}</p>
            <p className="tag mt-2 text-ink-faint">
              {item.grad} grads — due {item.due}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <span
              className={`tag border-2 border-ink px-2 py-1 ${statusBlock[item.status]}`}
            >
              {item.status}
            </span>
            <span className="tag text-ink-faint transition-transform group-hover:translate-x-1">
              Open →
            </span>
          </div>

          <Tape
            className="-right-5 top-4"
            color={item.tone}
            angle={90}
            width={64}
            height={26}
          />
        </Sheet>
      </motion.article>
    </Reveal>
  );
}

export function DeadlinesStack() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // horizontal strip driven by vertical scroll
  const stripX = useTransform(scrollYProgress, [0, 1], ["8%", "-38%"]);
  const numScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1.15, 0.85]);

  return (
    <section
      aria-label="Upcoming internship deadlines"
      className="relative overflow-hidden border-y-2 border-ink bg-paper-2 px-5 pb-28 pt-16 sm:px-8"
    >
      {/* horizontal ticker strip that slides as you scroll vertically */}
      <motion.div
        aria-hidden
        style={reduced ? {} : { x: stripX }}
        className="pointer-events-none absolute left-0 top-6 flex w-[200%] gap-6 whitespace-nowrap"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="tag border-2 border-ink px-3 py-1"
            style={{
              background:
                i % 3 === 0 ? "var(--yellow)" : i % 3 === 1 ? "var(--paper)" : "var(--pink-wash)",
            }}
          >
            Deadline
          </span>
        ))}
      </motion.div>

      <div ref={ref} className="relative mx-auto mt-14 max-w-[1320px]">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
          {/* pinned caption column */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal from="down" distance={30}>
              <Tab color="pink">Section 02 — Apply</Tab>
              <h2 className="mt-4 font-display text-[clamp(2.6rem,7vw,4.6rem)] font-black leading-[0.8]">
                WHAT&apos;S
                <br />
                DUE?
              </h2>
              <motion.span
                aria-hidden
                style={reduced ? {} : { scale: numScale }}
                className="mt-4 block w-max origin-left border-2 border-ink bg-ink px-4 py-1 font-display text-[2.4rem] font-black leading-none text-yellow"
              >
                {deadlines.length}
              </motion.span>
              <p className="mt-5 max-w-[30ch] text-[1rem] leading-relaxed text-ink-soft">
                Four slips clipped into the margin. Date first, always — then who
                they&apos;ll take and how far you&apos;ve actually got.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <Link
                  to="/apply"
                  className="focus-ink swipe-underline font-display text-[1rem] font-extrabold uppercase text-ink focus:outline-none"
                >
                  Go to Apply
                </Link>
                <Arrow className="h-7 w-16 text-blue" />
              </div>
            </Reveal>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {deadlines.map((item, i) => (
              <Ticket key={item.id} item={item} index={i} />
            ))}
            <Reveal from="up" distance={40} delay={0.1}>
              <p className="tag text-ink-faint">
                Tracker holds the rest — cover letters, referrals, rejections.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
