import { normalizeLinkedInUrl } from "@/lib/network/linkedinUrl";
import { cn } from "@/lib/utils";
import type { MouseEvent } from "react";

export function ContactLinkedInLink({
  url,
  className,
  size = "sm",
  onClick,
}: {
  url: string | null | undefined;
  className?: string;
  size?: "sm" | "xs";
  onClick?: (e: MouseEvent) => void;
}) {
  const linkedin = normalizeLinkedInUrl(url);
  if (!linkedin) return null;

  return (
    <a
      href={linkedin}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick ?? ((e) => e.stopPropagation())}
      className={cn(
        "focus-ink inline-flex border-2 border-ink bg-blue font-display font-black uppercase text-paper outline-none transition-colors hover:bg-ink",
        size === "xs" ? "px-2 py-0.5 text-[0.65rem]" : "px-2 py-1 text-[0.7rem]",
        className,
      )}
    >
      LinkedIn →
    </a>
  );
}
