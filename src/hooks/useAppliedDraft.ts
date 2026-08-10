import { useState } from "react";
import type { AppliedApplication, AppliedStatus } from "@/types/apply";

export function useAppliedDraft(initial: AppliedApplication[]) {
  const [apps, setApps] = useState(initial);
  return {
    apps,
    setStatus: (id: string, status: AppliedStatus) => {
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    },
  };
}
