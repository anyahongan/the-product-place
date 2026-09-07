/** Convert HTML job postings into readable plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function plainJobDescription(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const text = /<\/?[a-z][\s\S]*>/i.test(raw) ? stripHtml(raw) : raw.trim();
  return text.replace(/\r\n/g, "\n").trim();
}

export function plainJobDescriptionPreview(raw: string | null | undefined, max = 480): string {
  const text = plainJobDescription(raw);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}
