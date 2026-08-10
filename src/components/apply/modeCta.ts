import type { ApplicationMode } from "@/types/apply";

export function modeCta(mode: ApplicationMode): string {
  if (mode === "quick") return "QUICK APPLY →";
  if (mode === "auto") return "ADD TO AUTO QUEUE →";
  return "APPLY →";
}
