import type {
  ApplicationLifecycleStatus,
  ApplicationMaterialsRequired,
} from "@/lib/apply/types";
import { APPLICATION_STATUSES, DEFAULT_MATERIALS_REQUIRED } from "@/lib/apply/types";
import { buildRoleDedupeKey } from "@/lib/apply/normalization/dedupe";

export type AppliedImportRow = {
  company: string;
  title: string;
  status: ApplicationLifecycleStatus;
  dateApplied: string | null;
  postedDate: string | null;
  deadline: string | null;
  applyUrl: string | null;
  experienceNotes: string | null;
  onlineAssessmentDue: string | null;
  materialsRequired: ApplicationMaterialsRequired | null;
};

export type ParsedImportGrid = {
  headers: string[];
  rows: string[][];
  headerRowIndex: number;
};

export const STATUS_ALIASES: Record<string, ApplicationLifecycleStatus> = {
  saved: "Saved",
  bookmarked: "Saved",
  bookmark: "Saved",
  preparing: "Preparing",
  "in progress": "Preparing",
  "in-progress": "Preparing",
  draft: "Preparing",
  applied: "Applied",
  submitted: "Applied",
  submit: "Applied",
  complete: "Applied",
  completed: "Applied",
  done: "Applied",
  waiting: "Waiting",
  pending: "Waiting",
  ghosted: "Waiting",
  "no response": "Waiting",
  "no reply": "Waiting",
  "in review": "Waiting",
  "under review": "Waiting",
  "online assessment": "Online Assessment",
  oa: "Online Assessment",
  assessment: "Online Assessment",
  hackerrank: "Online Assessment",
  codility: "Online Assessment",
  codesignal: "Online Assessment",
  karat: "Online Assessment",
  "coding assessment": "Online Assessment",
  "technical assessment": "Online Assessment",
  "recruiter screen": "Recruiter Screen",
  "phone screen": "Recruiter Screen",
  "phone interview": "Recruiter Screen",
  screen: "Recruiter Screen",
  recruiter: "Recruiter Screen",
  "hiring manager screen": "Recruiter Screen",
  interviewing: "Interviewing",
  interview: "Interviewing",
  interviews: "Interviewing",
  onsite: "Interviewing",
  "on-site": "Interviewing",
  "on site": "Interviewing",
  technical: "Interviewing",
  "technical interview": "Interviewing",
  "take home": "Interviewing",
  "take-home": "Interviewing",
  "case study": "Interviewing",
  "second round": "Interviewing",
  "third round": "Interviewing",
  "interview complete": "Interviewing",
  loop: "Interviewing",
  "final round": "Final Round",
  "final interview": "Final Round",
  final: "Final Round",
  offer: "Offer",
  "offer received": "Offer",
  accepted: "Offer",
  rejected: "Rejected",
  declined: "Rejected",
  "not selected": "Rejected",
  "no offer": "Rejected",
  denied: "Rejected",
  withdrawn: "Withdrawn",
  withdraw: "Withdrawn",
  closed: "Withdrawn",
};

const COLUMN_ALIASES: Record<string, string[]> = {
  company: ["company", "employer", "organization", "org", "firm", "company name"],
  title: ["title", "role", "position", "job title", "job", "role title"],
  status: ["status", "stage", "application status", "pipeline", "phase", "step", "round"],
  dateApplied: [
    "date applied",
    "applied",
    "applied on",
    "applied date",
    "submitted",
    "submission date",
  ],
  postedDate: [
    "posted",
    "posted date",
    "open date",
    "opening date",
    "date posted",
    "post date",
  ],
  deadline: ["due", "due date", "deadline", "closing date", "close date", "apply by"],
  applyUrl: ["apply url", "application url", "link", "url", "job link", "application link"],
  experienceNotes: [
    "notes",
    "note",
    "comments",
    "comment",
    "next step",
    "next steps",
    "follow up",
    "follow-up",
    "tracking",
    "details",
    "referral",
    "referral status",
    "contact",
    "location",
    "source",
  ],
  onlineAssessmentDue: [
    "oa due",
    "assessment due",
    "online assessment due",
    "oa deadline",
    "assessment deadline",
  ],
  materialsResume: ["resume", "resume required", "cv"],
  materialsCoverLetter: ["cover letter", "coverletter", "cl"],
  materialsTranscript: ["transcript"],
  materialsGpa: ["gpa"],
};

