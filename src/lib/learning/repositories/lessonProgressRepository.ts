import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LessonProgressRecord } from "@/lib/learning/types";

function client(): SupabaseClient {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  return sb;
}

function mapRow(row: Record<string, unknown>): LessonProgressRecord {
  return {
    id: row["id"] as string,
    lessonId: row["lesson_id"] as string,
    startedAt: row["started_at"] as string,
    lastOpenedAt: row["last_opened_at"] as string,
    completedAt: (row["completed_at"] as string) || null,
  };
}

export async function listLessonProgress(userId: string): Promise<LessonProgressRecord[]> {
  const { data, error } = await client()
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function touchLessonProgress(
  userId: string,
  lessonId: string,
): Promise<LessonProgressRecord> {
  const now = new Date().toISOString();
  const { data: existing } = await client()
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await client()
      .from("lesson_progress")
      .update({ last_opened_at: now, updated_at: now })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  }

  const { data, error } = await client()
    .from("lesson_progress")
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      started_at: now,
      last_opened_at: now,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function markLessonComplete(
  userId: string,
  lessonId: string,
): Promise<LessonProgressRecord> {
  const now = new Date().toISOString();
  await touchLessonProgress(userId, lessonId);
  const { data, error } = await client()
    .from("lesson_progress")
    .update({ completed_at: now, last_opened_at: now, updated_at: now })
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function markLessonIncomplete(
  userId: string,
  lessonId: string,
): Promise<LessonProgressRecord> {
  const now = new Date().toISOString();
  const { data, error } = await client()
    .from("lesson_progress")
    .update({ completed_at: null, updated_at: now })
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
