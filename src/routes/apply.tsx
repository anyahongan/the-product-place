import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply — The Product Place" },
      {
        name: "description",
        content:
          "Track product management internship discovery, deadlines, application status, resumes and interview progress in one planner.",
      },
      { property: "og:title", content: "Apply — The Product Place" },
      {
        property: "og:description",
        content:
          "Internship discovery, deadlines, application status and interview progress, kept in a paper planner.",
      },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  return (
    <PlaceholderPage
      kicker="Section 01 · Apply"
      title="Apply"
      tone="blue"
      pattern="grid"
      blurb="Every internship you're chasing, on one sheet: found, drafted, submitted, interviewing. Deadlines sit in the margin so nothing quietly passes."
      bullets={[
        "Internship discovery and a saved shortlist",
        "Deadline tracking with graduation-year eligibility",
        "Application status from not started to offer",
        "Resume and cover letter versions per company",
        "Interview rounds and notes attached to each role",
      ]}
    />
  );
}
