import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Network — The Product Place" },
      {
        name: "description",
        content:
          "Keep contacts, cold-email notes, referrals and follow-ups for your product management search in one place.",
      },
      { property: "og:title", content: "Network — The Product Place" },
      {
        property: "og:description",
        content:
          "Contacts, outreach, cold-email notes, referrals and follow-up history for aspiring PMs.",
      },
    ],
  }),
  component: NetworkPage,
});

function NetworkPage() {
  return (
    <PlaceholderPage
      kicker="Section 02 · Network"
      title="Network"
      tone="pink"
      pattern="grid-fine"
      blurb="Outreach is a paper trail, not a CRM. Who you wrote to, what you said, what they said back, and the one thing you promised to follow up on."
      bullets={[
        "Contacts with company, role and how you met",
        "Cold-email drafts and the notes behind them",
        "Referral requests and where each one landed",
        "Follow-up reminders that surface on Today",
        "A running history of every conversation",
      ]}
    />
  );
}
