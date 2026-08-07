import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice — The Product Place" },
      {
        name: "description",
        content:
          "Practice PM interviews across product sense, execution and metrics, behavioral questions and case studies.",
      },
      { property: "og:title", content: "Practice — The Product Place" },
      {
        property: "og:description",
        content:
          "Product sense, execution and metrics, behavioral and case study interview practice for student PMs.",
      },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  return (
    <PlaceholderPage
      kicker="Section 05 · Practice"
      title="Practice"
      tone="purple"
      pattern="grid"
      blurb="Four rooms, four kinds of question. Say the answer out loud, write the structure down, and notice which one you keep avoiding."
      bullets={[
        "Product Sense — design and improve prompts",
        "Execution & Metrics — diagnose the number that moved",
        "Behavioral — stories with a decision inside them",
        "Case Studies — longer walkthroughs, end to end",
        "Your own notes kept beside each prompt",
      ]}
    />
  );
}
