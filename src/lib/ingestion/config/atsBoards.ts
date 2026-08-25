/**
 * Verified ATS board configuration.
 * Only boards that returned HTTP 200 with jobs during live verification (2026-08-25).
 * Do not invent board tokens — verify before adding.
 */

export type AtsKind = "greenhouse" | "lever" | "ashby";

export type AtsBoardConfig = {
  id: string;
  companyName: string;
  ats: AtsKind;
  /** Greenhouse board token / Lever site / Ashby board name */
  boardId: string;
  enabled: boolean;
  /** Optional notes for maintainers */
  note?: string;
};

/**
 * Starter set biased toward Product / early-career hiring coverage.
 * Mix of larger tech, growth startups, fintech, consumer, SaaS, AI, developer tools.
 */
export const ATS_BOARD_CONFIG: AtsBoardConfig[] = [
  // Greenhouse
  { id: "gh-stripe", companyName: "Stripe", ats: "greenhouse", boardId: "stripe", enabled: true },
  { id: "gh-figma", companyName: "Figma", ats: "greenhouse", boardId: "figma", enabled: true },
  { id: "gh-discord", companyName: "Discord", ats: "greenhouse", boardId: "discord", enabled: true },
  { id: "gh-robinhood", companyName: "Robinhood", ats: "greenhouse", boardId: "robinhood", enabled: true },
  { id: "gh-coinbase", companyName: "Coinbase", ats: "greenhouse", boardId: "coinbase", enabled: true },
  { id: "gh-databricks", companyName: "Databricks", ats: "greenhouse", boardId: "databricks", enabled: true },
  { id: "gh-brex", companyName: "Brex", ats: "greenhouse", boardId: "brex", enabled: true },
  { id: "gh-asana", companyName: "Asana", ats: "greenhouse", boardId: "asana", enabled: true },
  { id: "gh-airtable", companyName: "Airtable", ats: "greenhouse", boardId: "airtable", enabled: true },
  { id: "gh-duolingo", companyName: "Duolingo", ats: "greenhouse", boardId: "duolingo", enabled: true },
  { id: "gh-mongodb", companyName: "MongoDB", ats: "greenhouse", boardId: "mongodb", enabled: true },
  { id: "gh-cloudflare", companyName: "Cloudflare", ats: "greenhouse", boardId: "cloudflare", enabled: true },
  { id: "gh-datadog", companyName: "Datadog", ats: "greenhouse", boardId: "datadog", enabled: true },
  { id: "gh-gitlab", companyName: "GitLab", ats: "greenhouse", boardId: "gitlab", enabled: true },
  { id: "gh-mixpanel", companyName: "Mixpanel", ats: "greenhouse", boardId: "mixpanel", enabled: true },
  { id: "gh-gusto", companyName: "Gusto", ats: "greenhouse", boardId: "gusto", enabled: true },
  { id: "gh-toast", companyName: "Toast", ats: "greenhouse", boardId: "toast", enabled: true },
  { id: "gh-instacart", companyName: "Instacart", ats: "greenhouse", boardId: "instacart", enabled: true },
  { id: "gh-anthropic", companyName: "Anthropic", ats: "greenhouse", boardId: "anthropic", enabled: true },
  { id: "gh-scaleai", companyName: "Scale AI", ats: "greenhouse", boardId: "scaleai", enabled: true },
  { id: "gh-airbnb", companyName: "Airbnb", ats: "greenhouse", boardId: "airbnb", enabled: true },
  { id: "gh-dropbox", companyName: "Dropbox", ats: "greenhouse", boardId: "dropbox", enabled: true },
  { id: "gh-twilio", companyName: "Twilio", ats: "greenhouse", boardId: "twilio", enabled: true },
  { id: "gh-block", companyName: "Block", ats: "greenhouse", boardId: "block", enabled: true },
  { id: "gh-lyft", companyName: "Lyft", ats: "greenhouse", boardId: "lyft", enabled: true },
  { id: "gh-vercel", companyName: "Vercel", ats: "greenhouse", boardId: "vercel", enabled: true },

  // Early-career Product boards (verified live: intern / new-grad / APM postings)
  { id: "gh-sezzle", companyName: "Sezzle", ats: "greenhouse", boardId: "sezzle", enabled: true, note: "Product Design / PMM / Product internships" },
  { id: "gh-blockchain", companyName: "Blockchain.com", ats: "greenhouse", boardId: "blockchain", enabled: true, note: "UX/Product Design Intern" },
  { id: "gh-ixllearning", companyName: "IXL Learning", ats: "greenhouse", boardId: "ixllearning", enabled: true, note: "APM new-grad + Associate PM roles" },
  { id: "gh-appian", companyName: "Appian", ats: "greenhouse", boardId: "appian", enabled: true, note: "Product Manager Intern + descriptions" },

  // Lever (verified)
  { id: "lv-spotify", companyName: "Spotify", ats: "lever", boardId: "spotify", enabled: true },
  { id: "lv-palantir", companyName: "Palantir", ats: "lever", boardId: "palantir", enabled: true },

  // Ashby (verified)
  { id: "as-openai", companyName: "OpenAI", ats: "ashby", boardId: "openai", enabled: true },
  { id: "as-ramp", companyName: "Ramp", ats: "ashby", boardId: "ramp", enabled: true },
  { id: "as-notion", companyName: "Notion", ats: "ashby", boardId: "notion", enabled: true },
  { id: "as-linear", companyName: "Linear", ats: "ashby", boardId: "linear", enabled: true },
  { id: "as-miro", companyName: "Miro", ats: "ashby", boardId: "miro", enabled: true },
  { id: "as-uncountable", companyName: "Uncountable", ats: "ashby", boardId: "uncountable", enabled: true, note: "Product Manager (New Grad)" },
];

export function enabledAtsBoards(): AtsBoardConfig[] {
  return ATS_BOARD_CONFIG.filter((b) => b.enabled);
}
