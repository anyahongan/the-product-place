import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  resumeExperienceKey,
  type ParsedResumeExperience,
} from "@/lib/profile/parseResumeExperiences";
import type {
  ExperienceBullet,
  ExperienceMetric,
  ExperienceRecord,
  ExperienceSource,
  ExperienceType,
} from "@/types/profile";

function client(): SupabaseClient {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  return sb;
}

export type ExperienceInput = {
  experienceType: ExperienceType;
  organization: string;
  title: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  summary?: string | null;
  skills?: string[];
  projectUrl?: string | null;
  githubUrl?: string | null;
  caseStudyUrl?: string | null;
  productType?: string | null;
  projectStatus?: string | null;
  source?: ExperienceSource;
  resumeKey?: string | null;
};

function mapExperience(
  row: Record<string, unknown>,
  bullets: ExperienceBullet[],
  metrics: ExperienceMetric[],
): ExperienceRecord {
  return {
    id: row["id"] as string,
    experienceType: row["experience_type"] as ExperienceType,
    organization: (row["organization"] as string) || "",
    title: (row["title"] as string) || "",
    location: (row["location"] as string) || null,
    startDate: (row["start_date"] as string) || null,
    endDate: (row["end_date"] as string) || null,
    isCurrent: Boolean(row["is_current"]),
    summary: (row["summary"] as string) || null,
    skills: Array.isArray(row["skills"]) ? (row["skills"] as string[]) : [],
    projectUrl: (row["project_url"] as string) || null,
    githubUrl: (row["github_url"] as string) || null,
    caseStudyUrl: (row["case_study_url"] as string) || null,
    productType: (row["product_type"] as string) || null,
    projectStatus: (row["project_status"] as string) || null,
    source: (row["source"] as ExperienceSource) || "manual",
    resumeKey: (row["resume_key"] as string) || null,
    sortOrder: (row["sort_order"] as number) || 0,
    bullets,
    metrics,
  };
}

function toRowFields(userId: string, input: ExperienceInput, sortOrder?: number) {
  return {
    user_id: userId,
    experience_type: input.experienceType,
    organization: input.organization.trim(),
    title: input.title.trim(),
    location: input.location?.trim() || null,
    start_date: input.startDate || null,
    end_date: input.isCurrent ? null : input.endDate || null,
    is_current: Boolean(input.isCurrent),
    summary: input.summary?.trim() || null,
    skills: (input.skills ?? []).map((s) => s.trim()).filter(Boolean),
    project_url: input.projectUrl?.trim() || null,
    github_url: input.githubUrl?.trim() || null,
    case_study_url: input.caseStudyUrl?.trim() || null,
    product_type: input.productType?.trim() || null,
    project_status: input.projectStatus?.trim() || null,
    ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
    updated_at: new Date().toISOString(),
  };
}

function toCreateRow(userId: string, input: ExperienceInput, sortOrder?: number) {
  const source = input.source ?? "manual";
  return {
    ...toRowFields(userId, input, sortOrder),
    source,
    resume_key:
      source === "resume"
        ? input.resumeKey?.trim() ||
          resumeExperienceKey(input.organization, input.title)
        : null,
  };
}

function toUpdateRow(userId: string, input: ExperienceInput) {
  const row = toRowFields(userId, input) as Record<string, unknown>;
  if (input.source !== undefined) {
    row["source"] = input.source;
    row["resume_key"] =
      input.source === "resume"
        ? input.resumeKey?.trim() ||
          resumeExperienceKey(input.organization, input.title)
        : null;
  }
  return row;
}

