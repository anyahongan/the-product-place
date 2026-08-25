import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PracticeAttemptRecord } from "@/lib/learning/types";

function client(): SupabaseClient {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  return sb;
}

function mapRow(row: Record<string, unknown>): PracticeAttemptRecord {
  const rubric = row["rubric_state"];
  return {
    id: row["id"] as string,
    questionId: row["question_id"] as string,
    startedAt: row["started_at"] as string,
    completedAt: (row["completed_at"] as string) || null,
    responseText: (row["response_text"] as string) || "",
    rubricState:
      rubric && typeof rubric === "object" && !Array.isArray(rubric)
        ? (rubric as Record<string, boolean>)
        : {},
    notes: (row["notes"] as string) || null,
  };
}

export async function listPracticeAttempts(userId: string): Promise<PracticeAttemptRecord[]> {
  const { data, error } = await client()
    .from("practice_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function createPracticeAttempt(
  userId: string,
  questionId: string,
): Promise<PracticeAttemptRecord> {
  const { data, error } = await client()
    .from("practice_attempts")
    .insert({
      user_id: userId,
      question_id: questionId,
      response_text: "",
      rubric_state: {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updatePracticeAttempt(
  userId: string,
  attemptId: string,
  patch: {
    responseText?: string;
    rubricState?: Record<string, boolean>;
    notes?: string | null;
    completedAt?: string | null;
  },
): Promise<PracticeAttemptRecord> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.responseText !== undefined) row["response_text"] = patch.responseText;
  if (patch.rubricState !== undefined) row["rubric_state"] = patch.rubricState;
  if (patch.notes !== undefined) row["notes"] = patch.notes;
  if (patch.completedAt !== undefined) row["completed_at"] = patch.completedAt;

  const { data, error } = await client()
    .from("practice_attempts")
    .update(row)
    .eq("id", attemptId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
