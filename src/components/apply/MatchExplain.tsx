import type { JobMatchResult, MatchSignal } from "@/lib/matching";
import { cn } from "@/lib/utils";

function signalMark(status: MatchSignal["status"]): string {
  if (status === "positive") return "✓";
  if (status === "negative") return "!";
  if (status === "unknown") return "?";
  return "·";
}

export function MatchBadge({
  match,
  toneLight,
}: {
  match: JobMatchResult | null | undefined;
  toneLight: boolean;
}) {
  if (!match?.personalized) {
    return (
      <>
        <span className={cn("tag", toneLight ? "text-ink" : "text-paper")}>Role</span>
        <span
          className={cn(
            "font-display text-[1.35rem] font-black leading-none tracking-[-0.04em]",
            toneLight ? "text-ink" : "text-paper",
          )}
        >
          <span className="text-[0.95rem] uppercase">Open</span>
        </span>
      </>
    );
  }

  if (match.showNumeric) {
    return (
      <>
        <span className={cn("tag", toneLight ? "text-ink" : "text-paper")}>Match</span>
        <span
          className={cn(
            "font-display text-[1.35rem] font-black leading-none tracking-[-0.04em]",
            toneLight ? "text-ink" : "text-paper",
          )}
        >
          {Math.round(match.score)}
          <span className="text-[1rem]">%</span>
        </span>
      </>
    );
  }

  // Low coverage / hard mismatch: tier label, not false precision
  const shortTier = match.tier.replace(" MATCH", "");
  return (
    <>
      <span className={cn("tag", toneLight ? "text-ink" : "text-paper")}>
        {match.hardMismatch ? "Mismatch" : "Match"}
      </span>
      <span
        className={cn(
          "max-w-[5.5rem] font-display text-[0.72rem] font-black uppercase leading-tight tracking-[-0.02em]",
          toneLight ? "text-ink" : "text-paper",
        )}
      >
        {shortTier}
        {!match.hardMismatch && match.coverage < 0.55 ? (
          <span className="mt-0.5 block text-[0.58rem] font-bold normal-case tracking-normal opacity-80">
            Limited data
          </span>
        ) : null}
      </span>
    </>
  );
}

export function WhyThisMatch({ match }: { match: JobMatchResult | null | undefined }) {
  if (!match?.personalized || match.signals.length === 0) return null;

  const helpful = match.signals.filter(
    (s) => s.status === "positive" || s.status === "negative" || s.status === "unknown",
  );
  if (helpful.length === 0) return null;

  return (
    <details className="mt-3 border-2 border-ink/20 bg-paper/60 px-3 py-2">
      <summary className="cursor-pointer font-display text-xs font-black uppercase tracking-wide text-ink-soft outline-none">
        Why this match
        {!match.showNumeric && !match.hardMismatch ? (
          <span className="ml-2 font-sans text-[0.65rem] font-semibold normal-case tracking-normal text-ink-faint">
            · limited job data
          </span>
        ) : null}
      </summary>
      <ul className="mt-2 space-y-1.5">
        {helpful.map((s) => (
          <li key={`${s.type}-${s.label}`} className="flex gap-2 text-[0.82rem] text-ink-soft">
            <span className="w-3 shrink-0 font-display font-black" aria-hidden>
              {signalMark(s.status)}
            </span>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
