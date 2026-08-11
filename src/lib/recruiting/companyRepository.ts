import type { Company } from "@/types/recruiting";
import { companyIdFromName, toneForCompanyId } from "@/types/recruiting";
import { networkCompanies } from "@/data/network";
import { readJson, writeJson } from "@/lib/recruiting/storage";

const COMPANIES_KEY = "tpp.recruiting.companies.v1";

export function listCompanies(): Company[] {
  return readJson<Company[]>(COMPANIES_KEY, []);
}

export function saveCompanies(companies: Company[]) {
  writeJson(COMPANIES_KEY, companies);
}

/** Seed demo Network companies once, then merge. */
export function ensureSeedCompanies(existing: Company[]): Company[] {
  const byId = new Map(existing.map((c) => [c.id, c]));
  for (const seed of networkCompanies) {
    if (!byId.has(seed.id)) {
      byId.set(seed.id, {
        id: seed.id,
        name: seed.name,
        tone: seed.tone === "pink" ? "blue" : seed.tone,
      });
    }
  }
  return [...byId.values()];
}

export function upsertCompanyByName(
  companies: Company[],
  name: string,
  preferredTone?: Company["tone"],
): { companies: Company[]; company: Company } {
  const id = companyIdFromName(name);
  const found = companies.find((c) => c.id === id || c.name.toLowerCase() === name.toLowerCase());
  if (found) {
    if (found.name !== name) {
      const updated = { ...found, name };
      return {
        company: updated,
        companies: companies.map((c) => (c.id === found.id ? updated : c)),
      };
    }
    return { companies, company: found };
  }
  const company: Company = {
    id,
    name,
    tone: preferredTone ?? toneForCompanyId(id),
  };
  return { companies: [...companies, company], company };
}
