import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Sheet, Tape, Clip, Label } from "@/components/paper/Paper";
import { useTasks } from "@/hooks/useTasks";

function Check({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      className="focus-ink relative mt-[0.15rem] grid h-[22px] w-[22px] shrink-0 place-items-center border-2 border-ink bg-paper transition-colors hover:bg-yellow focus:outline-none"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-green"
        initial={false}
        animate={{ scale: done ? 1 : 0 }}
        transition={{ duration: 0.16, ease: [0.2, 0.9, 0.2, 1] }}
        style={{ transformOrigin: "bottom left" }}
      />
      <svg viewBox="0 0 20 20" className="relative h-[14px] w-[14px] text-ink">
        <motion.path
          d="M3 11 7.6 15.6 17 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="square"
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </svg>
    </button>
  );
}

export function TodaySpread() {
  const { tasks, add, toggle, remove } = useTasks();
  const [draft, setDraft] = useState("");
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const open = tasks.filter((t) => !t.done).length;

  const play = reduced || inView;

  return (
    <section
      aria-label="Today's list"
      className="relative overflow-hidden px-5 pb-28 pt-20 sm:px-8"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="gridpaper absolute inset-0 opacity-40" />
      </div>

      {/* oversized section number, cropped by the left edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-4 top-8 select-none font-display text-[22vw] font-black leading-none tracking-[-0.06em] text-ink/[0.055]"
      >
        01
      </span>

      <div ref={ref} className="relative mx-auto max-w-[1320px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-start lg:gap-6">
          <div className="relative z-10">
            <motion.h2
              initial={reduced ? false : { y: 40, opacity: 0 }}
              animate={play ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="font-display text-[clamp(2.6rem,8vw,5.2rem)] font-black leading-[0.8]"
            >
              TODAY&apos;S
              <br />
              <span className="text-pink">LIST</span>
            </motion.h2>

            <div className="mt-6 flex items-center gap-4">
              <span className="border-2 border-ink bg-ink px-3 py-1 tag text-paper">
                {open === 0 ? "All clear" : `${open} open`}
              </span>
            </div>

            <p className="mt-6 max-w-[32ch] text-[1rem] leading-relaxed text-ink-soft">
              Not a dashboard. A page you actually mark up. It saves on this
              device, so the list is waiting where you left it.
            </p>

          </div>

          {/* the artifact: sheet slides in, rotates flat, tape stretches, lines reveal, clip lands */}
          <motion.div
            initial={reduced ? false : { x: 120, y: 40, rotate: 5, opacity: 0 }}
            animate={play ? { x: 0, y: 0, rotate: -1.1, opacity: 1 } : {}}
            transition={{ duration: 0.62, ease: [0.2, 0.9, 0.2, 1] }}
            className="relative min-w-0 lg:-mt-6"
          >
            <Sheet
              tone="paper"
              shadow="hard"
              className="group relative bg-pink-wash px-4 pb-8 pt-9 sm:px-9"
            >
              <motion.div
                initial={reduced ? false : { y: -46, opacity: 0 }}
                animate={play ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.75 }}
                className="absolute -top-6 right-8 z-30"
              >
                <Clip angle={6} color="pink" />
              </motion.div>

              <div className="mt-8 flex items-end justify-between gap-4 border-b-4 border-ink pb-2">
                <h3 className="font-display text-[1.5rem] font-black text-pink">
                  To-do
                </h3>
                <Label>Saved on this device</Label>
              </div>

              <ul className="mt-2">
                {tasks.map((task, i) => (
                  <motion.li
                    key={task.id}
                    layout={!reduced}
                    initial={reduced ? false : { x: -24, opacity: 0 }}
                    animate={play ? { x: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.45 + i * 0.07 }}
                    className="group/item flex items-start gap-2 border-b border-rule py-[0.6rem] sm:gap-3"
                  >
                    <Check done={task.done} onClick={() => toggle(task.id)} />
                    <span className="relative min-w-0 flex-1 text-[1rem] leading-tight">
                      <span className={task.done ? "text-ink-faint" : "text-ink"}>
                        {task.text}
                      </span>
                      <motion.span
                        aria-hidden
                        className="absolute left-0 top-[0.55rem] h-[3px] bg-pink"
                        initial={false}
                        animate={{ width: task.done ? "100%" : "0%" }}
                        transition={{ duration: 0.24, ease: [0.2, 0.9, 0.2, 1] }}
                      />
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(task.id)}
                      aria-label={`Delete "${task.text}"`}
                      className="focus-ink tag shrink-0 px-1 text-ink-faint opacity-80 transition-all hover:text-pink focus:outline-none sm:opacity-0 sm:group-hover/item:opacity-100 sm:group-focus-within/item:opacity-100 focus-visible:opacity-100"
                    >
                      DEL
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
                className="mt-4 flex items-center gap-3 border-2 border-dashed border-ink/40 p-2"
              >
                <span aria-hidden className="h-[22px] w-[22px] shrink-0 border-2 border-ink/40" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write the next one…"
                  aria-label="Add a task"
                  className="focus-ink min-w-0 flex-1 bg-transparent text-[1rem] text-ink placeholder:text-ink-faint focus:outline-none"
                />
                <button
                  type="submit"
                  className="focus-ink tag shrink-0 border-2 border-ink bg-yellow px-3 py-[0.35rem] text-ink transition-transform hover:-translate-y-[2px] focus:outline-none"
                >
                  Add
                </button>
              </form>
            </Sheet>

            <Tape
              className="-top-4 left-10"
              color="yellow"
              angle={-4}
              width={140}
              variant="check"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
