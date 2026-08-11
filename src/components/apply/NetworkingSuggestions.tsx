import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, Tape } from "@/components/paper/Paper";
import type { ApplicationRecord } from "@/lib/apply/types";

const PINK = "var(--pink)";
const PAPER = "var(--paper)";
const INK = "var(--ink)";

/** Navigate into Network focused on this application's company + record. */
export function NetworkingSuggestions({ application }: { application: ApplicationRecord }) {
  const [hot, setHot] = useState(false);

  return (
    <Sheet tone="pink" soft shadow="hard-sm" className="relative mt-6 px-5 py-5">
      <Tape className="-top-3 right-8" color="pink" angle={6} width={90} height={24} />
      <p className="font-display text-[1.25rem] font-black uppercase leading-[0.95]">
        Haven&apos;t heard back?
      </p>
      <p className="tag mt-2 text-ink-soft">People worth reaching out to →</p>
      <p className="mt-3 text-[0.92rem] text-ink-soft">
        Jump into Network with {application.company} and this application already selected.
      </p>
      <Link
        to="/network"
        search={{
          company: application.companyId,
          application: application.applicationId,
        }}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        onFocus={() => setHot(true)}
        onBlur={() => setHot(false)}
        style={{
          background: hot ? PINK : PAPER,
          color: hot ? PAPER : INK,
        }}
        className="focus-ink mt-4 inline-block border-2 border-ink px-3 py-2 font-display text-xs font-black uppercase outline-none transition-[background-color,color] duration-150"
      >
        Find people to reach out to →
      </Link>
    </Sheet>
  );
}
