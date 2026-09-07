import { useEffect, useRef, useState } from "react";
import type { ApplyMaterialsResult } from "@/lib/apply/generateApplyMaterials";
import {
  loadApplyMaterialTemplates,
  saveApplyMaterialTemplates,
  type ApplyMaterialTemplates,
} from "@/lib/apply/applyMaterialTemplates";
import { applyBlueBtn, applyBlueGhostBtnSm } from "@/components/apply/applyUi";

export function ApplyMaterialsSection({
  materials,
  busy,
  error,
  onGenerate,
  userId,
  compact = false,
}: {
  materials: ApplyMaterialsResult | null;
  busy: boolean;
  error: string | null;
  onGenerate: (templates: ApplyMaterialTemplates) => void;
  userId: string | null;
  compact?: boolean;
}) {
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<"resume" | "cover" | null>(null);
  const [templates, setTemplates] = useState<ApplyMaterialTemplates>(() =>
    loadApplyMaterialTemplates(userId),
  );

  useEffect(() => {
    setTemplates(loadApplyMaterialTemplates(userId));
  }, [userId]);

  useEffect(() => {
    saveApplyMaterialTemplates(userId, templates);
  }, [templates, userId]);

  const copy = async (kind: "resume" | "cover", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  const readTemplateFile = async (file: File, kind: "resume" | "cover") => {
    const text = await file.text();
    setTemplates((prev) => ({
      ...prev,
      ...(kind === "resume"
        ? { resumeTemplate: text.trim(), resumeFileName: file.name }
        : { coverLetterTemplate: text.trim(), coverLetterFileName: file.name }),
    }));
  };

  return (
    <section className={compact ? "mt-4" : "mt-6"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[1.1rem] font-black uppercase">Tailored materials</h3>
        <button
          type="button"
          disabled={busy}
          onClick={() => onGenerate(templates)}
          className={applyBlueBtn}
        >
          {busy ? "Generating…" : materials ? "Regenerate" : "Generate resume + cover letter"}
        </button>
      </div>
      <p className="mt-2 text-[0.9rem] text-ink-soft">
        Built from Profile facts and this posting. Upload optional templates — with a cover letter
        template, AI adapts your voice, grades the draft, and targets 9/10 minimum.
      </p>

      <div className="mt-4 space-y-3 border-2 border-ink/15 bg-paper-2 px-3 py-3">
        <p className="font-display text-xs font-black uppercase">Optional templates</p>
        <input
          ref={resumeInputRef}
          type="file"
          accept=".txt,.md,.csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void readTemplateFile(file, "resume");
            e.target.value = "";
          }}
        />
        <input
          ref={coverInputRef}
          type="file"
          accept=".txt,.md,.csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void readTemplateFile(file, "cover");
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => resumeInputRef.current?.click()}
            className={applyBlueGhostBtnSm}
          >
            Upload resume template
          </button>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className={applyBlueGhostBtnSm}
          >
            Upload cover letter template
          </button>
        </div>
        {(templates.resumeFileName || templates.coverLetterFileName) && (
          <ul className="space-y-1 text-[0.88rem] text-ink-soft">
            {templates.resumeFileName && (
              <li className="flex items-center justify-between gap-2">
                <span>Resume: {templates.resumeFileName}</span>
                <button
                  type="button"
                  className="tag text-blue underline-offset-2 hover:underline"
                  onClick={() =>
                    setTemplates((prev) => ({
                      ...prev,
                      resumeTemplate: null,
                      resumeFileName: null,
                    }))
                  }
                >
                  Remove
                </button>
              </li>
            )}
            {templates.coverLetterFileName && (
              <li className="flex items-center justify-between gap-2">
                <span>Cover letter: {templates.coverLetterFileName}</span>
                <button
                  type="button"
                  className="tag text-blue underline-offset-2 hover:underline"
                  onClick={() =>
                    setTemplates((prev) => ({
                      ...prev,
                      coverLetterTemplate: null,
                      coverLetterFileName: null,
                    }))
                  }
                >
                  Remove
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <p className="mt-2 text-[0.9rem] text-pink">{error}</p>}
      {materials && (
        <div className="mt-4 space-y-3">
          <p className="tag text-ink-faint">
            Source: {materials.source === "ai" ? "AI draft" : "Coach draft"}
            {typeof materials.coverLetterScore === "number"
              ? ` · Cover letter score ${materials.coverLetterScore.toFixed(1)}/10`
              : ""}
            {materials.tailoringNotes.length ? ` · ${materials.tailoringNotes[0]}` : ""}
          </p>
          {materials.gradingNotes && materials.gradingNotes.length > 0 && (
            <ul className="space-y-1 text-[0.88rem] text-ink-soft">
              {materials.gradingNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          )}
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
