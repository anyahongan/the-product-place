import type { ProductRole } from "@/types/apply";

/**
 * Deterministic title-based product-role classifier.
 * Isolated so it can later be replaced or supplemented.
 */
export function classifyProductRole(title: string): ProductRole | null {
  const t = title.toLowerCase();

  // HR / People Partner titles that list Product orgs they support
  if (/\bpeople\s+partners?\b/.test(t)) {
    return null;
  }

  if (/\bchief of staff\b/.test(t)) {
    return null;
  }

  if (
    /\b(staff|principal|director|vp|vice president|head of|group)\b/.test(t) &&
    /\bproduct\b/.test(t) &&
    !/\bintern(?:ship)?\b/.test(t)
  ) {
    return null;
  }

  if (/\b(senior|sr\.?)\s+(product|pm)\b/.test(t) && !/\bintern(?:ship)?\b/.test(t)) {
    return null;
  }

  // Explicit engineering titles that mention "product" but are not product roles
  if (isEngineeringRole(t) && !isExplicitProductRole(t)) {
    return null;
  }

  if (
    /\btechnical\s+(product|pm)\b/.test(t) ||
    /\btechnical\s+product\s+manager\b/.test(t) ||
    /\btpm\b/.test(t)
  ) {
    return "Technical Product";
  }

  if (/\bgrowth\s+(product|pm)\b/.test(t) || /\bgrowth\s+product\s+manager\b/.test(t)) {
    return "Growth Product";
  }

  if (/\bproduct\s+strateg/.test(t) || (/\bstrategy\s+intern\b/.test(t) && /\bproduct\b/.test(t))) {
    return "Product Strategy";
  }

  if (
    /\bproduct\s+marketing\b/.test(t) ||
    /\bpmm\b/.test(t) ||
    /\bproduct\s+market(er|ing)\b/.test(t)
  ) {
    return "Product Marketing";
  }

  if (
    /\bproduct\s+ops\b/.test(t) ||
    /\bproduct\s+operations\b/.test(t) ||
    /\bproductops\b/.test(t)
  ) {
    return "Product Operations";
  }

  // Product Support is not a Product Place target role
  if (/\bproduct\s+support\b/.test(t)) {
    return null;
  }

  if (
    /\bproduct\s+design/.test(t) ||
    /\bux\s*\/?\s*ui\s+product\b/.test(t) ||
    (/\b(ux|ui)\s+design/.test(t) && /\bproduct\b/.test(t))
  ) {
    return "Product Design";
  }

  if (/\bproduct\s+analy[sz]/.test(t)) {
    return "Product Analysis";
  }

  if (
    /\bproduct\s+manager\b/.test(t) ||
    /\bproduct\s+management\b/.test(t) ||
    /\bassociate\s+product\s+manager\b/.test(t) ||
    isAssociateProductManagerAbbrev(t) ||
    /\bpm\s+intern\b/.test(t) ||
    /\bproduct\s+intern\b/.test(t)
  ) {
    return "Product Management";
  }

  // Ambiguous product-adjacent titles — exclude clear non-product functions
  if (/\bproduct\b/.test(t) && !isEngineeringRole(t) && !isNonProductFunction(t)) {
    return "Other / Unspecified Product";
  }

  return null;
}

/**
 * Bare "APM" only when it plausibly means Associate Product Manager —
 * not Application Performance Monitoring or engineering product areas.
 */
function isAssociateProductManagerAbbrev(t: string): boolean {
  if (!/\bapm\b/.test(t)) return false;
  if (/\b(serverless|monitoring|observability|traces|metrics|apm\s+server)\b/.test(t)) {
    return false;
  }
  if (/\b(software|engineering|engineer|sre|devops)\b/.test(t)) return false;
  return (
    /\b(associate|intern(?:ship)?|new\s*grad(?:uate)?s?|program|rotational|university|campus|early\s*career)\b/.test(
      t,
    ) ||
    /\bproduct\b/.test(t)
  );
}

function isEngineeringRole(t: string): boolean {
  return (
    /\bsoftware\s+engineer\b/.test(t) ||
    /\bfrontend\s+engineer\b/.test(t) ||
    /\bbackend\s+engineer\b/.test(t) ||
    /\bfull[\s-]?stack\b/.test(t) ||
    /\bproduction\s+engineer\b/.test(t) ||
    /\bapplication\s+engineer\b/.test(t) ||
    /\bmachine\s+learning\b/.test(t) ||
    /\bdata\s+engineer\b/.test(t) ||
    /\bsite\s+reliability\b/.test(t) ||
    /\bdevops\b/.test(t) ||
    /\bproduct\s+security\s+engineer\b/.test(t) ||
    /\bproduct\s+engineer\b/.test(t) ||
    /\bproduct\s+development\s+engineer\b/.test(t) ||
    /\bproduct\s+review\s+engineer\b/.test(t) ||
    /\bproduct\s+marketing\s+engineer\b/.test(t)
  );
}

/** Sales, legal, recruiting, etc. that mention "product" but are not Product roles. */
function isNonProductFunction(t: string): boolean {
  return (
    /\baccount\s+executive\b/.test(t) ||
    /\bsales\b/.test(t) ||
    /\bcounsel\b/.test(t) ||
    /\battorney\b/.test(t) ||
    /\brecruiter\b/.test(t) ||
    /\brecruiting\b/.test(t) ||
    /\bpeople\s+partners?\b/.test(t) ||
    /\bhr\b/.test(t) ||
    /\bfinance\b/.test(t) ||
    /\baccounting\b/.test(t) ||
    /\bcommunications?\s+manager\b/.test(t) ||
    /\bincident\s+response\b/.test(t) ||
    /\bproduct\s+support\b/.test(t) ||
    /\bbrand\s+designer\b/.test(t) ||
    /\bmanufacturing\s+engineer\b/.test(t) ||
    /\bsoftware\s+engineering\b/.test(t) ||
    /\bdata\s+scientist\b/.test(t)
  );
}

function isExplicitProductRole(t: string): boolean {
  return (
    /\bproduct\s+manager\b/.test(t) ||
    /\bproduct\s+management\b/.test(t) ||
    /\bproduct\s+design/.test(t) ||
    isAssociateProductManagerAbbrev(t) ||
    /\bpmm\b/.test(t)
  );
}

/** True when the title plausibly belongs in The Product Place feed */
export function isProductRelevantTitle(title: string): boolean {
  return classifyProductRole(title) !== null;
}
