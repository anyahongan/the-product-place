import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Sheet, Tape, Label, HandArrow } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { deadlines, type Deadline } from "@/data/content";

const statusInk: Record<Deadline["status"], string> = {
  "Not started": "text-ink-faint",
  Drafting: "text-blue",
  Submitted: "text-green",
  Interviewing: "text-purple",
};

function Slip({ item, index }: { item: Deadline; index: number }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const tilt = [-1.4, 1.1, -0.8, 1.6][index % 4]!;
  const offset = [0, 34, 12, 46][index % 4]!;

  return (
    <Reveal
      from={index % 2 === 0 ? "left" : "right"}
      distance={70}
      rotate={index % 2 === 0 ? -3 : 3}
      delay={index * 0.07}
      className="relative"
      amount={0.4}
    >
      <motion.article
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        whileHover={reduced ? {} : { x: 6, rotate: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="focus-ink group relative outline-none"
        style={{ marginLeft: `clamp(0px, ${offset}px, 6vw)` }}
      >
        <Sheet
          tone={item.tone}
          pattern="grid-fine"
          tilt={tilt}
          className="relative pb-6 pl-6 pr-5 pt-7 sm:pl-9 sm:pr-8"
        >
          {/* torn index tab riding the top edge */}
          <span
            aria-hidden
            className="absolute -top-[15px] left-6 h-[17px] w-[86px] bg-paper shadow-slip transition-transform duration-500 group-hover:-translate-y-[3px]"
            style={{ clipPath: "polygon(6px 0, 80px 0, 86px 100%, 0 100%)" }}
          />
          <Tape
            className="-right-3 top-6"
            color={item.tone}
            angle={78}
            width={70}
          />

          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="min-w-0">
              <Label>{item.grad} grads</Label>
              <h3 className="mt-1 truncate text-[1.45rem] leading-tight sm:text-[1.7rem]">
                {item.company}
              </h3>
              <p className="text-[0.95rem] text-ink-soft">{item.role}</p>
            </div>
            <div className="flex items-end gap-4 sm:flex-col sm:items-end sm:gap-0">
              <p className="font-display text-[1.6rem] leading-none">
                {item.deadline}
              </p>
              <p className="hand text-[1.1rem] text-ink-faint">{item.due}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-dashed border-ink-faint/30 pt-3">
            <span
              className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${statusInk[item.status]}`}
            >
              {item.status}
            </span>
            <motion.span
              className="hand ml-auto text-[1.1rem] text-ink-faint"
              initial={false}
              animate={{ opacity: open ? 1 : 0, x: open ? 0 : 8 }}
              transition={{ duration: 0.32 }}
            >
              {item.status === "Submitted"
                ? "waiting on them"
                : "open the file →"}
            </motion.span>
          </div>
        </Sheet>
      </motion.article>
    </Reveal>
  );
}

export function DeadlinesStack() {
  return (
    <section
      aria-label="Upcoming internship deadlines"
      className="relative px-4 pb-28 pt-6 sm:px-8"
    >
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
        {/* pinned caption column */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal from="down" distance={24}>
            <Label>Section 01 · Apply</Label>
            <h2 className="mt-3 text-[clamp(2.1rem,5.5vw,3.2rem)] leading-[0.95]">
              Deadlines
              <br />
              <span className="hand text-pink text-[0.62em] leading-none">
                don&apos;t wait for you
              </span>
            </h2>
            <p className="mt-5 max-w-[30ch] text-[0.97rem] leading-relaxed text-ink-soft">
              Four slips clipped into the margin. Each one carries the date, who
              they&apos;ll take, and how far you&apos;ve actually got.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <Link
                to="/apply"
                className="focus-ink ink-underline font-display text-[1.25rem] text-ink focus:outline-none"
              >
                Go to Apply
              </Link>
              <HandArrow className="h-6 w-12 text-pink/70" />
            </div>
          </Reveal>
        </div>

        <div className="space-y-5 sm:space-y-7">
          {deadlines.map((item, i) => (
            <Slip key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