export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function cleanImportCell(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aliasMatches(normalized: string, alias: string): boolean {
  if (normalized === alias) return true;
  if (alias.length < 3) return normalized === alias;
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\b)${escaped}(\\b|$)`).test(normalized);
}

export function mapImportStatus(raw: string | undefined): ApplicationLifecycleStatus | null {
  if (!raw?.trim()) return null;
  const normalized = normalizeHeader(raw);

  for (const status of APPLICATION_STATUSES) {
    if (normalizeHeader(status) === normalized) return status;
  }

  if (STATUS_ALIASES[normalized]) return STATUS_ALIASES[normalized];

  const ranked = Object.entries(STATUS_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, status] of ranked) {
    if (aliasMatches(normalized, alias)) return status;
  }

  return null;
}

export function inferImportStatus(input: {
  statusRaw?: string;
  notes?: string | null;
  onlineAssessmentDue?: string | null;
  extraHints?: string[];
}): ApplicationLifecycleStatus {
  const hints = [
    input.statusRaw,
    input.notes,
    ...(input.extraHints ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const mapped = mapImportStatus(input.statusRaw);
  if (mapped) {
    if (mapped === "Applied" && input.onlineAssessmentDue) return "Online Assessment";
    return mapped;
  }

  if (/offer received|received offer|\boffer\b|accepted offer/.test(hints)) return "Offer";
  if (/reject|declin|not selected|no offer|did not pass|unsuccessful/.test(hints)) {
    return "Rejected";
  }
  if (/withdraw|withdrew|closed out|archived role/.test(hints)) return "Withdrawn";
  if (/final round|final interview|onsite final|superday/.test(hints)) return "Final Round";
  if (/recruiter screen|phone screen|hm screen|hiring manager screen|intro call/.test(hints)) {
    return "Recruiter Screen";
  }
  if (
    /interview|onsite|on-site|technical round|panel|loop|take-?home|case study|second round|third round/.test(
      hints,
    )
  ) {
    return "Interviewing";
  }
  if (
    /online assessment|oa due|hackerrank|codility|codesignal|karat|assessment due|coding test/.test(
      hints,
    ) ||
    input.onlineAssessmentDue
  ) {
    return "Online Assessment";
  }
  if (/waiting|pending|ghost|no response|follow up|follow-up|in review|under review/.test(hints)) {
    return "Waiting";
  }
  if (/prepar|draft|working on/.test(hints)) return "Preparing";
  if (/saved|bookmark/.test(hints)) return "Saved";
  if (/applied|submitted/.test(hints)) return "Applied";

  return "Applied";
}

export function parseFlexibleDate(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = cleanImportCell(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);

  const monthDayYear = t.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s+(\d{2,4}))?$/,
  );
  if (monthDayYear) {
    const parsed = Date.parse(
      `${monthDayYear[1]} ${monthDayYear[2]}, ${monthDayYear[3] ?? new Date().getFullYear()}`,
    );
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  }

  const us = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (us) {
    const year = us[3]!.length === 2 ? `20${us[3]}` : us[3]!;
    return `${year}-${us[1]!.padStart(2, "0")}-${us[2]!.padStart(2, "0")}`;
  }

  const parsed = Date.parse(t);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return null;
}

function scoreHeader(header: string, aliases: string[]): number {
  const norm = normalizeHeader(header);
  if (!norm) return -1;
  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i]!;
    if (norm === alias) return 100 - i;
    if (norm.includes(alias) || alias.includes(norm)) return 60 - i;
  }
  return -1;
}

export type ImportColumnMap = {
  company: number;
  title: number;
  status: number;
  dateApplied: number;
  postedDate: number;
  deadline: number;
  applyUrl: number;
  experienceNotes: number;
  onlineAssessmentDue: number;
  materialsResume: number;
  materialsCoverLetter: number;
  materialsTranscript: number;
  materialsGpa: number;
  unmapped: { header: string; index: number }[];
};

export function mapImportColumns(headers: string[]): ImportColumnMap {
  const pick = (key: keyof typeof COLUMN_ALIASES): number => {
    let bestIdx = -1;
    let bestScore = -1;
    headers.forEach((header, index) => {
      const score = scoreHeader(header, COLUMN_ALIASES[key]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = index;
      }
    });
    return bestScore >= 0 ? bestIdx : -1;
  };

  const mapped = new Set<number>();
  const assign = (key: keyof typeof COLUMN_ALIASES): number => {
    const idx = pick(key);
    if (idx >= 0) mapped.add(idx);
    return idx;
  };

  const columnMap: ImportColumnMap = {
    company: assign("company"),
    title: assign("title"),
    status: assign("status"),
    dateApplied: assign("dateApplied"),
    postedDate: assign("postedDate"),
    deadline: assign("deadline"),
    applyUrl: assign("applyUrl"),
    experienceNotes: assign("experienceNotes"),
    onlineAssessmentDue: assign("onlineAssessmentDue"),
    materialsResume: assign("materialsResume"),
    materialsCoverLetter: assign("materialsCoverLetter"),
    materialsTranscript: assign("materialsTranscript"),
    materialsGpa: assign("materialsGpa"),
    unmapped: [],
  };

  headers.forEach((header, index) => {
    if (!mapped.has(index) && header.trim()) {
      columnMap.unmapped.push({ header: header.trim(), index });
    }
  });

  return columnMap;
}

function truthyCell(raw: string | undefined): boolean {
  if (!raw?.trim()) return false;
  const t = raw.trim().toLowerCase();
  return ["yes", "y", "true", "required", "x", "✓", "1"].includes(t);
}

function readMaterials(
  cells: string[],
  map: ImportColumnMap,
): ApplicationMaterialsRequired | null {
  const hasAny =
    map.materialsResume >= 0 ||
    map.materialsCoverLetter >= 0 ||
    map.materialsTranscript >= 0 ||
    map.materialsGpa >= 0;
  if (!hasAny) return null;
  return {
    resume:
      map.materialsResume >= 0
        ? truthyCell(cells[map.materialsResume])
        : DEFAULT_MATERIALS_REQUIRED.resume,
    coverLetter:
      map.materialsCoverLetter >= 0
        ? truthyCell(cells[map.materialsCoverLetter])
        : DEFAULT_MATERIALS_REQUIRED.coverLetter,
    transcript:
      map.materialsTranscript >= 0
        ? truthyCell(cells[map.materialsTranscript])
        : DEFAULT_MATERIALS_REQUIRED.transcript,
    gpa:
      map.materialsGpa >= 0
        ? truthyCell(cells[map.materialsGpa])
        : DEFAULT_MATERIALS_REQUIRED.gpa,
  };
}

function readNotes(cells: string[], map: ImportColumnMap): string | null {
  const parts: string[] = [];
  if (map.experienceNotes >= 0) {
    const direct = cells[map.experienceNotes]?.trim();
    if (direct) parts.push(direct);
  }
  for (const { header, index } of map.unmapped) {
    const value = cells[index]?.trim();
    if (value) parts.push(`${header}: ${value}`);
  }
  return parts.length ? parts.join("\n") : null;
}

export function rowFromCells(cells: string[], map: ImportColumnMap): AppliedImportRow | null {
  const cleaned = cells.map((cell) => cleanImportCell(cell));
  const company = cleaned[map.company] ?? "";
  const title = cleaned[map.title] ?? "";
  if (!company || !title) return null;
  if (/^company|employer|organization$/i.test(company) && /^title|role|position$/i.test(title)) {
    return null;
  }

  const statusRaw = map.status >= 0 ? cleaned[map.status] : undefined;
  const onlineAssessmentDue =
    map.onlineAssessmentDue >= 0 ? parseFlexibleDate(cleaned[map.onlineAssessmentDue]) : null;
  const experienceNotes = readNotes(cleaned, map);
  const extraHints = map.unmapped.map(({ header, index }) => `${header} ${cleaned[index] ?? ""}`);

  const status = inferImportStatus({
    statusRaw,
    notes: experienceNotes,
    onlineAssessmentDue,
    extraHints,
  });

  return {
    company,
    title,
    status,
    dateApplied: parseFlexibleDate(map.dateApplied >= 0 ? cleaned[map.dateApplied] : undefined),
    postedDate: parseFlexibleDate(map.postedDate >= 0 ? cleaned[map.postedDate] : undefined),
    deadline: parseFlexibleDate(map.deadline >= 0 ? cleaned[map.deadline] : undefined),
    applyUrl: map.applyUrl >= 0 ? cleaned[map.applyUrl]?.trim() || null : null,
    experienceNotes,
    onlineAssessmentDue,
    materialsRequired: readMaterials(cleaned, map),
  };
}

export function findHeaderRowIndex(rows: string[][]): number {
  let bestIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const map = mapImportColumns(rows[i]!.map(cleanImportCell));
    let score = 0;
    if (map.company >= 0) score += 3;
    if (map.title >= 0) score += 3;
    if (map.status >= 0) score += 2;
    if (map.dateApplied >= 0) score += 1;
    if (map.deadline >= 0) score += 1;
    if (map.experienceNotes >= 0) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
    if (map.company >= 0 && map.title >= 0) return i;
  }

  return bestScore >= 4 ? bestIdx : 0;
}

export function normalizeRawImportRow(raw: Record<string, unknown>): AppliedImportRow | null {
  const company = String(raw["company"] ?? raw["employer"] ?? "").trim();
  const title = String(raw["title"] ?? raw["role"] ?? raw["position"] ?? "").trim();
  if (!company || !title) return null;

  const notesParts: string[] = [];
  const pushNote = (label: string, value: unknown) => {
    const text = String(value ?? "").trim();
    if (text) notesParts.push(`${label}: ${text}`);
  };

  for (const [key, value] of Object.entries(raw)) {
    if (
      [
        "company",
        "employer",
        "title",
        "role",
        "position",
        "status",
        "dateApplied",
        "postedDate",
        "deadline",
        "applyUrl",
        "experienceNotes",
        "onlineAssessmentDue",
        "materialsRequired",
      ].includes(key)
    ) {
      continue;
    }
    pushNote(key.replace(/([A-Z])/g, " $1").trim(), value);
  }

  const explicitNotes = String(raw["experienceNotes"] ?? raw["notes"] ?? "").trim();
  if (explicitNotes) notesParts.unshift(explicitNotes);

  const materialsRaw = raw["materialsRequired"];
  let materialsRequired: ApplicationMaterialsRequired | null = null;
  if (materialsRaw && typeof materialsRaw === "object") {
    const m = materialsRaw as Record<string, unknown>;
    materialsRequired = {
      resume: Boolean(m["resume"]),
      coverLetter: Boolean(m["coverLetter"]),
      transcript: Boolean(m["transcript"]),
      gpa: Boolean(m["gpa"]),
    };
  }

  const status = inferImportStatus({
    statusRaw: typeof raw["status"] === "string" ? raw["status"] : undefined,
    notes: notesParts.length ? notesParts.join("\n") : null,
    onlineAssessmentDue: parseFlexibleDate(
      typeof raw["onlineAssessmentDue"] === "string" ? raw["onlineAssessmentDue"] : undefined,
    ),
  });
  const onlineAssessmentDue = parseFlexibleDate(
    typeof raw["onlineAssessmentDue"] === "string" ? raw["onlineAssessmentDue"] : undefined,
  );

  return {
    company,
    title,
    status,
    dateApplied: parseFlexibleDate(
      typeof raw["dateApplied"] === "string" ? raw["dateApplied"] : undefined,
    ),
    postedDate: parseFlexibleDate(
      typeof raw["postedDate"] === "string" ? raw["postedDate"] : undefined,
    ),
    deadline: parseFlexibleDate(typeof raw["deadline"] === "string" ? raw["deadline"] : undefined),
    applyUrl: String(raw["applyUrl"] ?? raw["url"] ?? "").trim() || null,
    experienceNotes: notesParts.length ? notesParts.join("\n") : null,
    onlineAssessmentDue,
    materialsRequired,
  };
}

export function applyImportRowToRecord(
  base: {
    experienceNotes: string;
    materialsRequired: ApplicationMaterialsRequired;
    onlineAssessment: { dueDate: string | null; completed: boolean; completedAt: string | null };
    currentStatus: ApplicationLifecycleStatus;
  },
  row: AppliedImportRow,
): {
  experienceNotes: string;
  materialsRequired: ApplicationMaterialsRequired;
  onlineAssessment: { dueDate: string | null; completed: boolean; completedAt: string | null };
  currentStatus: ApplicationLifecycleStatus;
} {
  const mergedNotes = [base.experienceNotes.trim(), row.experienceNotes?.trim()]
    .filter(Boolean)
    .join("\n\n");

  const materialsRequired = row.materialsRequired
    ? { ...base.materialsRequired, ...row.materialsRequired }
    : base.materialsRequired;

  let onlineAssessment = base.onlineAssessment;
  if (row.onlineAssessmentDue) {
    onlineAssessment = {
      ...base.onlineAssessment,
      dueDate: row.onlineAssessmentDue,
      completed: false,
      completedAt: null,
    };
  }

  return {
    experienceNotes: mergedNotes,
    materialsRequired,
    onlineAssessment,
    currentStatus: base.currentStatus,
  };
}

export function importRowDiffersFromApp(
  existing: {
    currentStatus: ApplicationLifecycleStatus;
    dateApplied: string | null;
    applyUrl: string | null;
    postedDate?: string | null;
    deadline?: string | null;
    experienceNotes: string;
    materialsRequired: ApplicationMaterialsRequired;
    onlineAssessment: { dueDate: string | null };
  },
  row: AppliedImportRow,
): boolean {
  if (existing.currentStatus !== row.status) return true;
  if (row.dateApplied && row.dateApplied !== existing.dateApplied) return true;
  if (row.applyUrl && row.applyUrl !== existing.applyUrl) return true;
  if (row.postedDate && row.postedDate !== (existing.postedDate ?? null)) return true;
  if (row.deadline && row.deadline !== (existing.deadline ?? null)) return true;
  if (row.experienceNotes?.trim() && row.experienceNotes.trim() !== existing.experienceNotes.trim()) {
    return true;
  }
  if (row.onlineAssessmentDue && row.onlineAssessmentDue !== existing.onlineAssessment.dueDate) {
    return true;
  }
  if (row.materialsRequired) {
    const m = row.materialsRequired;
    if (
      m.resume !== existing.materialsRequired.resume ||
      m.coverLetter !== existing.materialsRequired.coverLetter ||
      m.transcript !== existing.materialsRequired.transcript ||
      m.gpa !== existing.materialsRequired.gpa
    ) {
      return true;
    }
  }
  return false;
}

function mergeImportRows(a: AppliedImportRow, b: AppliedImportRow): AppliedImportRow {
  const pick = <T>(left: T | null | undefined, right: T | null | undefined): T | null =>
    left ?? right ?? null;

  const notes = [a.experienceNotes, b.experienceNotes]
    .filter(Boolean)
    .join("\n")
    .trim();

  const status =
    a.status !== "Applied" ? a.status : b.status !== "Applied" ? b.status : a.status;

  return {
    company: a.company || b.company,
    title: a.title || b.title,
    status,
    dateApplied: pick(a.dateApplied, b.dateApplied),
    postedDate: pick(a.postedDate, b.postedDate),
    deadline: pick(a.deadline, b.deadline),
    applyUrl: pick(a.applyUrl, b.applyUrl),
    experienceNotes: notes || null,
    onlineAssessmentDue: pick(a.onlineAssessmentDue, b.onlineAssessmentDue),
    materialsRequired: a.materialsRequired ?? b.materialsRequired,
  };
}

export function postProcessImportRows(rows: AppliedImportRow[]): AppliedImportRow[] {
  const deduped = new Map<string, AppliedImportRow>();

  for (const row of rows) {
    const company = cleanImportCell(row.company);
    const title = cleanImportCell(row.title);
    if (!company || !title) continue;
    if (company.length < 2 || title.length < 2) continue;

    const normalized: AppliedImportRow = {
      ...row,
      company,
      title,
      status: inferImportStatus({
        statusRaw: row.status,
        notes: row.experienceNotes,
        onlineAssessmentDue: row.onlineAssessmentDue,
      }),
    };

    const key = buildRoleDedupeKey(normalized.company, normalized.title);
    const existing = deduped.get(key);
    deduped.set(key, existing ? mergeImportRows(existing, normalized) : normalized);
  }

  return [...deduped.values()];
}
