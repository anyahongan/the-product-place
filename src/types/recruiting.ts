import type { ToneName } from "@/types/apply";

/** Stable company entity shared by Apply + Network */
export type Company = {
  id: string;
  name: string;
  tone: ToneName;
};

export type ContactApplicationRelationshipContext =
  | "RECRUITING"
  | "REFERRAL"
  | "INTERVIEW INSIGHT"
  | "GENERAL NETWORKING";

/** Many-to-many contact ↔ application */
export type ContactApplicationLink = {
  id: string;
  contactId: string;
  applicationId: string;
  relationshipContext: ContactApplicationRelationshipContext;
};

/** Normalize display names into stable `co-*` IDs (e.g. Figma → co-figma). */
export function companyIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `co-${slug || "unknown"}`;
}

const TONES: ToneName[] = ["blue", "green", "yellow", "purple"];

export function toneForCompanyId(companyId: string): ToneName {
  let hash = 0;
  for (let i = 0; i < companyId.length; i++) hash = (hash * 31 + companyId.charCodeAt(i)) | 0;
  return TONES[Math.abs(hash) % TONES.length]!;
}
