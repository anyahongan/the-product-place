import { useState } from "react";
import { Sheet, Tape } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import type { CommunicationFormatPreference } from "@/types/network";
import { cn } from "@/lib/utils";

const DEFAULT_TEMPLATE = `Hi [First Name],

I hope you are having a good day. My name is [Your Name], and I am a [Major] student at [School] interested in [Field]. I wanted to reach out to you because [Specific Reason].

I am preparing an application for [Role] at [Company] and would value 15 minutes to learn how you think about the role.

Thank you for considering,
[Your Name]`;

const PALE_YELLOW = "color-mix(in oklch, var(--yellow) 42%, var(--paper))";

export function CommunicationFormatPrompt({
  onComplete,
  onClose,
}: {
  onComplete: (pref: CommunicationFormatPreference) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"choose" | "template">("choose");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [hovered, setHovered] = useState<"ai" | "template" | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <Sheet tone="paper" shadow="hard" className="relative w-full max-w-xl px-5 py-5 sm:px-6">
        <Tape className="-top-3 left-8" color="pink" angle={-5} width={110} height={22} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="tag text-pink">First visit · Network</p>
            <h2 className="mt-2 font-display text-[1.7rem] font-black uppercase leading-none">
              How should outreach drafts start?
            </h2>
          </div>
          <PinkHoverButton variant="closeSm" onClick={onClose}>
            Close
          </PinkHoverButton>
        </div>
        <p className="mt-3 text-[0.98rem] text-ink-soft">
          Choose once. You can change this later from a draft panel. No emails are sent from here.
        </p>

        {mode === "choose" ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-stretch">
            <button
              type="button"
              onClick={() =>
                onComplete({ mode: "ai", template: null, setAt: new Date().toISOString() })
              }
              onMouseEnter={() => setHovered("ai")}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered("ai")}
              onBlur={() => setHovered(null)}
              style={{ background: hovered === "ai" ? PALE_YELLOW : "var(--paper)" }}
              className={cn(
                "focus-ink flex h-full flex-col border-2 border-ink px-4 py-4 text-left text-ink outline-none transition-[background-color] duration-150",
              )}
            >
              <span className="font-display text-[1.05rem] font-black uppercase leading-none tracking-[-0.02em]">
                AI format
              </span>
              <span className="mt-3 block flex-1 text-[0.9rem] text-ink-soft">
                Draft from your Profile facts with AI when configured, otherwise a coach template.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("template")}
              onMouseEnter={() => setHovered("template")}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered("template")}
              onBlur={() => setHovered(null)}
              style={{ background: hovered === "template" ? PALE_YELLOW : "var(--paper)" }}
              className={cn(
                "focus-ink flex h-full flex-col border-2 border-ink px-4 py-4 text-left text-ink outline-none transition-[background-color] duration-150",
              )}
            >
              <span className="font-display text-[1.05rem] font-black uppercase leading-none tracking-[-0.02em]">
                My template
              </span>
              <span className="mt-3 block flex-1 text-[0.9rem] text-ink-soft">
                Paste your usual email or use fill-in-the-blank tokens for every draft.
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="tag text-ink-faint">
              Use tokens like [First Name], [Company], [Role], [Your Name], [Major], [School],
              [Field], [Specific Reason]
            </p>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={12}
              className="w-full resize-y border-2 border-ink bg-paper-2 px-3 py-2 font-sans text-[0.92rem] leading-relaxed outline-none focus:bg-yellow-wash"
            />
            <div className="flex flex-wrap gap-2">
              <PinkHoverButton
                variant="ink"
                onClick={() =>
                  onComplete({
                    mode: "template",
                    template,
                    setAt: new Date().toISOString(),
                  })
                }
              >
                Save my format
              </PinkHoverButton>
              <PinkHoverButton variant="closeSm" onClick={() => setMode("choose")}>
                Back
              </PinkHoverButton>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