export async function listExperiences(userId: string): Promise<ExperienceRecord[]> {
  const sb = client();
  const { data: exps, error } = await sb
    .from("experiences")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const ids = (exps ?? []).map((e) => e.id as string);
  if (ids.length === 0) return [];

  const [bulletsRes, metricsRes] = await Promise.all([
    sb
      .from("experience_bullets")
      .select("*")
      .eq("user_id", userId)
      .in("experience_id", ids)
      .order("sort_order", { ascending: true }),
    sb
      .from("experience_metrics")
      .select("*")
      .eq("user_id", userId)
      .in("experience_id", ids)
      .order("sort_order", { ascending: true }),
  ]);
  if (bulletsRes.error) throw bulletsRes.error;
  if (metricsRes.error) throw metricsRes.error;

  const bulletsByExp = new Map<string, ExperienceBullet[]>();
  for (const b of bulletsRes.data ?? []) {
    const list = bulletsByExp.get(b.experience_id as string) ?? [];
    list.push({
      id: b.id as string,
      content: b.content as string,
      sortOrder: b.sort_order as number,
    });
    bulletsByExp.set(b.experience_id as string, list);
  }
  const metricsByExp = new Map<string, ExperienceMetric[]>();
  for (const m of metricsRes.data ?? []) {
    const list = metricsByExp.get(m.experience_id as string) ?? [];
    list.push({
      id: m.id as string,
      label: m.label as string,
      value: m.value as string,
      context: (m.context as string) || null,
      sortOrder: m.sort_order as number,
    });
    metricsByExp.set(m.experience_id as string, list);
  }

  return (exps ?? []).map((e) =>
    mapExperience(
      e,
      bulletsByExp.get(e.id as string) ?? [],
      metricsByExp.get(e.id as string) ?? [],
    ),
  );
}

export async function createExperience(
  userId: string,
  input: ExperienceInput,
): Promise<ExperienceRecord> {
  const sb = client();
  const { data: last } = await sb
    .from("experiences")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = ((last?.[0]?.sort_order as number) ?? -1) + 1;
  const { data, error } = await sb
    .from("experiences")
    .insert(toCreateRow(userId, input, nextOrder))
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create experience.");
  return mapExperience(data, [], []);
}

export async function updateExperience(
  userId: string,
  id: string,
  input: ExperienceInput,
): Promise<ExperienceRecord> {
  const { data, error } = await client()
    .from("experiences")
    .update(toUpdateRow(userId, input))
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update experience.");
  const all = await listExperiences(userId);
  return all.find((e) => e.id === id) ?? mapExperience(data, [], []);
}

export async function deleteExperience(userId: string, id: string): Promise<void> {
  const { error } = await client()
    .from("experiences")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function moveExperience(
  userId: string,
  id: string,
  direction: "up" | "down",
): Promise<ExperienceRecord[]> {
  const list = await listExperiences(userId);
  const idx = list.findIndex((e) => e.id === id);
  if (idx < 0) return list;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) return list;

  const a = list[idx]!;
  const b = list[swapWith]!;
  const sb = client();
  const { error: e1 } = await sb
    .from("experiences")
    .update({ sort_order: b.sortOrder, updated_at: new Date().toISOString() })
    .eq("id", a.id)
    .eq("user_id", userId);
  if (e1) throw e1;
  const { error: e2 } = await sb
    .from("experiences")
    .update({ sort_order: a.sortOrder, updated_at: new Date().toISOString() })
    .eq("id", b.id)
    .eq("user_id", userId);
  if (e2) throw e2;
  return listExperiences(userId);
}

export async function createExperienceBullet(
  userId: string,
  experienceId: string,
  content: string,
): Promise<ExperienceBullet> {
  const sb = client();
  const { data: last } = await sb
    .from("experience_bullets")
    .select("sort_order")
    .eq("experience_id", experienceId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = ((last?.[0]?.sort_order as number) ?? -1) + 1;
  const { data, error } = await sb
    .from("experience_bullets")
    .insert({
      user_id: userId,
      experience_id: experienceId,
      content: content.trim(),
      sort_order: nextOrder,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to add bullet.");
  return {
    id: data.id as string,
    content: data.content as string,
    sortOrder: data.sort_order as number,
  };
}

export async function updateExperienceBullet(
  userId: string,
  id: string,
  content: string,
): Promise<ExperienceBullet> {
  const { data, error } = await client()
    .from("experience_bullets")
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update bullet.");
  return {
    id: data.id as string,
    content: data.content as string,
    sortOrder: data.sort_order as number,
  };
}

export async function deleteExperienceBullet(userId: string, id: string): Promise<void> {
  const { error } = await client()
    .from("experience_bullets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function reorderExperienceBullets(
  userId: string,
  experienceId: string,
  orderedIds: string[],
): Promise<ExperienceBullet[]> {
  const sb = client();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await sb
      .from("experience_bullets")
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[i]!)
      .eq("experience_id", experienceId)
      .eq("user_id", userId);
    if (error) throw error;
  }
  const { data, error } = await sb
    .from("experience_bullets")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.id as string,
    content: b.content as string,
    sortOrder: b.sort_order as number,
  }));
}

