import { createFileRoute } from "@tanstack/react-router";
import { PracticeWorkspace, type PracticeSearch } from "@/components/practice/PracticeWorkspace";
import type { PracticeAnswerFormat, PracticeCategory } from "@/lib/learning/types";
import { PRACTICE_CATEGORY_LABELS, PRACTICE_FORMAT_LABELS } from "@/lib/learning/types";

const CATEGORIES = new Set(Object.keys(PRACTICE_CATEGORY_LABELS));
const FORMATS = new Set(Object.keys(PRACTICE_FORMAT_LABELS));

export const Route = createFileRoute("/practice")({
  validateSearch: (search: Record<string, unknown>): PracticeSearch => {
    const out: PracticeSearch = {};
    const mode = search["mode"];
    if (
      mode === "home" ||
      mode === "quick" ||
      mode === "bank" ||
      mode === "drill" ||
      mode === "mock"
    ) {
      out.mode = mode;
    }
    if (typeof search["q"] === "string" && search["q"]) out.q = search["q"];
    const cat = search["category"];
    if (cat === "surprise" || cat === "all" || (typeof cat === "string" && CATEGORIES.has(cat))) {
      out.category = cat as PracticeCategory | "surprise" | "all";
    }
    const fmt = search["format"];
    if (fmt === "any" || (typeof fmt === "string" && FORMATS.has(fmt))) {
      out.format = fmt as PracticeAnswerFormat | "any";
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "Practice — The Product Place" },
      {
        name: "description",
        content:
          "PM thinking gym: write/speak, multiple choice, checkbox drills, and technical / behavioral mocks.",
      },
      { property: "og:title", content: "Practice — The Product Place" },
      {
        property: "og:description",
        content: "Original practice prompts with graded feedback — tap or type.",
      },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PracticeWorkspace
      search={search}
      navigate={({ search: next, replace }) => {
        void navigate({ search: next, ...(replace ? { replace: true } : {}) });
      }}
    />
  );
}
