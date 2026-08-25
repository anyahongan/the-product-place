import { createFileRoute } from "@tanstack/react-router";
import { CreateWorkspace, type CreateSearch } from "@/components/create/CreateWorkspace";
import type { CreateTemplateType } from "@/lib/learning/types";
import { CREATE_TEMPLATES } from "@/lib/learning/content";

const TEMPLATES = new Set(CREATE_TEMPLATES.map((t) => t.id));

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): CreateSearch => {
    const out: CreateSearch = {};
    if (typeof search["project"] === "string" && search["project"]) out.project = search["project"];
    const template = search["template"];
    if (typeof template === "string" && TEMPLATES.has(template as CreateTemplateType)) {
      out.template = template as CreateTemplateType;
    }
    if (typeof search["fromPractice"] === "string" && search["fromPractice"]) {
      out.fromPractice = search["fromPractice"];
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "Create — The Product Place" },
      {
        name: "description",
        content:
          "Build real Product portfolio pieces — teardowns, feature proposals, 0→1 bets, PRDs, and experiment writeups that autosave privately.",
      },
      { property: "og:title", content: "Create — The Product Place" },
      {
        property: "og:description",
        content: "Create portfolio-ready Product work linked to Learn and Practice.",
      },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CreateWorkspace
      search={search}
      navigate={({ search: next, replace }) => {
        void navigate({ search: next, ...(replace ? { replace: true } : {}) });
      }}
    />
  );
}
