import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  RESUME_ALLOWED_MIME,
  RESUME_MAX_BYTES,
  type ResumeDocument,
} from "@/types/profile";

const BUCKET = "resumes";

function client(): SupabaseClient {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  return sb;
}

function mapDoc(row: Record<string, unknown>): ResumeDocument {
  return {
    id: row["id"] as string,
    documentType: (row["document_type"] as ResumeDocument["documentType"]) || "MASTER_RESUME",
    storagePath: row["storage_path"] as string,
    originalFilename: row["original_filename"] as string,
    mimeType: row["mime_type"] as string,
    byteSize: typeof row["byte_size"] === "number" ? row["byte_size"] : null,
    uploadedAt: row["uploaded_at"] as string,
    isCurrent: Boolean(row["is_current"]),
  };
}

export function validateResumeFile(file: File): string | null {
  if (!RESUME_ALLOWED_MIME.includes(file.type as (typeof RESUME_ALLOWED_MIME)[number])) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return "Please upload a PDF resume.";
    }
  }
  if (file.size <= 0) return "That file looks empty.";
  if (file.size > RESUME_MAX_BYTES) return "Resume must be 10 MB or smaller.";
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120) || "resume.pdf";
}

export async function loadMasterResume(userId: string): Promise<ResumeDocument | null> {
  const { data, error } = await client()
    .from("resume_documents")
    .select("*")
    .eq("user_id", userId)
    .eq("document_type", "MASTER_RESUME")
    .eq("is_current", true)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDoc(data) : null;
}

/** Upload or replace the current master resume. Marks prior master resumes inactive. */
export async function uploadMasterResume(
  userId: string,
  file: File,
): Promise<ResumeDocument> {
  const validation = validateResumeFile(file);
  if (validation) throw new Error(validation);

  const sb = client();
  const safeName = sanitizeFilename(file.name);
  const stamp = Date.now();
  const storagePath = `${userId}/master-resume/${stamp}-${safeName}`;
  const mime = file.type || "application/pdf";

  const { error: upErr } = await sb.storage.from(BUCKET).upload(storagePath, file, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) throw new Error("Could not upload resume. Please try again.");

  // Mark previous current masters inactive (keep history rows for future tailored versions).
  await sb
    .from("resume_documents")
    .update({ is_current: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("document_type", "MASTER_RESUME")
    .eq("is_current", true);

  const { data, error } = await sb
    .from("resume_documents")
    .insert({
      user_id: userId,
      document_type: "MASTER_RESUME",
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: mime,
      byte_size: file.size,
      is_current: true,
      uploaded_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    await sb.storage.from(BUCKET).remove([storagePath]);
    throw error ?? new Error("Could not save resume metadata.");
  }

  return mapDoc(data);
}

export async function replaceMasterResume(
  userId: string,
  file: File,
): Promise<ResumeDocument> {
  return uploadMasterResume(userId, file);
}

/** Short-lived signed URL for authenticated download/view. */
export async function getMasterResumeSignedUrl(
  userId: string,
  storagePath: string,
  expiresIn = 120,
): Promise<string> {
  if (!storagePath.startsWith(`${userId}/`)) {
    throw new Error("Invalid resume path.");
  }
  const { data, error } = await client()
    .storage.from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error("Could not open resume.");
  }
  return data.signedUrl;
}

export async function deleteMasterResume(userId: string): Promise<void> {
  const sb = client();
  const current = await loadMasterResume(userId);
  if (!current) return;
  await sb
    .from("resume_documents")
    .update({ is_current: false, updated_at: new Date().toISOString() })
    .eq("id", current.id)
    .eq("user_id", userId);
  // Leave Storage object; future cleanup can prune non-current files.
}
