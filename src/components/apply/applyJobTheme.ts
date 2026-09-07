import type { JobListingView } from "@/lib/apply/types";
import type { ToneName } from "@/types/apply";
import { cn } from "@/lib/utils";

const btnBase =
  "focus-ink border-2 border-ink font-display font-black uppercase outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50";

type ThemeTone = ToneName;

const HEADER: Record<ThemeTone, string> = {
  blue: "bg-blue text-paper",
  green: "bg-green text-ink",
  yellow: "bg-yellow text-ink",
  pink: "bg-pink text-paper",
  purple: "bg-purple text-paper",
};

const WASH: Record<ThemeTone, string> = {
  blue: "bg-blue-wash text-ink",
  green: "bg-green-wash text-ink",
  yellow: "bg-yellow-wash text-ink",
  pink: "bg-pink-wash text-ink",
  purple: "bg-purple-wash text-ink",
};

const PRIMARY_BTN: Record<ThemeTone, string> = {
  blue: "bg-blue text-paper hover:bg-ink",
  green: "bg-green text-ink hover:bg-ink hover:text-paper",
  yellow: "bg-yellow text-ink hover:bg-ink hover:text-paper",
  pink: "bg-pink text-paper hover:bg-ink",
  purple: "bg-purple text-paper hover:bg-ink",
};

/** White / paper CTA — hover fills with the role theme. */
const PAPER_BTN: Record<ThemeTone, string> = {
  blue: "bg-paper text-ink hover:bg-blue hover:text-paper",
  green: "bg-paper text-ink hover:bg-green hover:text-ink",
  yellow: "bg-paper text-ink hover:bg-yellow hover:text-ink",
  pink: "bg-paper text-ink hover:bg-pink hover:text-paper",
  purple: "bg-paper text-ink hover:bg-purple hover:text-paper",
};

const ACCENT_TEXT: Record<ThemeTone, string> = {
  blue: "text-blue",
  green: "text-green",
  yellow: "text-yellow",
  pink: "text-pink",
  purple: "text-purple",
};

const BULLET: Record<ThemeTone, string> = {
  blue: "bg-blue",
  green: "bg-green",
  yellow: "bg-yellow",
  pink: "bg-pink",
  purple: "bg-purple",
};

/** Same hue as the role — wash fill reads as a lighter shade on solid headers. */
const CLIP_FILL: Record<ThemeTone, string> = {
  blue: "var(--blue-wash)",
  green: "var(--green-wash)",
  yellow: "var(--yellow-wash)",
  pink: "var(--pink-wash)",
  purple: "var(--purple-wash)",
};

const HEADER_MUTED: Record<ThemeTone, string> = {
  blue: "text-paper/80",
  green: "text-ink/70",
  yellow: "text-ink/70",
  pink: "text-paper/80",
  purple: "text-paper/80",
};

const LIST_MUTED: Record<ThemeTone, string> = {
  blue: "text-ink/70",
  green: "text-ink/70",
  yellow: "text-ink/70",
  pink: "text-ink/70",
  purple: "text-ink/70",
};

export type ApplyJobTheme = {
  tone: ThemeTone;
  clipColor: ThemeTone;
  clipFill: string;
  header: string;
  headerMuted: string;
  listHeader: string;
  listHeaderMuted: string;
  wash: string;
  primaryBtn: string;
  primaryBtnSm: string;
  primaryBtnLg: string;
  paperBtn: string;
  paperBtnSm: string;
  paperBtnLg: string;
  accentText: string;
  bullet: string;
  card: string;
};

export function resolveJobTone(job: JobListingView): ThemeTone {
  return job.tone === "pink" ? "blue" : job.tone;
}

export function applyJobTheme(job: JobListingView): ApplyJobTheme {
  const tone = resolveJobTone(job);
  const primary = PRIMARY_BTN[tone];
  const paper = PAPER_BTN[tone];

  return {
    tone,
    clipColor: tone,
    clipFill: CLIP_FILL[tone],
    header: cn("border-b-2 border-ink px-5 py-4 sm:px-8 md:px-10", HEADER[tone]),
    headerMuted: HEADER_MUTED[tone],
    listHeader: cn(
      "border-b-2 border-ink px-3 py-3 sm:border-b-0 sm:border-r-2 sm:px-4",
      WASH[tone],
    ),
    listHeaderMuted: LIST_MUTED[tone],
    wash: WASH[tone],
    primaryBtn: cn(btnBase, "px-3 py-2 text-xs", primary),
    primaryBtnSm: cn(btnBase, "px-2.5 py-1.5 text-[0.65rem]", primary),
    primaryBtnLg: cn(btnBase, "px-4 py-3 text-base", primary),
    paperBtn: cn(btnBase, "px-3 py-2 text-xs", paper),
    paperBtnSm: cn(btnBase, "px-2.5 py-1.5 text-[0.65rem]", paper),
    paperBtnLg: cn(btnBase, "px-4 py-3 text-base", paper),
    accentText: ACCENT_TEXT[tone],
    bullet: BULLET[tone],
    card: "border-2 border-ink bg-paper px-4 py-3 text-ink shadow-hard-sm",
  };
}

export function themedLinkClass(theme: ApplyJobTheme): string {
  return cn(theme.primaryBtn, "inline-block no-underline");
}
