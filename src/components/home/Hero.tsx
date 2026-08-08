import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Sheet, Tape, Clip, Label, Tab } from "@/components/paper/Paper";

const WORDS = ["THE", "PRODUCT", "PLACE"];

function getTodayParts(date = new Date()) {
  return {
    day: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    num: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("en-US", { month: "long" }),
  };
}

export function Hero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [today, setToday] = useState(getTodayParts);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const stampRotate = useTransform(scrollYProgress, [0, 1], [6, -10]);

  useEffect(() => {
    setToday(getTodayParts());
  }, []);

  return (
    <section
      ref={ref}
      aria-label="The Product Place"
      className="relative overflow-hidden border-b-2 border-ink pb-16 pt-10 sm:pt-16"
    >
      {/* layer 1 - background grid, moves slower */}
      <motion.div
        aria-hidden
        style={reduced ? {} : { y: gridY }}
        className="pointer-events-none absolute -inset-y-40 inset-x-0 -z-20"
      >
        <div className="grid-bold h-full w-full opacity-70" />
      </motion.div>

      {/* layer 2 - cropped colour blocks bleeding off the edges */}
      <motion.div
        aria-hidden
        initial={reduced ? false : { x: "-100%" }}
        whileInView={{ x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.2, 0.9, 0.2, 1] }}
        className="pointer-events-none absolute -left-10 top-[38%] -z-10 h-[26vh] w-[46vw] border-2 border-ink bg-blue-wash"
        style={{ rotate: "-4deg" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-16 -z-10 hidden h-[70vh] w-[30vw] border-2 border-ink bg-purple/10 sm:block"
        style={{ rotate: "6deg" }}
      >
        <Tape
          className="-left-14 top-5"
          color="green"
          angle={-28}
          width={210}
          variant="check"
        />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <motion.div
          initial={reduced ? false : { x: -40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-3"
        >
          <Tab color="ink">Workspace</Tab>
          <Label>The first edition.</Label>
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
              whileInView={{ x: 0, opacity: 1, skewX: 0 }}
              viewport={{ once: true }}
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
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
            className="tape absolute -left-[10vw] top-[42%] h-[34px] w-[86vw] origin-left"
            style={{ rotate: "-2.4deg", ["--tape-color" as string]: "var(--pink)" }}
          />
        </h1>

        <div className="relative mt-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <motion.div
            initial={reduced ? false : { y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="min-w-0"
          >
            <p className="max-w-[30ch] font-display text-[clamp(1.5rem,3.4vw,2.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em]">
              Five things.{" "}
              <motion.span
                className="hl"
                initial={reduced ? false : { ["--hl-scale" as string]: 0 }}
                whileInView={{ ["--hl-scale" as string]: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                Ten minutes.
              </motion.span>
              <span className="mt-1 block text-pink">Every single day.</span>
            </p>
            <p className="mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-ink-soft">
              Apply, network, learn, create, practice - one workspace for all
              things product. Start learning, start creating.
            </p>
          </motion.div>

          {/* date stamp sits to the right of the subtitle + description */}
          <motion.div
            style={reduced ? {} : { y: cardY, rotate: stampRotate }}
            initial={reduced ? false : { y: -80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.2, 0.9, 0.2, 1] }}
            className="relative w-[min(100%,11.5rem)] shrink-0 self-end md:-mt-16 md:ml-auto md:mr-3 md:self-start lg:-mt-20 lg:mr-5"
          >
            <Clip className="absolute -top-9 left-6 z-30 scale-90" angle={-8} color="blue" />
            <Sheet tone="yellow" shadow="hard" className="group px-5 py-4">
              <Label className="text-ink/70">Today is</Label>
              <p className="mt-1 font-display text-[clamp(2.2rem,6.5vw,3.6rem)] font-black leading-[0.78] tracking-[-0.05em]">
                {today.day}
                <br />
                {today.num}
              </p>
              <p className="tag mt-1.5 text-ink/70">{today.month}</p>
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
                <span key={`${dup}-${w}`} className="tag text-paper">
                  {w}
                </span>,
                <span key={`${dup}-${w}-dot`} aria-hidden className="tag text-yellow">
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
