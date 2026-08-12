import { createFileRoute } from "@tanstack/react-router";
import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — The Product Place" },
      {
        name: "description",
        content:
          "Build your career dossier: basics, targets, master resume, and a factual experience library for future applications.",
      },
      { property: "og:title", content: "Profile — The Product Place" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return <ProfileWorkspace />;
}
