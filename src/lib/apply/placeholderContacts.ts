import type { ContactSuggestion } from "@/types/apply";

/**
 * Fictional placeholders demonstrating future recommendation priority:
 * 1. Recruiter
 * 2. School alum
 * 3. Relevant PM
 * 4. Former Product Intern
 * 5. Other useful contact
 */
export const PLACEHOLDER_CONTACTS: ContactSuggestion[] = [
  {
    id: "ph-recruiter",
    label: "RECRUITER · University Recruiter",
    detail: "Campus recruiting lead (placeholder)",
  },
  {
    id: "ph-alum",
    label: "School alum at the company",
    detail: "Product org · same school (placeholder)",
  },
  {
    id: "ph-pm",
    label: "Relevant Product Manager",
    detail: "Adjacent product area (placeholder)",
  },
  {
    id: "ph-intern",
    label: "Former Product Intern",
    detail: "Recent intern cohort (placeholder)",
  },
  {
    id: "ph-other",
    label: "Other useful company contact",
    detail: "Hiring manager or team member (placeholder)",
  },
];
