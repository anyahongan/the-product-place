import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — The Product Place" },
      {
        name: "description",
        content:
          "Curated product management learning: terminology, frameworks and PM specializations, taught in short notebook lessons.",
      },
      { property: "og:title", content: "Learn — The Product Place" },
      {
        property: "og:description",
        content:
          "Curated PM learning — terminology, frameworks and specializations in short notebook lessons.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <PlaceholderPage
      kicker="Section 03 · Learn"
      title="Learn"
      tone="green"
      pattern="ruled"
      blurb="A curriculum you can actually finish. Short lessons, real vocabulary, and the frameworks that come up in rooms where decisions get made."
      bullets={[
        "Product management terminology, defined plainly",
        "Frameworks with worked examples, not just diagrams",
        "PM specializations: growth, platform, data, hardware",
        "Progress that remembers where you left off",
        "External reading, curated rather than dumped",
      ]}
    />
  );
}
