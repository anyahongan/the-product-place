/** Normalize stored LinkedIn values into openable https URLs. */
export function normalizeLinkedInUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("linkedin.com/") || value.startsWith("www.linkedin.com/")) {
    return `https://${value}`;
  }
  if (value.startsWith("/in/")) return `https://www.linkedin.com${value}`;
  if (value.startsWith("in/")) return `https://www.linkedin.com/${value}`;
  return `https://${value}`;
}
