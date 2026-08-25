import { createServerFn } from "@tanstack/react-start";

const MAX_BYTES = 500_000;

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export const fetchLessonSourceUrlFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object" || !("url" in data)) {
      throw new Error("Enter a valid http(s) URL");
    }
    const url = String((data as { url: unknown }).url).trim();
    if (!/^https?:\/\//i.test(url)) throw new Error("Enter a valid http(s) URL");
    return { url };
  })
  .handler(async ({ data }): Promise<{ title: string; text: string; url: string }> => {
    const res = await fetch(data.url, {
      headers: {
        Accept: "text/html,text/plain,application/xhtml+xml",
        "User-Agent": "TheProductPlaceLessonImporter/1.0",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`Could not fetch URL (${res.status})`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new Error("Page is too large to import");
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const ctype = res.headers.get("content-type") ?? "";
    const text = ctype.includes("html") || raw.includes("<html") ? htmlToText(raw) : raw.trim();
    if (text.length < 40) throw new Error("Page had almost no readable text");
    const titleMatch = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || new URL(data.url).hostname;
    return { title, text: text.slice(0, 40_000), url: data.url };
  });
