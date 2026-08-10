import { createFileRoute } from "@tanstack/react-router";
import { ApplyWorkspace } from "@/components/apply/ApplyWorkspace";

export const Route = createFileRoute("/apply")({
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
