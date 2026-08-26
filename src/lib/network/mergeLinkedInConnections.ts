import { normalizeLinkedInUrl } from "@/lib/network/linkedinUrl";
import { upsertCompanyByName } from "@/lib/recruiting/companyRepository";
import type { Company } from "@/types/recruiting";
import { toneForCompanyId } from "@/types/recruiting";
import type { ContactType, NetworkContact } from "@/types/network";
import type { LinkedInConnectionRow } from "@/lib/network/parseLinkedInConnectionsCsv";

export type LinkedInImportAction = "create" | "update" | "skip";

export type LinkedInImportPreviewRow = {
  row: LinkedInConnectionRow;
  action: LinkedInImportAction;
  detail: string;
  contactId?: string;
};

export type LinkedInImportPlan = {
  preview: LinkedInImportPreviewRow[];
  nextContacts: NetworkContact[];
  nextCompanies: Company[];
  stats: {
    parsed: number;
    create: number;
    update: number;
    skip: number;
  };
  changedContacts: Array<{ prev?: NetworkContact; next: NetworkContact }>;
};

const FALLBACK_COMPANY_NAME = "Independent";

function linkedinSlug(url: string | null | undefined): string | null {
  const normalized = normalizeLinkedInUrl(url);
  if (!normalized) return null;
  const match = normalized.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function inferContactType(title: string): ContactType {
  const t = title.toLowerCase();
  if (t.includes("campus") && t.includes("recruit")) return "CAMPUS RECRUITER";
  if (t.includes("recruit") || t.includes("talent")) return "RECRUITER";
  if (t.includes("product manager") || t.includes("product management") || /\bpm\b/.test(t)) {
    return "PRODUCT MANAGER";
  }
  if (t.includes("intern")) return "FORMER INTERN";
  return "OTHER";
}

function contactIdForRow(row: LinkedInConnectionRow): string {
  const slug =
    linkedinSlug(row.linkedinUrl) ??
    normalizeName(row.name).replace(/[^a-z0-9]+/g, "-").slice(0, 48);
  return `nc-li-${slug || "connection"}`;
}

function parseConnectedOn(raw: string | null): string | null {
  if (!raw) return null;
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return null;
}

function createContact(row: LinkedInConnectionRow, companyId: string): NetworkContact {
  const id = contactIdForRow(row);
  const connectedDate = parseConnectedOn(row.connectedOn);
  const isRecruiter = /recruit|talent acquisition/i.test(row.title);
  const isCampusRecruiter = isRecruiter && /campus|university|early career/i.test(row.title);

  return {
    id,
    companyId,
    name: row.name,
    title: row.title || "LinkedIn connection",
    linkedinUrl: row.linkedinUrl,
    contactType: inferContactType(row.title),
    isRecruiter,
    isCampusRecruiter,
    schoolRelationship: null,
    connectionDegree: "1st",
    backgroundSimilarities: [],
    relatedApplicationIds: [],
    relationshipStatus: "Not contacted",
    nextAction: "Draft intro",
    lastContacted: null,
    nextFollowUp: null,
    meetingDate: null,
    referralStatus: "NOT DISCUSSED",
    notes: row.email ? `Email from LinkedIn export: ${row.email}` : "",
    timeline: connectedDate
      ? [
          {
            id: `te-${id}-import`,
            date: connectedDate,
            type: "note" as const,
            title: "Connected on LinkedIn",
            ...(row.connectedOn
              ? { detail: `Imported from LinkedIn (${row.connectedOn})` }
              : {}),
          },
        ]
      : [],
    isRecommended: false,
    matchScore: null,
    matchReasons: [],
    tone: toneForCompanyId(companyId),
  };
}

function findMatch(
  row: LinkedInConnectionRow,
  contacts: NetworkContact[],
  companyNameById: Map<string, string>,
): NetworkContact | undefined {
  const rowSlug = linkedinSlug(row.linkedinUrl);
  if (rowSlug) {
    const byUrl = contacts.find((c) => linkedinSlug(c.linkedinUrl) === rowSlug);
    if (byUrl) return byUrl;
  }

  const rowName = normalizeName(row.name);
  const rowCompany = row.company.trim().toLowerCase();
  return contacts.find((c) => {
    if (normalizeName(c.name) !== rowName) return false;
    if (!rowCompany) return true;
    const existingCompany = (companyNameById.get(c.companyId) ?? "").toLowerCase();
    return (
      existingCompany === rowCompany ||
      existingCompany.includes(rowCompany) ||
      rowCompany.includes(existingCompany)
    );
  });
}

function mergeIntoExisting(existing: NetworkContact, row: LinkedInConnectionRow): NetworkContact {
  const updates: string[] = [];
  let next = { ...existing };

  if (row.linkedinUrl && !existing.linkedinUrl) {
    next.linkedinUrl = row.linkedinUrl;
    updates.push("LinkedIn URL");
  }

  if (row.title && (!existing.title || existing.title === "LinkedIn connection")) {
    next.title = row.title;
    updates.push("title");
  }

  if (existing.connectionDegree !== "1st") {
    next.connectionDegree = "1st";
    updates.push("1st-degree");
  }

  if (row.email && !existing.notes.includes(row.email)) {
    next.notes = existing.notes
      ? `${existing.notes}\nEmail from LinkedIn export: ${row.email}`
      : `Email from LinkedIn export: ${row.email}`;
    updates.push("email note");
  }

  if (updates.length === 0) return existing;
  return next;
}

export function planLinkedInConnectionsImport(
  rows: LinkedInConnectionRow[],
  contacts: NetworkContact[],
  companies: Company[],
  options?: { requireLinkedInUrl?: boolean },
): LinkedInImportPlan {
  let nextCompanies = [...companies];
  const nextContacts = [...contacts];
  const preview: LinkedInImportPreviewRow[] = [];
  const changedContacts: Array<{ prev?: NetworkContact; next: NetworkContact }> = [];
  let create = 0;
  let update = 0;
  let skip = 0;

  for (const row of rows) {
    const companyNameById = new Map(nextCompanies.map((c) => [c.id, c.name]));

    if (options?.requireLinkedInUrl && !row.linkedinUrl) {
      skip++;
      preview.push({ row, action: "skip", detail: "No LinkedIn URL" });
      continue;
    }

    const match = findMatch(row, nextContacts, companyNameById);
    if (match) {
      const merged = mergeIntoExisting(match, row);
      if (merged === match) {
        skip++;
        preview.push({
          row,
          action: "skip",
          detail: "Already in Network",
          contactId: match.id,
        });
        continue;
      }

      const idx = nextContacts.findIndex((c) => c.id === match.id);
      nextContacts[idx] = merged;
      update++;
      preview.push({
        row,
        action: "update",
        detail: "Updated existing contact",
        contactId: match.id,
      });
      changedContacts.push({ prev: match, next: merged });
      continue;
    }

    const companyName = row.company.trim() || FALLBACK_COMPANY_NAME;
    const { companies: withCompany, company } = upsertCompanyByName(nextCompanies, companyName);
    nextCompanies = withCompany;

    const created = createContact(row, company.id);
    nextContacts.push(created);
    create++;
    preview.push({ row, action: "create", detail: `New · ${company.name}`, contactId: created.id });
    changedContacts.push({ next: created });
  }

  return {
    preview,
    nextContacts,
    nextCompanies,
    changedContacts,
    stats: {
      parsed: rows.length,
      create,
      update,
      skip,
    },
  };
}
