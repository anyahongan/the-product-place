import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Sheet, Tape, Clip, Label, Arrow, Tab } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { dailyFive } from "@/data/content";

export function DailyFive() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const bigScale = useTransform(scrollYProgress, [0, 0.35, 1], [1.25, 1, 0.72]);
  const bigX = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const gridY = useTransform(scrollYProgress, [0, 1], [-80, 80]);

  return (
    <section
      aria-label="Daily five-minute"
      className="relative overflow-hidden border-b-2 border-ink bg-ink text-paper"
    >
      <motion.div
        aria-hidden
        style={reduced ? {} : { y: gridY }}
        className="pointer-events-none absolute -inset-y-32 inset-x-0 opacity-[0.18]"
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--paper) 1px, transparent 1px), linear-gradient(to bottom, var(--paper) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </motion.div>

      <div ref={ref} className="relative mx-auto max-w-[1320px] px-5 pb-28 pt-16 sm:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Tab color="yellow">Section 03 — Learn</Tab>
          <Label className="text-paper/70">
            {dailyFive.edition} — {dailyFive.date}
          </Label>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
          {/* the pinned typographic showpiece */}
          <div className="lg:sticky lg:top-24 lg:h-[68vh] lg:self-start">
            <motion.div
              style={reduced ? {} : { scale: bigScale, x: bigX }}
              className="origin-top-left"
            >
              <span className="block font-display text-[clamp(6rem,20vw,15rem)] font-black leading-[0.72] tracking-[-0.06em] text-yellow">
                5
              </span>
              <span className="block font-display text-[clamp(3rem,9vw,6.4rem)] font-black leading-[0.78] tracking-[-0.05em] text-paper">
                MIN
              </span>
              <span className="block font-display text-[clamp(3rem,9vw,6.4rem)] font-black leading-[0.78] tracking-[-0.05em] text-pink">
                READ
              </span>
            </motion.div>
            <p className="tag relative z-10 mt-10 max-w-[26ch] text-paper/60">
              {dailyFive.kicker} — one idea, explained straight, then why a PM
              should care.
            </p>
            <Arrow className="mt-4 h-9 w-24 rotate-6 text-green" />
          </div>

          {/* fragments assembling around it */}
          <div className="space-y-8">
            <Reveal from="right" distance={90}>
              <h2 className="font-display text-[clamp(2.4rem,6.4vw,4.4rem)] font-black leading-[0.84] text-paper">
                {dailyFive.topic}
              </h2>
              <p className="mt-4 max-w-[44ch] text-[1.1rem] leading-snug text-paper/75">
                {dailyFive.subtitle}
              </p>
            </Reveal>

            <Reveal from="up" distance={60} delay={0.05}>
              <Sheet tone="paper" shadow="none" className="relative px-6 py-7 sm:px-8">
                <Tape className="-top-3 left-8" color="blue" angle={-5} width={120} />
                <Clip className="absolute -right-4 -top-6 z-30" angle={12} color="purple" />
                <p className="text-[1.02rem] leading-[1.7] text-ink">
                  {dailyFive.explainer}
                </p>
              </Sheet>
            </Reveal>

            <Reveal from="left" distance={70} delay={0.05}>
              <div className="border-l-[6px] border-green pl-5">
                <Label className="text-paper/60">Why it matters for PM</Label>
                <p className="mt-2 max-w-[52ch] text-[1.02rem] leading-[1.65] text-paper/85">
                  {dailyFive.whyItMatters}
                </p>
              </div>
            </Reveal>

            <Reveal from="up" distance={50} delay={0.05}>
              <Sheet tone="yellow" shadow="hard-sm" tilt={-0.8} className="px-6 py-7 sm:px-8">
                <h3 className="font-display text-[1.5rem] font-black text-ink">
                  Take away exactly two things
                </h3>
                <ol className="mt-5 space-y-5">
                  {dailyFive.takeaways.map((t, i) => (
                    <motion.li
                      key={t}
                      initial={reduced ? false : { x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.32, delay: 0.12 + i * 0.14 }}
                      className="flex gap-4"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-ink font-display text-[1rem] font-black text-yellow">
                        {i + 1}
                      </span>
                      <p className="text-[1rem] leading-[1.55] text-ink">{t}</p>
                    </motion.li>
                  ))}
                </ol>
                <motion.p
                  className="mt-6 w-max font-display text-[1.05rem] font-extrabold uppercase text-ink"
                  initial={reduced ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="border-2 border-ink px-2 py-1">
                    {dailyFive.margin}
                  </span>
                </motion.p>
              </Sheet>
            </Reveal>

            <Reveal from="up" distance={30} delay={0.2}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t-2 border-paper/25 pt-6">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="focus-ink swipe-underline font-display text-[1.15rem] font-extrabold uppercase text-yellow focus:outline-none"
                >
                  Read the full five minutes
                </a>
                <span className="tag text-paper/55">{dailyFive.source}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
