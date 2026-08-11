import { useContext } from "react";
import { ApplyContext } from "@/components/apply/applyContextInstance";

export function useApplyContext() {
  const ctx = useContext(ApplyContext);
  if (!ctx) throw new Error("useApplyContext must be used within ApplyProvider");
  return ctx;
}
