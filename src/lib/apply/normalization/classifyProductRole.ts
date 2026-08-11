import type { ProductRole } from "@/types/apply";

/**
 * Deterministic title-based product-role classifier.
 * Isolated so it can later be replaced or supplemented.
 */
export function classifyProductRole(title: string): ProductRole | null {
  const t = title.toLowerCase();

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
    /\bapm\b/.test(t) ||
    /\bpm\s+intern\b/.test(t) ||
    /\bproduct\s+intern\b/.test(t)
  ) {
    return "Product Management";
  }

  // Ambiguous product-adjacent titles
  if (/\bproduct\b/.test(t) && !isEngineeringRole(t)) {
    return "Other / Unspecified Product";
  }

  return null;
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
    /\bdevops\b/.test(t)
  );
}

function isExplicitProductRole(t: string): boolean {
  return (
    /\bproduct\s+manager\b/.test(t) ||
    /\bproduct\s+management\b/.test(t) ||
    /\bproduct\s+design/.test(t) ||
    /\bapm\b/.test(t) ||
    /\bpmm\b/.test(t)
  );
}

/** True when the title plausibly belongs in The Product Place feed */
export function isProductRelevantTitle(title: string): boolean {
  return classifyProductRole(title) !== null;
}
