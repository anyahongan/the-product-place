import { createFileRoute } from "@tanstack/react-router";
import { ApplyWorkspace } from "@/components/apply/ApplyWorkspace";
import type { LifecycleTab } from "@/types/apply";

export type ApplySearch = {
  tab?: LifecycleTab;
  application?: string;
};

export const Route = createFileRoute("/apply")({
  validateSearch: (search: Record<string, unknown>): ApplySearch => {
    const out: ApplySearch = {};
    const tab = search["tab"];
    if (tab === "apply" || tab === "applied" || tab === "interviewing") out.tab = tab;
    if (typeof search["application"] === "string") out.application = search["application"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Apply — The Product Place" },
      {
        name: "description",
        content:
          "Discover product roles, track applications, and prepare for interviews in one stationery-style planner.",
      },
      { property: "og:title", content: "Apply — The Product Place" },
      {
        property: "og:description",
        content:
          "Apply, Applied, and Interviewing — discovery, tracking, and role-specific prep on paper.",
      },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  return <ApplyWorkspace />;
}
