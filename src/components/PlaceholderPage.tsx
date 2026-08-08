import { Link } from "@tanstack/react-router";
import { Sheet, Tape, Clip, Label, Tab } from "./paper/Paper";
import { Reveal } from "./paper/Reveal";

const areas = [
  { to: "/apply", label: "Apply", color: "blue", hover: "hover:text-blue" },
  { to: "/network", label: "Network", color: "pink", hover: "hover:text-pink" },
  { to: "/learn", label: "Learn", color: "green", hover: "hover:text-green" },
  { to: "/create", label: "Create", color: "purple", hover: "hover:text-purple" },
  { to: "/practice", label: "Practice", color: "yellow", hover: "hover:text-yellow" },
] as const;

/** Lighter than the main soft wash — almost white with a hint of the page tone */
const elsewhereWash: Record<
  "blue" | "green" | "pink" | "yellow" | "purple",
  string
> = {
  blue: "oklch(0.985 0.018 254)",
  green: "oklch(0.985 0.02 152)",
  pink: "oklch(0.985 0.018 356)",
  yellow: "oklch(0.99 0.025 95)",
  purple: "oklch(0.985 0.018 295)",
};

export function PlaceholderPage({
  title,
  kicker,
  blurb,
  bullets,
  tone = "blue",
  pattern = "grid",
}: {
  title: string;
  kicker: string;
  blurb: string;
  bullets: string[];
  tone?: "blue" | "green" | "pink" | "yellow" | "purple";
  pattern?: "grid" | "ruled" | "dots" | "grid-fine";
}) {
  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-14 sm:px-8">
      <div aria-hidden className="grid-bold pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="mx-auto max-w-[1320px]">
        <Reveal from="down" distance={30}>
          <Tab color={tone}>{kicker}</Tab>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,11vw,7rem)] font-black uppercase leading-[0.8]">
            {title}
          </h1>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <Reveal from="left" distance={80} rotate={-2}>
            <Sheet tone={tone} soft pattern={pattern} shadow="hard" className="group px-6 pb-12 pt-10 sm:px-10">
              <Tape className="-top-4 left-10" color={tone} angle={-5} width={140} />
              <p className="max-w-[48ch] font-display text-[clamp(1.2rem,3vw,1.7rem)] font-extrabold uppercase leading-[1.02] text-ink">
                {blurb}
              </p>
              <ul className="mt-8 space-y-3">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-[0.98rem] text-ink-soft">
                    <span aria-hidden className="mt-[0.4rem] h-[10px] w-[10px] shrink-0 bg-ink" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="tag mt-9 text-ink-faint">
                Not built yet — approving the visual language first
              </p>
            </Sheet>
          </Reveal>

          <Reveal from="right" distance={80} rotate={2} delay={0.08}>
            <Sheet
              tone="paper"
              shadow="hard-sm"
              tilt={1}
              className="relative px-6 py-8"
              style={{ background: elsewhereWash[tone] }}
            >
              <Clip className="absolute -top-6 right-8 z-30" angle={10} color={tone} />
              <Label>Elsewhere in the workspace</Label>
              <ul className="mt-5 space-y-2">
                {areas
                  .filter((a) => a.label.toLowerCase() !== title.toLowerCase())
                  .map((a) => (
                    <li key={a.to}>
                      <Link
                        to={a.to}
                        className={`focus-ink swipe-underline inline-block font-display text-[1.3rem] font-black uppercase text-ink transition-colors focus:outline-none ${a.hover}`}
                      >
                        {a.label}
                      </Link>
                    </li>
                  ))}
              </ul>
              <div className="mt-6 flex items-center gap-2">
                <Link
                  to="/"
                  className="focus-ink tag border-2 border-ink bg-yellow px-3 py-2 text-ink focus:outline-none"
                >
                  Back to today
                </Link>
              </div>
            </Sheet>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
