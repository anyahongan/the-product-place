import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create — The Product Place" },
      {
        name: "description",
        content:
          "Product project prompts, build guidance and a place to document your process into portfolio case studies.",
      },
      { property: "og:title", content: "Create — The Product Place" },
      {
        property: "og:description",
        content:
          "Project prompts and guidance for turning product work into portfolio case studies.",
      },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  return (
    <PlaceholderPage
      kicker="Section 04 · Create"
      title="Create"
      tone="yellow"
      pattern="grid-fine"
      blurb="The fastest way to sound like a PM is to have built something. Take a prompt, work in the open, and leave with a case study instead of a screenshot."
      bullets={[
        "Product project prompts with real constraints",
        "Guidance for scoping something you can finish",
        "Process documentation as you go, not after",
        "Turn the notebook into a portfolio case study",
        "Room for research, tradeoffs and what you'd cut",
      ]}
    />
  );
}
