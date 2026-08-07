import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Sheet, Tape, Clip, Label, Tab } from "@/components/paper/Paper";

const WORDS = ["THE", "PRODUCT", "PLACE"];

export function Hero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const stampRotate = useTransform(scrollYProgress, [0, 1], [-6, 10]);

  return (
    <section
      ref={ref}
      aria-label="The Product Place"
      className="relative overflow-hidden border-b-2 border-ink pb-[6.5rem] pt-10 sm:pt-16"
    >
      {/* layer 1 — background grid, moves slower */}
      <motion.div
        aria-hidden
        style={reduced ? {} : { y: gridY }}
        className="pointer-events-none absolute -inset-y-40 inset-x-0 -z-20"
      >
        <div className="grid-bold h-full w-full opacity-70" />
      </motion.div>

      {/* layer 2 — cropped colour blocks bleeding off the edges */}
      <motion.div
        aria-hidden
        initial={reduced ? false : { x: "-100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.9, 0.2, 1] }}
        className="pointer-events-none absolute -left-10 top-[38%] -z-10 h-[26vh] w-[46vw] border-2 border-ink bg-blue-wash"
        style={{ rotate: "-4deg" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-16 -z-10 hidden h-[70vh] w-[30vw] border-2 border-ink bg-purple/10 sm:block"
        style={{ rotate: "6deg" }}
      />

      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <motion.div
          initial={reduced ? false : { x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-3"
        >
          <Tab color="ink">Workspace</Tab>
          <Label>Edition no. 128 — Fri 08 Oct</Label>
        </motion.div>

        {/* the title, snapping into place piece by piece */}
        <h1 className="relative mt-6 select-none">
          <span className="sr-only">The Product Place</span>
          {WORDS.map((w, i) => (
            <motion.span
              key={w}
              aria-hidden
              initial={
                reduced
                  ? false
                  : { x: i % 2 === 0 ? -160 : 190, opacity: 0, skewX: i === 1 ? -8 : 6 }
              }
              animate={{ x: 0, opacity: 1, skewX: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.1 + i * 0.12,
                ease: [0.2, 0.9, 0.2, 1],
              }}
              className={[
                "block font-display text-[clamp(3.2rem,15.5vw,12.5rem)] font-black uppercase leading-[0.78] tracking-[-0.05em]",
                i === 1 ? "text-blue" : "text-ink",
                i === 2 ? "pl-[8vw]" : "",
              ].join(" ")}
            >
              {w}
            </motion.span>
          ))}

          {/* washi strip driving horizontally across the type */}
          <motion.span
            aria-hidden
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
            className="tape absolute -left-[10vw] top-[42%] h-[34px] w-[86vw] origin-left"
            style={{ rotate: "-2.4deg", ["--tape-color" as string]: "var(--pink)" }}
          />
        </h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <motion.div
            initial={reduced ? false : { y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <p className="max-w-[30ch] font-display text-[clamp(1.5rem,3.4vw,2.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em]">
              Five things.{" "}
              <motion.span
                className="hl"
                initial={reduced ? false : { ["--hl-scale" as string]: 0 }}
                animate={{ ["--hl-scale" as string]: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                Ten minutes.
              </motion.span>{" "}
              Every single day.
            </p>
            <p className="mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-ink-soft">
              Apply, network, learn, create, practice — one workspace for the
              student who has decided they&apos;re going to be a PM.
            </p>
          </motion.div>

          {/* date stamp — a real block of colour, cropped by the grid */}
          <motion.div
            style={reduced ? {} : { y: cardY, rotate: stampRotate }}
            initial={reduced ? false : { y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.2, 0.9, 0.2, 1] }}
            className="relative justify-self-start lg:justify-self-end"
          >
            <Clip className="absolute -top-7 left-8 z-30" angle={-8} color="blue" />
            <Sheet tone="yellow" shadow="hard" edge="corner-cut" className="group px-7 py-6">
              <Tape className="-top-3 right-4" color="green" angle={9} width={90} variant="check" />
              <Label className="text-ink/70">Today is</Label>
              <p className="mt-1 font-display text-[clamp(3rem,9vw,5.4rem)] font-black leading-[0.78] tracking-[-0.05em]">
                FRI
                <br />
                08
              </p>
              <p className="tag mt-2 text-ink/70">October — week 41</p>
            </Sheet>
          </motion.div>
        </div>
      </div>

      {/* running ticker pinned to the hero base, bleeding full width */}
      <div className="absolute inset-x-0 bottom-0 overflow-hidden border-y-2 border-ink bg-ink py-2">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, dup) => (
            <span key={dup} className="flex gap-8">
              {["Apply", "Network", "Learn", "Create", "Practice"].flatMap((w) => [
                <span key={w} className="tag text-paper">
                  {w}
                </span>,
                <span key={`${w}-dot`} aria-hidden className="tag text-yellow">
                  ✳
                </span>,
              ])}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
