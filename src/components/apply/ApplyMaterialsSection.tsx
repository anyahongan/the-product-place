import { useState } from "react";
import type { ApplyMaterialsResult } from "@/lib/apply/generateApplyMaterials";
import { applyBlueGhostBtnSm, applyBlueBtn } from "@/components/apply/applyUi";

export function ApplyMaterialsSection({
  materials,
  busy,
  error,
  onGenerate,
  compact = false,
}: {
  materials: ApplyMaterialsResult | null;
  busy: boolean;
  error: string | null;
  onGenerate: () => void;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState<"resume" | "cover" | null>(null);

  const copy = async (kind: "resume" | "cover", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className={compact ? "mt-4" : "mt-6"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[1.1rem] font-black uppercase">
          Tailored materials
        </h3>
        <button type="button" disabled={busy} onClick={onGenerate} className={applyBlueBtn}>
          {busy ? "Generating…" : materials ? "Regenerate" : "Generate resume + cover letter"}
        </button>
      </div>
      <p className="mt-2 text-[0.9rem] text-ink-soft">
        Built only from Profile facts and this job posting — nothing invented, nothing auto-submitted.
      </p>
      {error && <p className="mt-2 text-[0.9rem] text-pink">{error}</p>}
      {materials && (
        <div className="mt-4 space-y-3">
          <p className="tag text-ink-faint">
            Source: {materials.source === "ai" ? "AI draft" : "Coach draft"}
            {materials.tailoringNotes.length ? ` · ${materials.tailoringNotes[0]}` : ""}
          </p>
          <div className="border-2 border-ink bg-paper px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xs font-black uppercase">Resume draft</p>
              <button
                type="button"
                onClick={() => void copy("resume", materials.resumeText)}
                className={applyBlueGhostBtnSm}
              >
                {copied === "resume" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-sans text-[0.85rem] text-ink-soft">
              {materials.resumeText}
            </pre>
          </div>
          <div className="border-2 border-ink bg-paper px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xs font-black uppercase">Cover letter draft</p>
              <button
                type="button"
                onClick={() => void copy("cover", materials.coverLetterText)}
                className={applyBlueGhostBtnSm}
              >
                {copied === "cover" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-sans text-[0.85rem] text-ink-soft">
              {materials.coverLetterText}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
