import type { CompetencyGroupId, CompetencyId } from "@/lib/learning/competencies";
import type { Lesson, LessonCheckpoint } from "@/lib/learning/types";

export type CustomLessonSourceKind = "paste" | "file" | "url";

export type CustomLessonMeta = {
  isCustom: true;
  sourceKind: CustomLessonSourceKind;
  sourceLabel: string;
  sourceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomLesson = Lesson & CustomLessonMeta;

const MAX_CHARS = 40_000;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize pasted notes / scraped page text into plain study prose. */
export function normalizeSourceText(raw: string): string {
  let t = raw.trim();
  if (/<\/?[a-z][\s\S]*>/i.test(t)) t = stripHtml(t);
  t = t.replace(/\r\n/g, "\n").replace(/\t/g, " ");
  if (t.length > MAX_CHARS) t = t.slice(0, MAX_CHARS);
  return t.trim();
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 20);
}

function splitByHeadings(text: string): { title: string | null; chunks: string[] } {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let title: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    const body = buf.join("\n").trim();
    if (body) chunks.push(body);
    buf = [];
  };
  for (const line of lines) {
    const h = line.match(/^#{1,3}\s+(.+)$/) || line.match(/^([A-Z][A-Za-z0-9 ,/&-]{3,60})$/);
    if (h && buf.length === 0 && chunks.length === 0 && !title) {
      title = h[1]!.trim();
      continue;
    }
    if (line.match(/^#{1,3}\s+/)) {
      flush();
      buf.push(line.replace(/^#{1,3}\s+/, "").trim());
      continue;
    }
    buf.push(line);
  }
  flush();
  return { title, chunks };
}

function clip(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).trim()}…`;
}

function buildCheckpoint(idea: string): LessonCheckpoint {
  return {
    id: "cp-custom-1",
    prompt: "After reading your imported notes, the best next step is usually:",
    choices: [
      "Memorize every sentence verbatim",
      "Rewrite the core idea in your own words and try one practice drill",
      "Skip Practice and Create entirely",
      "Only bookmark more sources",
    ],
    correctIndex: 1,
    explanation:
      "Imported lessons are study scaffolds — fluency comes from restating and practicing, not hoarding text.",
  };
}

export type GenerateLessonInput = {
  rawText: string;
  titleHint?: string;
  sourceKind: CustomLessonSourceKind;
  sourceLabel: string;
  sourceUrl?: string | null;
  groupId?: CompetencyGroupId;
};

/**
 * Heuristically turns user-provided notes into a Lesson scaffold.
 * Does not invent fake research; keeps prose close to the source chunks.
 */
export function generateLessonFromSource(input: GenerateLessonInput): Omit<CustomLesson, "id" | "slug" | "createdAt" | "updatedAt"> {
  const text = normalizeSourceText(input.rawText);
  if (text.length < 40) {
    throw new Error("Need at least a short paragraph of notes to build a lesson.");
  }

  const { title: headingTitle, chunks } = splitByHeadings(text);
  const paras = chunks.length > 0 ? chunks.flatMap((c) => splitParagraphs(c)) : splitParagraphs(text);
  const pool = paras.length > 0 ? paras : [text];

  const title =
    (input.titleHint?.trim() || headingTitle || pool[0]!.slice(0, 60)).replace(/^#+\s*/, "") ||
    "Imported lesson";

  const idea = clip(pool[0]!, 420);
  const whyPmsCare = clip(pool[1] ?? `PMs care because this topic shows up in recruiting and day-to-day decisions. Source: ${input.sourceLabel}.`, 420);
  const howToThink = clip(
    pool[2] ??
      "Extract the durable decision frame: who is the user, what tradeoff are you making, and what signal would change your mind?",
    420,
  );
  const example = clip(pool[3] ?? pool[0]!, 420);
  const watchOut = clip(
    pool[4] ??
      "Don’t treat the source as gospel or copy long passages into interviews — restate in your voice and cite concepts, not verbatim text.",
    420,
  );
  const tryIt = clip(
    pool[5] ??
      "Write a 4-sentence summary of this lesson, then open Practice and pick one related drill — or Create a teardown/proposal using one idea from the notes.",
    420,
  );

  const depthSections =
    pool.length > 6
      ? pool.slice(6, 10).map((body, i) => ({
          heading: `Deeper note ${i + 1}`,
          body: clip(body, 500),
        }))
      : [];

  const keyTakeaways = pool.slice(0, 3).map((p) => clip(p, 140));

  const groupId: CompetencyGroupId = input.groupId ?? "foundations";
  const competencies: CompetencyId[] =
    groupId === "technical-literacy"
      ? ["technical-fluency", "reading-tech-docs"]
      : groupId === "product-sense"
        ? ["product-critique", "pain-points"]
        : groupId === "execution-metrics"
          ? ["goals", "prioritization"]
          : groupId === "strategy"
            ? ["positioning", "business-tradeoffs"]
            : groupId === "interview"
              ? ["interview-behavioral", "study-planning"]
              : ["study-planning", "product-discovery"];

  const minutes = Math.min(20, Math.max(5, Math.round(text.length / 900)));

  const result: Omit<CustomLesson, "id" | "slug" | "createdAt" | "updatedAt"> = {
    title: clip(title, 80),
    groupId,
    competencies,
    estimatedMinutes: minutes,
    idea,
    whyPmsCare,
    howToThink,
    example,
    watchOut,
    tryIt,
    keyTakeaways,
    visualId: "pm-loop",
    checkpoints: [buildCheckpoint(idea)],
    relatedPracticeIds: [],
    relatedLessonIds: [],
    relatedCreateTemplateIds: ["study-plan"],
    sourceRefs: [
      {
        title: input.sourceLabel,
        author: "Your import",
        topic: "User-provided study notes",
        chapter: null,
      },
    ],
    isCustom: true,
    sourceKind: input.sourceKind,
    sourceLabel: input.sourceLabel,
    sourceUrl: input.sourceUrl ?? null,
  };
  if (depthSections.length > 0) result.depthSections = depthSections;
  if (input.sourceUrl) {
    result.externalResources = [
      { label: input.sourceLabel, url: input.sourceUrl, note: "Original source you imported" },
    ];
  }
  return result;
}

export function finalizeCustomLesson(
  partial: Omit<CustomLesson, "id" | "slug" | "createdAt" | "updatedAt">,
  existingId?: string,
): CustomLesson {
  const now = new Date().toISOString();
  const id =
    existingId ??
    `custom-${slugify(partial.title) || "lesson"}-${Date.now().toString(36)}`;
  return {
    ...partial,
    id,
    slug: slugify(partial.title) || id,
    createdAt: now,
    updatedAt: now,
  };
}
