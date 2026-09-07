import type {
  ApplicationLifecycleStatus,
  ApplicationMaterialsRequired,
} from "@/lib/apply/types";
import { DEFAULT_MATERIALS_REQUIRED } from "@/lib/apply/types";

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
  preparing: "Preparing",
  "in progress": "Preparing",
  applied: "Applied",
  submitted: "Applied",
  complete: "Applied",
  completed: "Applied",
  waiting: "Waiting",
  pending: "Waiting",
  ghosted: "Waiting",
  "no response": "Waiting",
  "online assessment": "Online Assessment",
  oa: "Online Assessment",
  assessment: "Online Assessment",
  hackerrank: "Online Assessment",
  codility: "Online Assessment",
  "recruiter screen": "Recruiter Screen",
  "phone screen": "Recruiter Screen",
  screen: "Recruiter Screen",
  recruiter: "Recruiter Screen",
  interviewing: "Interviewing",
  interview: "Interviewing",
  onsite: "Interviewing",
  "on-site": "Interviewing",
  "final round": "Final Round",
  final: "Final Round",
  offer: "Offer",
  rejected: "Rejected",
  declined: "Rejected",
  no: "Rejected",
  withdrawn: "Withdrawn",
};

const COLUMN_ALIASES: Record<string, string[]> = {
  company: ["company", "employer", "organization", "org", "firm", "company name"],
  title: ["title", "role", "position", "job title", "job", "role title"],
  status: ["status", "stage", "application status", "pipeline", "phase"],
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

export function mapImportStatus(raw: string | undefined): ApplicationLifecycleStatus {
  if (!raw?.trim()) return "Applied";
  const key = raw.trim().toLowerCase();
  if (STATUS_ALIASES[key]) return STATUS_ALIASES[key];
  for (const [alias, status] of Object.entries(STATUS_ALIASES)) {
    if (key.includes(alias)) return status;
  }
  return "Applied";
}

export function parseFlexibleDate(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
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
  const company = (cells[map.company] ?? "").trim();
  const title = (cells[map.title] ?? "").trim();
  if (!company || !title) return null;

  const statusRaw = map.status >= 0 ? cells[map.status] : undefined;
  const status = mapImportStatus(statusRaw);
  const onlineAssessmentDue =
    map.onlineAssessmentDue >= 0
      ? parseFlexibleDate(cells[map.onlineAssessmentDue])
      : null;

  return {
    company,
    title,
    status:
      onlineAssessmentDue && status === "Applied" && /oa|assessment/i.test(statusRaw ?? "")
        ? "Online Assessment"
        : status,
    dateApplied: parseFlexibleDate(map.dateApplied >= 0 ? cells[map.dateApplied] : undefined),
    postedDate: parseFlexibleDate(map.postedDate >= 0 ? cells[map.postedDate] : undefined),
    deadline: parseFlexibleDate(map.deadline >= 0 ? cells[map.deadline] : undefined),
    applyUrl: map.applyUrl >= 0 ? cells[map.applyUrl]?.trim() || null : null,
    experienceNotes: readNotes(cells, map),
    onlineAssessmentDue,
    materialsRequired: readMaterials(cells, map),
  };
}

export function findHeaderRowIndex(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const map = mapImportColumns(rows[i]!);
    if (map.company >= 0 && map.title >= 0) return i;
  }
  return 0;
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

  const status = mapImportStatus(typeof raw["status"] === "string" ? raw["status"] : undefined);
  const onlineAssessmentDue = parseFlexibleDate(
    typeof raw["onlineAssessmentDue"] === "string" ? raw["onlineAssessmentDue"] : undefined,
  );

  return {
    company,
    title,
    status: onlineAssessmentDue && status === "Applied" ? "Online Assessment" : status,
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
