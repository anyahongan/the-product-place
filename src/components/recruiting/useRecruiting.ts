import { useContext } from "react";
import { RecruitingContext } from "@/components/recruiting/recruitingContextInstance";

export function useRecruiting() {
  const ctx = useContext(RecruitingContext);
  if (!ctx) throw new Error("useRecruiting must be used within RecruitingProvider");
  return ctx;
}
