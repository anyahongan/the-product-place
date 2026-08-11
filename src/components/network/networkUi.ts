import { cn } from "@/lib/utils";

/** Forced pink hover so it always wins over base fills. */
const pinkHover = "transition-colors hover:!bg-[var(--pink)] hover:!text-[var(--paper)]";

/** Shared Network control styles — pink hover on Close, View, Draft actions. */
export const netBtn = {
  close: cn(
    "focus-ink border-2 border-ink bg-paper px-3 py-2 font-display text-sm font-black uppercase text-ink outline-none",
    pinkHover,
  ),
  closeSm: cn(
    "focus-ink border-2 border-ink bg-paper px-3 py-1.5 font-display text-sm font-black uppercase text-ink outline-none",
    pinkHover,
  ),
  view: cn(
    "focus-ink border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-black uppercase text-ink outline-none",
    pinkHover,
  ),
  draftKind: cn(
    "focus-ink border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-black uppercase text-ink outline-none",
    pinkHover,
  ),
  draftAction: cn(
    "focus-ink border-2 border-ink bg-ink px-3 py-2 font-display text-xs font-black uppercase text-paper outline-none",
    pinkHover,
  ),
  barAction: cn(
    "focus-ink border-2 border-ink bg-paper px-2.5 py-1.5 font-display text-[0.65rem] font-black uppercase leading-none text-ink outline-none",
    pinkHover,
  ),
  timelineLink: cn(
    "focus-ink tag border-2 border-ink bg-paper px-2 py-1 font-black uppercase text-ink outline-none",
    pinkHover,
  ),
  metaChip: "tag border-2 border-ink bg-paper px-2 py-1 uppercase text-ink",
} as const;

export function referralStatusClass(active: boolean) {
  return cn(
    "focus-ink border-2 border-ink px-2 py-1.5 font-display text-[0.7rem] font-black uppercase outline-none transition-colors",
    active ? "bg-blue text-paper" : cn("bg-paper text-ink", pinkHover),
  );
}
