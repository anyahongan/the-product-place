/** Practice controls: pale yellow defaults, medium yellow + white on hover/active. */

/** Warm readable yellow for titles/labels — maps to --yellow-ink. */
export const practiceTitleYellow = "text-yellow-ink";

/** Slightly deeper warm yellow for section / hero titles. */
export const practiceHeadingYellow = "text-yellow-ink-deep";

/** Start drill / primary CTA: pale → medium yellow with white type. */
export const practiceBtn =
  "border-2 border-ink bg-yellow-wash px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-ink transition focus-ink hover:bg-yellow hover:text-paper active:bg-yellow active:text-paper disabled:opacity-40";

export const practiceBtnSm =
  "border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink transition focus-ink hover:bg-yellow-wash disabled:opacity-40";

/**
 * Buttons sitting on yellow-wash surfaces (coach grade card).
 * Hover goes ink — not yellow-wash — so it doesn’t disappear into the sheet.
 */
export const practiceBtnOnWash =
  "border-2 border-ink bg-paper px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink transition focus-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper disabled:opacity-40";

/** Solid yellow nav chips — wash on hover. */
export const practiceBtnAccent =
  "border-2 border-ink bg-yellow px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink transition focus-ink hover:bg-yellow-wash disabled:opacity-40";

export const practiceBtnAccentMd =
  "border-2 border-ink bg-yellow px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-ink transition focus-ink hover:bg-yellow-wash disabled:opacity-40";

/** List/card rows — do not force uppercase on body copy (titles set uppercase locally). */
export const practiceBtnBlock =
  "group focus-ink w-full border-2 border-ink bg-paper px-5 py-4 text-left font-sans text-sm font-normal tracking-normal text-ink transition hover:bg-yellow-wash";

export const practiceBtnBlockActive =
  "group focus-ink w-full border-2 border-ink bg-yellow px-5 py-4 text-left font-sans text-sm font-normal tracking-normal text-ink transition hover:bg-yellow-wash";

/** Mode cards: pale yellow default → medium yellow + white type on hover. */
export const practiceBtnCard =
  "group focus-ink border-2 border-ink bg-yellow-wash p-6 text-left shadow-[var(--shadow-hard-sm)] transition hover:-translate-y-0.5 hover:bg-yellow hover:text-paper";

/** Active / in-progress highlight (Speak live open, listening). */
export const practiceBtnActive =
  "border-2 border-ink bg-yellow px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink transition focus-ink hover:bg-yellow-wash";

export const practiceBtnListening = practiceBtnActive;

/** Sentence-case a phrase for bullets / checklist lines. */
export function sentenceCase(input: string): string {
  const t = input.trim();
  if (!t) return t;
  const i = t.search(/[A-Za-z]/);
  if (i < 0) return t;
  let out = t.slice(0, i) + t[i]!.toUpperCase() + t.slice(i + 1);
  if (!/[.!?]$/.test(out)) out += ".";
  return out;
}

/** Title Case for short display titles (keeps small words lower unless first/last). */
export function titleCase(input: string): string {
  const small = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "via"]);
  const parts = input.trim().split(/(\s+|\/)/);
  return parts
    .map((w, idx) => {
      if (/^\s+$/.test(w) || w === "/") return w;
      const lower = w.toLowerCase();
      const isEdge = idx === 0 || idx === parts.length - 1;
      if (!isEdge && small.has(lower)) return lower;
      if (/^[A-Z0-9]+$/.test(w) && w.length <= 4) return w; // keep APM, API, etc. if already caps
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}
