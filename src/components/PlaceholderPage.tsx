import { Link } from "@tanstack/react-router";
import { Sheet, Tape, Paperclip, Label, HandArrow } from "./paper/Paper";
import { Reveal } from "./paper/Reveal";

const areas = [
  { to: "/apply", label: "Apply" },
  { to: "/network", label: "Network" },
  { to: "/learn", label: "Learn" },
  { to: "/create", label: "Create" },
  { to: "/practice", label: "Practice" },
] as const;

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
      <div
        aria-hidden
        className="gridpaper pointer-events-none absolute inset-0 -z-10 opacity-40"
      />
      <div className="mx-auto max-w-[1000px]">
        <Reveal from="down" distance={26}>
          <Label>{kicker}</Label>
          <h1 className="mt-3 max-w-[16ch] text-[clamp(2.4rem,7vw,4.4rem)] leading-[0.95]">
            {title}
          </h1>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <Reveal from="left" distance={40} rotate={-1}>
            <Sheet
              tone={tone}
              pattern={pattern}
              tilt={-0.5}
              edge="torn-bottom"
              className="group px-7 pb-14 pt-10 sm:px-11"
            >
              <Tape className="-top-3 left-10" color={tone} angle={-5} />
              <p className="max-w-[52ch] font-display text-[1.28rem] leading-[1.5] text-ink">
                {blurb}
              </p>
              <ul className="mt-8 space-y-3">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-[0.98rem] text-ink-soft">
                    <span
                      aria-hidden
                      className="mt-[0.42rem] h-[7px] w-[7px] shrink-0 rotate-45 border border-ink-faint"
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="hand mt-9 text-[1.15rem] text-ink-faint">
                not built yet — we&apos;re approving the visual language first
              </p>
            </Sheet>
          </Reveal>

          <Reveal from="right" distance={44} rotate={1.6} delay={0.1}>
            <Sheet tone="warm" tilt={1.4} className="relative px-7 py-9">
              <Paperclip className="absolute -top-4 right-8" />
              <Label>Elsewhere in the notebook</Label>
              <ul className="mt-5 space-y-1">
                {areas
                  .filter((a) => a.label.toLowerCase() !== title.toLowerCase())
                  .map((a) => (
                    <li key={a.to}>
                      <Link
                        to={a.to}
                        className="focus-ink ink-underline inline-block py-1 font-display text-[1.35rem] text-ink focus:outline-none"
                      >
                        {a.label}
                      </Link>
                    </li>
                  ))}
              </ul>
              <div className="mt-6 flex items-center gap-1">
                <HandArrow flip className="h-6 w-12" />
                <Link
                  to="/"
                  className="focus-ink hand text-[1.15rem] text-pink focus:outline-none"
                >
                  back to today
                </Link>
              </div>
            </Sheet>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
