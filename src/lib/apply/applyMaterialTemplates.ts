const STORAGE_KEY = "tpp.apply.materialTemplates.v1";

export type ApplyMaterialTemplates = {
  resumeTemplate: string | null;
  coverLetterTemplate: string | null;
  resumeFileName: string | null;
  coverLetterFileName: string | null;
};

const EMPTY: ApplyMaterialTemplates = {
  resumeTemplate: null,
  coverLetterTemplate: null,
  resumeFileName: null,
  coverLetterFileName: null,
};

function storageKey(userId: string | null): string {
  return userId ? `${STORAGE_KEY}.${userId}` : STORAGE_KEY;
}

export function loadApplyMaterialTemplates(userId: string | null): ApplyMaterialTemplates {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ApplyMaterialTemplates>;
    return {
      resumeTemplate: parsed.resumeTemplate ?? null,
      coverLetterTemplate: parsed.coverLetterTemplate ?? null,
      resumeFileName: parsed.resumeFileName ?? null,
      coverLetterFileName: parsed.coverLetterFileName ?? null,
    };
  } catch {
    return EMPTY;
  }
}

export function saveApplyMaterialTemplates(
  userId: string | null,
  templates: ApplyMaterialTemplates,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(templates));
}