export async function moveExperienceBullet(
  userId: string,
  experienceId: string,
  bulletId: string,
  direction: "up" | "down",
): Promise<ExperienceBullet[]> {
  const sb = client();
  const { data, error } = await sb
    .from("experience_bullets")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const list = data ?? [];
  const idx = list.findIndex((b) => b.id === bulletId);
  if (idx < 0) {
    return list.map((b) => ({
      id: b.id as string,
      content: b.content as string,
      sortOrder: b.sort_order as number,
    }));
  }
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) {
    return list.map((b) => ({
      id: b.id as string,
      content: b.content as string,
      sortOrder: b.sort_order as number,
    }));
  }
  const ids = list.map((b) => b.id as string);
  const tmp = ids[idx]!;
  ids[idx] = ids[swapWith]!;
  ids[swapWith] = tmp;
  return reorderExperienceBullets(userId, experienceId, ids);
}

export async function upsertExperienceMetric(
  userId: string,
  experienceId: string,
  input: { id?: string; label: string; value: string; context?: string | null },
): Promise<ExperienceMetric> {
  const sb = client();
  if (input.id) {
    const { data, error } = await sb
      .from("experience_metrics")
      .update({
        label: input.label.trim(),
        value: input.value.trim(),
        context: input.context?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error || !data) throw error ?? new Error("Failed to update metric.");
    return {
      id: data.id as string,
      label: data.label as string,
      value: data.value as string,
      context: (data.context as string) || null,
      sortOrder: data.sort_order as number,
    };
  }
  const { data: last } = await sb
    .from("experience_metrics")
    .select("sort_order")
    .eq("experience_id", experienceId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = ((last?.[0]?.sort_order as number) ?? -1) + 1;
  const { data, error } = await sb
    .from("experience_metrics")
    .insert({
      user_id: userId,
      experience_id: experienceId,
      label: input.label.trim(),
      value: input.value.trim(),
      context: input.context?.trim() || null,
      sort_order: nextOrder,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to add metric.");
  return {
    id: data.id as string,
    label: data.label as string,
    value: data.value as string,
    context: (data.context as string) || null,
    sortOrder: data.sort_order as number,
  };
}

export async function deleteExperienceMetric(userId: string, id: string): Promise<void> {
  const { error } = await client()
    .from("experience_metrics")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Replace resume-sourced rows with freshly parsed experiences; keep manual entries. */
export async function syncResumeExperiences(
  userId: string,
  parsed: ParsedResumeExperience[],
): Promise<ExperienceRecord[]> {
  const sb = client();

  const { error: deleteError } = await sb
    .from("experiences")
    .delete()
    .eq("user_id", userId)
    .eq("source", "resume");
  if (deleteError) throw deleteError;

  const { data: manualRows, error: manualError } = await sb
    .from("experiences")
    .select("id, sort_order")
    .eq("user_id", userId)
    .eq("source", "manual")
    .order("sort_order", { ascending: true });
  if (manualError) throw manualError;

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i]!;
    const input: ExperienceInput = {
      experienceType: item.experienceType,
      organization: item.organization,
      title: item.title,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      isCurrent: item.isCurrent,
      summary: item.summary,
      skills: item.skills,
      source: "resume",
      resumeKey: resumeExperienceKey(item.organization, item.title),
    };

    const { data: exp, error: expError } = await sb
      .from("experiences")
      .insert(toCreateRow(userId, input, i))
      .select("*")
      .single();
    if (expError || !exp) throw expError ?? new Error("Failed to save parsed experience.");

    if (item.bullets.length > 0) {
      const { error: bulletError } = await sb.from("experience_bullets").insert(
        item.bullets.map((content, sortOrder) => ({
          user_id: userId,
          experience_id: exp.id as string,
          content,
          sort_order: sortOrder,
        })),
      );
      if (bulletError) throw bulletError;
    }
  }

  const manualOffset = parsed.length;
  for (let i = 0; i < (manualRows ?? []).length; i++) {
    const row = manualRows![i]!;
    const { error } = await sb
      .from("experiences")
      .update({ sort_order: manualOffset + i, updated_at: new Date().toISOString() })
      .eq("id", row.id as string)
      .eq("user_id", userId);
    if (error) throw error;
  }

  return listExperiences(userId);
}
