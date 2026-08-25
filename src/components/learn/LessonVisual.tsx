import type { ReactNode } from "react";
import type { LessonVisualId } from "@/lib/learning/types";

/** Editorial diagrams — Learn green scheme, stationery language. */
export function LessonVisual({ visualId }: { visualId: LessonVisualId }) {
  switch (visualId) {
    case "lifecycle":
      return (
        <Figure title="Product development loop">
          <svg viewBox="0 0 520 160" className="h-auto w-full" role="img" aria-label="Lifecycle loop diagram">
            {[
              { x: 20, label: "Discover" },
              { x: 120, label: "Define" },
              { x: 220, label: "Build" },
              { x: 320, label: "Launch" },
              { x: 420, label: "Learn" },
            ].map((s, i) => (
              <g key={s.label}>
                <rect x={s.x} y={50} width={80} height={48} fill="var(--green-wash)" stroke="var(--ink)" strokeWidth="2" />
                <text x={s.x + 40} y={78} textAnchor="middle" className="fill-ink" style={{ fontSize: 12, fontWeight: 800 }}>
                  {s.label}
                </text>
                {i < 4 && (
                  <path d={`M${s.x + 84} 74 H${s.x + 116}`} stroke="var(--ink)" strokeWidth="2" markerEnd="url(#arrow-life)" />
                )}
              </g>
            ))}
            <path d="M460 110 C 300 150, 220 150, 60 110" fill="none" stroke="var(--ink)" strokeWidth="2" strokeDasharray="4 3" />
            <text x="260" y="148" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700 }} className="fill-ink">
              loop — not a one-way waterfall
            </text>
            <defs>
              <marker id="arrow-life" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--ink)" />
              </marker>
            </defs>
          </svg>
        </Figure>
      );
    case "rice":
      return (
        <Figure title="RICE scoring at a glance">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["R", "Reach", "Who is touched?"],
              ["I", "Impact", "How much better?"],
              ["C", "Confidence", "How sure?"],
              ["E", "Effort", "How costly?"],
            ].map(([letter, name, hint]) => (
              <div key={letter} className="border-2 border-ink bg-green-wash p-3 text-center">
                <div className="font-display text-2xl font-black">{letter}</div>
                <div className="mt-1 text-xs font-bold uppercase">{name}</div>
                <div className="mt-1 text-[0.7rem] text-ink-soft">{hint}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            Score ≈ (Reach × Impact × Confidence) ÷ Effort — only as honest as your inputs.
          </p>
        </Figure>
      );
    case "b2b-models":
      return (
        <Figure title="Who buys vs who uses">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { t: "B2B", d: "Org buys · teams use" },
              { t: "B2C", d: "Person buys & uses" },
              { t: "B2B2C", d: "Partner buys · consumers use" },
            ].map((x) => (
              <div key={x.t} className="border-2 border-ink bg-green-wash p-4">
                <div className="font-display text-lg font-black uppercase">{x.t}</div>
                <p className="mt-2 text-sm text-ink-soft">{x.d}</p>
              </div>
            ))}
          </div>
        </Figure>
      );
    case "api-stack":
      return (
        <Figure title="Frontend · API · Backend">
          <svg viewBox="0 0 480 180" className="h-auto w-full" role="img" aria-label="Stack diagram">
            <rect x="40" y="20" width="400" height={40} fill="var(--green-wash)" stroke="var(--ink)" strokeWidth="2" />
            <text x="240" y="45" textAnchor="middle" style={{ fontSize: 13, fontWeight: 800 }}>
              Frontend — what the user sees & taps
            </text>
            <rect x="40" y="70" width="400" height={40} fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
            <text x="240" y="95" textAnchor="middle" style={{ fontSize: 13, fontWeight: 800 }}>
              API — the contract between systems
            </text>
            <rect x="40" y="120" width="400" height={40} fill="var(--paper-2)" stroke="var(--ink)" strokeWidth="2" />
            <text x="240" y="145" textAnchor="middle" style={{ fontSize: 13, fontWeight: 800 }}>
              Backend — rules, data, jobs, integrations
            </text>
          </svg>
        </Figure>
      );
    case "roadmap-weeks":
      return (
        <Figure title="Weeks 1–3 parallel tracks">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { w: "Track A", t: "Technical literacy", d: "~30 min/week · APIs, docs, optional DSA" },
              { w: "Track B", t: "PM cores", d: "Sense · RICE/MoSCoW · OKRs/JTBD · research" },
              { w: "Track C", t: "Strengths", d: "Translate domain & people skills into PM stories" },
            ].map((x) => (
              <div key={x.w} className="border-2 border-ink bg-paper p-3">
                <div className="tag text-green">{x.w}</div>
                <div className="mt-2 font-display text-sm font-extrabold uppercase">{x.t}</div>
                <p className="mt-1 text-xs text-ink-soft">{x.d}</p>
              </div>
            ))}
          </div>
        </Figure>
      );
    case "tradeoff-scale":
      return (
        <Figure title="Speed ↔ scalability">
          <div className="flex items-center gap-2 border-2 border-ink bg-paper px-3 py-4">
            <span className="font-display text-xs font-black uppercase">Ship fast</span>
            <div className="relative h-3 flex-1 border-2 border-ink bg-paper-2">
              <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 border-2 border-ink bg-green" />
            </div>
            <span className="font-display text-xs font-black uppercase">Scale later</span>
          </div>
          <p className="mt-2 text-sm text-ink-soft">Name where you sit this week — and what debt you accept.</p>
        </Figure>
      );
    case "closing-menu":
      return (
        <Figure title="Closing question menu">
          <ul className="space-y-2 text-sm">
            {[
              "Success — what does good look like?",
              "Challenge — what’s hardest for someone new?",
              "Standards — what do your best people do?",
              "Culture — why do you like working here?",
              "Feedback — anything that would raise confidence / give pause? (rapport required)",
            ].map((line) => (
              <li key={line} className="flex gap-2 border-2 border-ink bg-green-wash px-3 py-2">
                <span aria-hidden className="font-black">
                  ▢
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Figure>
      );
    case "funnel":
      return (
        <Figure title="A simple product funnel">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-1">
            {[
              { w: "100%", l: "Awareness / visit" },
              { w: "72%", l: "Activation" },
              { w: "48%", l: "Retention" },
              { w: "22%", l: "Referral / expansion" },
            ].map((row) => (
              <div
                key={row.l}
                className="border-2 border-ink bg-green-wash py-2 text-center text-xs font-bold uppercase"
                style={{ width: row.w }}
              >
                {row.l}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-soft">Diagnose the biggest drop — don’t optimize a healthy step first.</p>
        </Figure>
      );
    case "metric-tree":
      return (
        <Figure title="North star → drivers → inputs">
          <div className="flex flex-col items-center gap-2 text-center text-xs font-bold uppercase">
            <div className="border-2 border-ink bg-green px-4 py-2">North star</div>
            <span aria-hidden>↓</span>
            <div className="flex flex-wrap justify-center gap-2">
              <div className="border-2 border-ink bg-green-wash px-3 py-2">Driver A</div>
              <div className="border-2 border-ink bg-green-wash px-3 py-2">Driver B</div>
            </div>
            <span aria-hidden>↓</span>
            <div className="flex flex-wrap justify-center gap-2">
              <div className="border-2 border-ink bg-paper px-2 py-1.5">Input</div>
              <div className="border-2 border-ink bg-paper px-2 py-1.5">Input</div>
              <div className="border-2 border-ink bg-paper px-2 py-1.5">Input</div>
            </div>
          </div>
        </Figure>
      );
    case "stakeholder-map":
      return (
        <Figure title="Influence × interest">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { t: "Manage closely", d: "High influence · high interest" },
              { t: "Keep satisfied", d: "High influence · low interest" },
              { t: "Keep informed", d: "Low influence · high interest" },
              { t: "Monitor", d: "Low influence · low interest" },
            ].map((c) => (
              <div key={c.t} className="border-2 border-ink bg-green-wash p-3">
                <div className="font-display text-sm font-black uppercase">{c.t}</div>
                <p className="mt-1 text-ink-soft">{c.d}</p>
              </div>
            ))}
          </div>
        </Figure>
      );
    case "okr-cascade":
      return (
        <Figure title="Objective → key results">
          <div className="space-y-2">
            <div className="border-2 border-ink bg-green px-3 py-2 font-display text-sm font-black uppercase">
              Objective — qualitative direction
            </div>
            <div className="ml-4 space-y-2 border-l-2 border-ink pl-4">
              {["KR1 — measurable outcome", "KR2 — measurable outcome", "KR3 — measurable outcome"].map((k) => (
                <div key={k} className="border-2 border-ink bg-green-wash px-3 py-2 text-sm font-bold">
                  {k}
                </div>
              ))}
            </div>
          </div>
        </Figure>
      );
    case "jtbd-lens":
      return (
        <Figure title="Jobs-to-be-done lens">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["When…", "Situation / trigger"],
              ["I want to…", "Progress sought"],
              ["So I can…", "Outcome / relief"],
            ].map(([h, d]) => (
              <div key={h} className="border-2 border-ink bg-paper p-3">
                <div className="font-display text-sm font-black uppercase text-green">{h}</div>
                <p className="mt-2 text-xs text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </Figure>
      );
    case "experiment-flow":
      return (
        <Figure title="Experiment before you peek">
          <div className="flex flex-wrap items-center justify-center gap-2 font-display text-xs font-black uppercase">
            {["Hypothesis", "Metric", "Design", "Decision rule", "Run", "Learn"].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="border-2 border-ink bg-green-wash px-2 py-1.5">{s}</span>
                {i < 5 && <span aria-hidden>→</span>}
              </span>
            ))}
          </div>
        </Figure>
      );
    case "problem-frame":
      return (
        <Figure title="Problem statement skeleton">
          <p className="border-2 border-ink bg-green-wash p-4 font-display text-sm font-bold leading-relaxed">
            When <span className="underline decoration-2">[situation]</span>,{" "}
            <span className="underline decoration-2">[user]</span> wants to{" "}
            <span className="underline decoration-2">[job]</span>, but{" "}
            <span className="underline decoration-2">[obstacle]</span>, which causes{" "}
            <span className="underline decoration-2">[impact]</span>.
          </p>
        </Figure>
      );
    case "discovery-loop":
      return (
        <Figure title="Discovery is continuous">
          <div className="grid gap-2 sm:grid-cols-4 text-center text-xs font-bold uppercase">
            {["Talk to users", "Synthesize", "Form bets", "Test cheaply"].map((s) => (
              <div key={s} className="border-2 border-ink bg-green-wash px-2 py-3">
                {s}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-ink-soft">Ship is one input to learning — not the end of discovery.</p>
        </Figure>
      );
    case "eng-collab":
      return (
        <Figure title="What eng needs from you">
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {[
              "Problem + non-goals",
              "Success metric",
              "Constraints (time, platform)",
              "Open questions (honest)",
              "Edge cases you already know",
              "Who decides what",
            ].map((item) => (
              <li key={item} className="border-2 border-ink bg-paper px-3 py-2 font-bold">
                {item}
              </li>
            ))}
          </ul>
        </Figure>
      );
    case "decision-log":
      return (
        <Figure title="Write decisions down">
          <div className="space-y-2 text-sm">
            {[
              ["Decision", "What we chose"],
              ["Context", "What we optimized for"],
              ["Alternatives", "What we rejected"],
              ["Revisit if", "What would change our mind"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 border-2 border-ink bg-green-wash px-3 py-2">
                <span className="w-24 shrink-0 font-display text-xs font-black uppercase">{k}</span>
                <span className="text-ink-soft">{v}</span>
              </div>
            ))}
          </div>
        </Figure>
      );
    case "pm-loop":
    default:
      return (
        <Figure title="Learn → Practice → Create">
          <div className="flex flex-wrap items-center justify-center gap-2 font-display text-sm font-black uppercase">
            <span className="border-2 border-ink bg-green px-3 py-2">Learn</span>
            <span aria-hidden>→</span>
            <span className="border-2 border-ink bg-green-wash px-3 py-2">Practice</span>
            <span aria-hidden>→</span>
            <span className="border-2 border-ink bg-paper px-3 py-2">Create</span>
          </div>
        </Figure>
      );
  }
}

function Figure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="my-8 border-2 border-ink bg-paper p-4 shadow-[var(--shadow-hard-sm)]">
      <figcaption className="mb-3 font-display text-xs font-extrabold uppercase tracking-wide text-green">
        {title}
      </figcaption>
      {children}
    </figure>
  );
}
