import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Sheet, Tape, Paperclip, Label, HandArrow } from "@/components/paper/Paper";
import { Parallax } from "@/components/paper/Parallax";
import { useTasks } from "@/hooks/useTasks";

function Checkbox({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      className="focus-ink group/box relative mt-[0.2rem] grid h-[19px] w-[19px] shrink-0 place-items-center border border-ink-faint/80 bg-paper/60 transition-colors hover:border-ink focus:outline-none"
    >
      <svg viewBox="0 0 20 20" className="h-[15px] w-[15px] text-green">
        <motion.path
          d="M3 11.2 7.6 15.6 17 4.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </button>
  );
}

export function TodaySpread() {
  const { tasks, add, toggle, remove } = useTasks();
  const [draft, setDraft] = useState("");
  const reduced = useReducedMotion();
  const openCount = tasks.filter((t) => !t.done).length;

  return (
    <section
      aria-label="Today"
      className="relative overflow-hidden px-4 pb-24 pt-10 sm:px-8 sm:pb-32"
    >
      {/* graph paper backdrop, drifting slower than the page */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Parallax speed={reduced ? 0 : 60} className="absolute -inset-y-32 inset-x-0">
          <div className="gridpaper h-full w-full opacity-55" />
        </Parallax>
      </div>

      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-0">
        {/* left page — the date, written */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 26, rotate: -2.4 }}
          animate={{ opacity: 1, y: 0, rotate: -1.3 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 lg:mr-[-4%] lg:mt-16"
        >
          <Sheet
            tone="warm"
            pattern="dots"
            edge="torn-bottom"
            className="px-7 pb-16 pt-9 sm:px-10"
          >
            <Tape className="-top-3 left-8" color="pink" angle={-7} width={104} />
            <Label>Friday</Label>
            <p className="mt-2 font-display text-[clamp(2.6rem,8vw,4.1rem)] leading-[0.88] tracking-tight">
              October
              <br />
              <span className="text-pink">08</span>
            </p>
            <p className="mt-5 max-w-[26ch] text-[0.96rem] leading-relaxed text-ink-soft">
              Your Product Place is open. Five things live here — apply, network,
              learn, create, practice — and today only asks for a little of each.
            </p>

            <div className="mt-7 border-t border-dashed border-border pt-5">
              <p className="hand text-[1.35rem] leading-tight text-ink">
                {openCount === 0
                  ? "list's clear. go build something."
                  : `${openCount} thing${openCount === 1 ? "" : "s"} still open`}
              </p>
              <HandArrow className="mt-1 -rotate-6 text-pink/70" />
            </div>
          </Sheet>
        </motion.div>

        {/* right page — the actual list */}
        <motion.div
          initial={reduced ? false : { opacity: 0, x: 40, rotate: 1.8 }}
          animate={{ opacity: 1, x: 0, rotate: 0.5 }}
          transition={{ duration: 1.05, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <Sheet
            tone="paper"
            className="margin-line group relative px-5 pb-9 pt-8 shadow-lift sm:px-8"
          >
            <Paperclip className="absolute -top-5 right-10 z-20" angle={12} />

            <div className="pl-8 sm:pl-9">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[1.7rem] leading-none sm:text-[2rem]">
                  Today / to-do
                </h2>
                <Label className="hidden sm:inline">saved on this device</Label>
              </div>

              <ul className="mt-6 ruled">
                {tasks.map((task, i) => (
                  <motion.li
                    key={task.id}
                    layout={!reduced}
                    initial={reduced ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: reduced ? 0 : i * 0.03 }}
                    className="group/item flex h-8 items-start gap-3"
                  >
                    <Checkbox done={task.done} onClick={() => toggle(task.id)} />
                    <span className="relative min-w-0 flex-1 truncate pt-[0.05rem] text-[0.99rem]">
                      <span
                        className={
                          task.done ? "text-ink-faint" : "text-ink"
                        }
                      >
                        {task.text}
                      </span>
                      <motion.span
                        aria-hidden
                        className="absolute left-0 top-[0.72rem] h-[1.5px] bg-ink-faint"
                        initial={false}
                        animate={{ width: task.done ? "100%" : "0%" }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(task.id)}
                      aria-label={`Delete "${task.text}"`}
                      className="focus-ink hand shrink-0 text-[1.1rem] leading-none text-ink-faint opacity-0 transition-opacity hover:text-pink focus:outline-none group-hover/item:opacity-100 focus-visible:opacity-100"
                    >
                      ✕
                    </button>
                  </motion.li>
                ))}
              </ul>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  add(draft);
                  setDraft("");
                }}
                className="mt-3 flex h-8 items-center gap-3 border-b border-rule"
              >
                <span
                  aria-hidden
                  className="h-[19px] w-[19px] shrink-0 border border-dashed border-ink-faint/60"
                />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="write the next one…"
                  aria-label="Add a task"
                  className="focus-ink hand min-w-0 flex-1 bg-transparent pb-1 text-[1.25rem] text-ink placeholder:text-ink-faint/70 focus:outline-none"
                />
                <button
                  type="submit"
                  className="focus-ink shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-faint transition-colors hover:text-blue focus:outline-none"
                >
                  add
                </button>
              </form>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  to="/practice"
                  className="focus-ink ink-underline text-[0.86rem] font-medium uppercase tracking-[0.14em] text-ink-soft focus:outline-none"
                >
                  Warm up a prompt
                </Link>
                <Link
                  to="/apply"
                  className="focus-ink ink-underline text-[0.86rem] font-medium uppercase tracking-[0.14em] text-ink-soft focus:outline-none"
                >
                  Open the tracker
                </Link>
              </div>
            </div>
          </Sheet>

          <p className="hand mt-4 pl-6 text-[1.18rem] text-ink-faint lg:absolute lg:-right-6 lg:bottom-[-3.2rem] lg:mt-0 lg:max-w-[13ch] lg:rotate-[-3deg] lg:pl-0">
            check one off before you open anything else
          </p>
        </motion.div>
      </div>
    </section>
  );
}
