import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Sheet, Tape, Clip, Label, Tab } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { dailyFive, lesson } from "@/data/content";

export function DailyFive() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const bigScale = useTransform(scrollYProgress, [0, 0.35, 1], [1.1, 1, 0.78]);
  const bigX = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const gridY = useTransform(scrollYProgress, [0, 1], [-80, 80]);

  return (
    <section
      aria-label="Daily five-minute"
      className="relative overflow-hidden border-b-2 border-ink bg-green/10"
    >
      <motion.div
        aria-hidden
        style={reduced ? {} : { y: gridY }}
        className="pointer-events-none absolute -inset-y-32 inset-x-0 -z-10 opacity-55"
      >
        <div className="ruled h-full w-full" />
      </motion.div>

      <div ref={ref} className="relative mx-auto max-w-[1320px] px-5 pb-28 pt-16 sm:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Tab color="green">Section 03 — Learn</Tab>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-14">
          {/* the pinned typographic showpiece */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <motion.div
              style={reduced ? {} : { scale: bigScale, x: bigX }}
              className="origin-top-left"
            >
              {/* compact: one/two lines on narrower screens */}
              <p className="font-display font-black uppercase leading-[0.82] tracking-[-0.05em] xl:hidden">
                <span className="text-[clamp(3.2rem,12vw,6.5rem)] text-ink">
                  5{" "}
                </span>
                <span className="text-[clamp(2.4rem,9vw,4.8rem)] text-ink">
                  MIN{" "}
                </span>
                <span className="block text-[clamp(2.4rem,9vw,4.8rem)] text-green sm:inline">
                  READ
                </span>
              </p>

              {/* wide: stacked showpiece */}
              <div className="hidden xl:block">
                <span className="block font-display text-[clamp(6rem,20vw,15rem)] font-black leading-[0.72] tracking-[-0.06em] text-ink">
                  5
                </span>
                <span className="block font-display text-[clamp(3rem,9vw,6.4rem)] font-black leading-[0.78] tracking-[-0.05em] text-ink">
                  MIN
                </span>
                <span className="block font-display text-[clamp(3rem,9vw,6.4rem)] font-black leading-[0.78] tracking-[-0.05em] text-green">
                  READ
                </span>
              </div>
            </motion.div>
            <p className="tag relative z-10 mt-6 text-ink-soft lg:mt-12 lg:max-w-[40ch] xl:mt-16 xl:max-w-[28ch]">
              Daily five-minute rundown and one idea, concept, or framework.
              <br />
              Explained simply and emphasizes why you should care.
            </p>
          </div>

          {/* fragments assembling around it */}
          <div className="space-y-8">
            <Reveal from="right" distance={90}>
              <h2 className="font-display text-[clamp(2.4rem,6.4vw,4.4rem)] font-black leading-[0.84] text-ink">
                {dailyFive.topic}
              </h2>
              <p className="mt-4 whitespace-nowrap text-[1.1rem] leading-snug text-ink-soft">
                {dailyFive.subtitle}
              </p>
            </Reveal>

            <Reveal from="up" distance={60} delay={0.05}>
              <Sheet
                tone="paper"
                pattern="ruled"
                shadow="none"
                className="relative px-6 py-7 sm:px-8"
              >
                <Tape className="-top-3 left-8" color="green" angle={-5} width={120} />
                <Clip className="absolute -right-4 -top-6 z-30" angle={12} color="blue" />
                <p className="text-[1.02rem] leading-[1.7] text-ink">
                  {dailyFive.explainer}
                </p>
              </Sheet>
            </Reveal>

            {/* wider views: stretch across both columns to fill space under 5 MIN READ */}
            <div className="space-y-8 lg:relative lg:z-10 lg:w-[calc(169.5%+3.5rem)] lg:-ml-[calc(69.5%+3.5rem)]">
            <Reveal from="left" distance={70} delay={0.05}>
              <div className="border-l-[6px] border-blue py-2 pl-5">
                <Label className="text-blue">Why it matters for PM</Label>
                <p className="mt-2 text-[1.02rem] leading-[1.65] text-ink lg:max-w-none">
                  {dailyFive.whyItMatters}
                </p>
              </div>
            </Reveal>

            <Reveal from="up" distance={50} delay={0.05}>
              <Sheet
                tone="paper"
                shadow="hard-sm"
                tilt={-0.8}
                className="px-6 py-7 sm:px-8 lg:max-w-none"
                style={{ background: "oklch(0.95 0.08 98)" }}
              >
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
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="focus-ink inline-block -rotate-2 font-display text-[1.15rem] font-extrabold uppercase text-green transition-transform duration-200 hover:-translate-y-1 hover:rotate-1 hover:scale-105 focus:outline-none"
                >
                  <span className="inline-block border-2 border-ink bg-green px-3 py-1.5 text-ink shadow-hard-sm">
                    Read the full five minutes
                  </span>
                </a>
                <span className="tag text-ink-faint">{dailyFive.source}</span>
              </div>
            </Reveal>

            <Reveal from="right" distance={80} rotate={2.4} delay={0.1}>
              <Sheet
                tone="green"
                soft
                shadow="hard"
                className="group relative px-6 py-7 sm:px-8"
              >
                <Tape
                  className="-top-3.5 right-8"
                  color="yellow"
                  angle={7}
                  width={130}
                  variant="check"
                />
                <Clip className="absolute -left-5 top-12 z-30" angle={-92} color="blue" />

                <h3 className="font-display text-[clamp(1.85rem,4.5vw,2.6rem)] font-black leading-[0.84] whitespace-nowrap">
                  KEEP LEARNING.
                </h3>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <Label>{lesson.chapter}</Label>
                    <span className="tag text-ink">{lesson.progress}% through</span>
                  </div>
                  <div className="relative mt-2.5 h-[24px] border-b-2 border-ink">
                    <div className="absolute inset-x-0 bottom-0 flex justify-between">
                      {Array.from({ length: 21 }).map((_, i) => (
                        <span
                          key={i}
                          className="w-[2px] bg-ink/45"
                          style={{ height: i % 5 === 0 ? 14 : 7 }}
                        />
                      ))}
                    </div>
                    <motion.div
                      className="absolute bottom-0 left-0 h-[5px] origin-left bg-blue"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.2, 0.9, 0.2, 1] }}
                      style={{ width: `${lesson.progress}%` }}
                    />
                  </div>
                  <p className="tag mt-2.5 text-ink-faint">{lesson.note}</p>
                </div>

                <Link
                  to="/learn"
                  className="focus-ink swipe-underline mt-5 inline-block font-display text-[1rem] font-extrabold uppercase text-green focus:outline-none"
                >
                  Continue the lesson
                </Link>
              </Sheet>
            </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
