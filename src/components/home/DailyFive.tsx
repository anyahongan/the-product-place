import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Sheet, Tape, Paperclip, Label } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { dailyFive } from "@/data/content";

export function DailyFive() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // the spread widens and settles as it comes into view
  const scale = useTransform(scrollYProgress, [0, 0.32], [0.955, 1]);
  const rotate = useTransform(scrollYProgress, [0, 0.32], [-1.6, 0]);
  const numberY = useTransform(scrollYProgress, [0, 1], [70, -70]);

  return (
    <section
      ref={ref}
      aria-label="Daily five-minute"
      className="relative overflow-hidden bg-paper-blue/50 px-4 py-24 sm:px-8 sm:py-32"
    >
      <div
        aria-hidden
        className="gridpaper pointer-events-none absolute inset-0 opacity-70"
      />
      {/* oversized edition number in the negative space */}
      <motion.p
        aria-hidden
        style={reduced ? undefined : { y: numberY }}
        className="pointer-events-none absolute -left-6 top-10 select-none font-display text-[26vw] leading-none text-ink/[0.045] sm:-left-10"
      >
        128
      </motion.p>

      <motion.div
        style={reduced ? undefined : { scale, rotate }}
        className="relative mx-auto max-w-[1080px]"
      >
        <Sheet
          tone="paper"
          edge="torn-top"
          className="group relative px-5 pb-14 pt-14 shadow-lift sm:px-12 sm:pt-16"
        >
          <Tape className="-top-2 left-1/2 -ml-14" color="blue" angle={2} width={116} />
          <Paperclip className="absolute -left-3 top-24 z-20" angle={-96} size={54} />

          {/* masthead */}
          <header className="border-b border-ink/15 pb-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <Label>
                {dailyFive.kicker} · {dailyFive.edition}
              </Label>
              <Label>{dailyFive.date}</Label>
            </div>
            <h2 className="mt-4 text-[clamp(2.6rem,9vw,5.6rem)] leading-[0.86] tracking-[-0.03em]">
              {dailyFive.topic}
            </h2>
            <p className="mt-4 max-w-[46ch] font-display text-[1.15rem] italic leading-snug text-ink-soft sm:text-[1.35rem]">
              {dailyFive.subtitle}
            </p>
          </header>

          <div className="mt-9 grid gap-10 lg:grid-cols-[1.35fr_0.9fr] lg:gap-14">
            {/* left: explainer, set like a column of type */}
            <Reveal from="up" distance={26} className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="grid h-[34px] w-[34px] place-items-center rounded-full border border-ink/25 font-display text-[0.9rem]">
                  5
                </span>
                <span className="hand text-[1.2rem] text-ink-faint">
                  {dailyFive.readingTime}
                </span>
              </div>
              <p className="mt-5 text-[1.06rem] leading-[1.72] text-ink first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[3.4rem] first-letter:leading-[0.78] first-letter:text-blue">
                {dailyFive.explainer}
              </p>

              <div className="relative mt-9 pl-6">
                <span
                  aria-hidden
                  className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[3px] bg-pink/45"
                />
                <Label>Why it matters for PM</Label>
                <p className="mt-2 text-[1.02rem] leading-[1.68] text-ink-soft">
                  {dailyFive.whyItMatters}
                </p>
              </div>
            </Reveal>

            {/* right: takeaways note tucked under the column */}
            <Reveal from="right" distance={48} rotate={2.2} delay={0.08}>
              <Sheet
                tone="yellow"
                pattern="ruled"
                tilt={1.6}
                className="px-6 pb-8 pt-7"
              >
                <Tape className="-top-3 right-6" color="green" angle={9} width={78} />
                <Label>Take away exactly two things</Label>
                <ol className="mt-4 space-y-5">
                  {dailyFive.takeaways.map((t, i) => (
                    <li key={t} className="flex gap-3">
                      <span className="hand shrink-0 text-[1.5rem] leading-none text-pink">
                        {i + 1}.
                      </span>
                      <p className="text-[0.97rem] leading-[1.6] text-ink">{t}</p>
                    </li>
                  ))}
                </ol>
                <p className="hand mt-7 -rotate-1 text-[1.2rem] leading-tight text-ink-faint">
                  {dailyFive.margin}
                </p>
              </Sheet>

              <div className="mt-7 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="focus-ink ink-underline font-display text-[1.3rem] text-ink focus:outline-none"
                >
                  Read the full five minutes
                </a>
                <span className="text-[0.78rem] uppercase tracking-[0.18em] text-ink-faint">
                  {dailyFive.source}
                </span>
              </div>
            </Reveal>
          </div>
        </Sheet>
      </motion.div>
    </section>
  );
}
