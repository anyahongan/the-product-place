import type { useProductJobs } from "@/hooks/useProductJobs";
import type { RecruitingContextValue } from "@/components/recruiting/recruitingContextInstance";

type AppsSlice = Pick<
  RecruitingContextValue,
  | "apps"
  | "savedIds"
  | "queueIds"
  | "hydrated"
  | "interviewingApps"
  | "stats"
  | "toggleSaved"
  | "markApplied"
  | "addToAutoQueue"
  | "setStatus"
>;

export type ApplyContextValue = AppsSlice & ReturnType<typeof useProductJobs>;
