import { createFileRoute } from "@tanstack/react-router";
import { SetupWorkspace } from "@/components/setup/SetupWorkspace";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Account Setup — The Product Place" },
      {
        name: "description",
        content:
          "Set up your Product Place workspace: basics, target roles, work preferences, and optional master resume.",
      },
      { property: "og:title", content: "Account Setup — The Product Place" },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  return <SetupWorkspace />;
}
