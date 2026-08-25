import { createFileRoute } from "@tanstack/react-router";
import { LearnWorkspace, type LearnSearch } from "@/components/learn/LearnWorkspace";

export const Route = createFileRoute("/learn")({
  validateSearch: (search: Record<string, unknown>): LearnSearch => {
    const out: LearnSearch = {};
    if (typeof search["lesson"] === "string" && search["lesson"]) out.lesson = search["lesson"];
    if (search["view"] === "glossary" || search["view"] === "resources" || search["view"] === "import")
      out.view = search["view"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Learn — The Product Place" },
      {
        name: "description",
        content:
          "A concise Product field guide: durable PM concepts in short lessons you can finish, practice, and create with.",
      },
      { property: "og:title", content: "Learn — The Product Place" },
      {
        property: "og:description",
        content: "Original PM field-guide lessons — foundations, sense, metrics, strategy, and practice links.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <LearnWorkspace
      search={search}
      navigate={({ search: next, replace }) => {
        void navigate({ search: next, ...(replace ? { replace: true } : {}) });
      }}
    />
  );
}
