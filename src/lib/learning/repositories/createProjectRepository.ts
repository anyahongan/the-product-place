import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { emptyProjectContent, getCreateTemplate } from "@/lib/learning/content";
import type {
  CreateProjectRecord,
  CreateProjectStatus,
  CreateTemplateType,
} from "@/lib/learning/types";

function client(): SupabaseClient {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  return sb;
}

function mapRow(row: Record<string, unknown>): CreateProjectRecord {
  const content = row["content"];
  return {
    id: row["id"] as string,
    templateType: row["template_type"] as CreateTemplateType,
    title: row["title"] as string,
    status: row["status"] as CreateProjectStatus,
    content:
      content && typeof content === "object" && !Array.isArray(content)
        ? (content as Record<string, string>)
        : {},
    sourcePracticeQuestionId: (row["source_practice_question_id"] as string) || null,
    archivedAt: (row["archived_at"] as string) || null,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  };
}

export async function listCreateProjects(
  userId: string,
  opts?: { includeArchived?: boolean },
): Promise<CreateProjectRecord[]> {
  let q = client().from("create_projects").select("*").eq("user_id", userId);
  if (!opts?.includeArchived) {
    q = q.in("status", ["active", "completed"]);
  }
  const { data, error } = await q.order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function getCreateProject(
  userId: string,
  projectId: string,
): Promise<CreateProjectRecord | null> {
  const { data, error } = await client()
    .from("create_projects")
    .select("*")
    .eq("user_id", userId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createProject(
  userId: string,
  input: {
    templateType: CreateTemplateType;
    title?: string;
    sourcePracticeQuestionId?: string | null;
    seedContent?: Record<string, string>;
  },
): Promise<CreateProjectRecord> {
  const template = getCreateTemplate(input.templateType);
  if (!template) throw new Error(`Unknown template: ${input.templateType}`);
  const content = {
    ...emptyProjectContent(template),
    ...(input.seedContent ?? {}),
  };
  const { data, error } = await client()
    .from("create_projects")
    .insert({
      user_id: userId,
      template_type: input.templateType,
      title: (input.title ?? template.title).trim() || template.title,
      status: "active",
      content,
      source_practice_question_id: input.sourcePracticeQuestionId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateCreateProject(
  userId: string,
  projectId: string,
  patch: {
    title?: string;
    content?: Record<string, string>;
    status?: CreateProjectStatus;
    archivedAt?: string | null;
  },
): Promise<CreateProjectRecord> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row["title"] = patch.title.trim();
  if (patch.content !== undefined) row["content"] = patch.content;
  if (patch.status !== undefined) row["status"] = patch.status;
  if (patch.archivedAt !== undefined) row["archived_at"] = patch.archivedAt;

  const { data, error } = await client()
    .from("create_projects")
    .update(row)
    .eq("id", projectId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function duplicateCreateProject(
  userId: string,
  projectId: string,
): Promise<CreateProjectRecord> {
  const existing = await getCreateProject(userId, projectId);
  if (!existing) throw new Error("Project not found");
  return createProject(userId, {
    templateType: existing.templateType,
    title: `${existing.title} (copy)`,
    seedContent: { ...existing.content },
  });
}

export async function completeCreateProject(
  userId: string,
  projectId: string,
): Promise<CreateProjectRecord> {
  return updateCreateProject(userId, projectId, {
    status: "completed",
    archivedAt: null,
  });
}

export async function reopenCreateProject(
  userId: string,
  projectId: string,
): Promise<CreateProjectRecord> {
  return updateCreateProject(userId, projectId, {
    status: "active",
    archivedAt: null,
  });
}

export async function archiveCreateProject(
  userId: string,
  projectId: string,
): Promise<CreateProjectRecord> {
  return updateCreateProject(userId, projectId, {
    status: "archived",
    archivedAt: new Date().toISOString(),
  });
}

export async function deleteCreateProject(userId: string, projectId: string): Promise<void> {
  const { error } = await client()
    .from("create_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);
  if (error) throw error;
}
