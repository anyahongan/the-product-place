import { createContext } from "react";
import type { ApplyContextValue } from "@/components/apply/applyContextValue";

export const ApplyContext = createContext<ApplyContextValue | null>(null);
