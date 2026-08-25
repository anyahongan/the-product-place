import type { ExternalResource } from "@/lib/learning/types";

/**
 * Curated external pointers — not required product features.
 * Keep the list short; links may be placeholders where official URLs change.
 */
export const FURTHER_RESOURCES: Array<ExternalResource & { category: string }> = [
  {
    category: "Technical practice",
    label: "NeetCode",
    url: "https://neetcode.io/",
    note: "Optional coding practice if you want interview fluency — not a substitute for PM craft.",
  },
  {
    category: "Cloud basics",
    label: "Microsoft Learn — Azure Fundamentals",
    url: "https://learn.microsoft.com/training/paths/azure-fundamentals/",
    note: "Lightweight cloud vocabulary for technical screens and eng conversations.",
  },
  {
    category: "Developer literacy",
    label: "GitHub Foundations",
    url: "https://learn.microsoft.com/training/paths/github-foundations/",
    note: "Useful if repos, PRs, and issues still feel foreign.",
  },
  {
    category: "Roadmaps",
    label: "roadmap.sh — Product Manager",
    url: "https://roadmap.sh/product-manager",
    note: "Broad topic map — treat as a menu, not a mandatory syllabus.",
  },
];
