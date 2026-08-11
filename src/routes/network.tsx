import { createFileRoute } from "@tanstack/react-router";
import { NetworkWorkspace } from "@/components/network/NetworkWorkspace";

export type NetworkSearch = {
  company?: string;
  application?: string;
  contact?: string;
};

export const Route = createFileRoute("/network")({
  validateSearch: (search: Record<string, unknown>): NetworkSearch => {
    const out: NetworkSearch = {};
    if (typeof search["company"] === "string") out.company = search["company"];
    if (typeof search["application"] === "string") out.application = search["application"];
    if (typeof search["contact"] === "string") out.contact = search["contact"];
    return out;
  },
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
  return <NetworkWorkspace />;
}
