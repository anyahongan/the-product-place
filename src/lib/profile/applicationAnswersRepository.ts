import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { StandardApplicationAnswer } from "@/types/profile";

function client(): SupabaseClient {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  return sb;
}

function mapAnswer(row: Record<string, unknown>): StandardApplicationAnswer {
  return {
    id: row["id"] as string,
    label: (row["label"] as string) || "",
    answer: (row["answer"] as string) || "",
    category: (row["category"] as string) || null,
    sortOrder: (row["sort_order"] as number) || 0,
    updatedAt: (row["updated_at"] as string) || new Date().toISOString(),
  };
}

export async function listApplicationAnswers(
  userId: string,
): Promise<StandardApplicationAnswer[]> {
  const { data, error } = await client()
    .from("standard_application_answers")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAnswer);
}

export async function createApplicationAnswer(
  userId: string,
  input: { label: string; answer?: string; category?: string | null },
): Promise<StandardApplicationAnswer> {
  const sb = client();
  const { data: existing } = await sb
    .from("standard_application_answers")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = ((existing?.[0]?.sort_order as number) ?? -1) + 1;
  const { data, error } = await sb
    .from("standard_application_answers")
    .insert({
      user_id: userId,
      label: input.label.trim(),
      answer: (input.answer ?? "").trim(),
      category: input.category?.trim() || null,
      sort_order: nextOrder,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create answer.");
  return mapAnswer(data);
}

export async function updateApplicationAnswer(
  userId: string,
  id: string,
  patch: { label?: string; answer?: string; category?: string | null },
): Promise<StandardApplicationAnswer> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) row["label"] = patch.label.trim();
  if (patch.answer !== undefined) row["answer"] = patch.answer;
  if (patch.category !== undefined) row["category"] = patch.category?.trim() || null;
  const { data, error } = await client()
    .from("standard_application_answers")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update answer.");
  return mapAnswer(data);
}

export async function deleteApplicationAnswer(userId: string, id: string): Promise<void> {
  const { error } = await client()
    .from("standard_application_answers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
