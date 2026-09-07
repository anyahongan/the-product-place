import type { ApplicationMode } from "@/types/apply";

export function modeCta(mode: ApplicationMode): string {
  if (mode === "quick") return "QUICK APPLY →";
  return "APPLY →";
}

export function applyListCta(): string {
  return "ADD TO APPLY LIST";
}
