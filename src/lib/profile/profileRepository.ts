import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ProfileApplicationDetails,
  ProfileBasics,
  ProfileRecord,
  ProfileTargets,
  StandardApplicationAnswer,
  UserProfileBundle,
  WorkAuthorizationStatus,
} from "@/types/profile";
import type { EmploymentType, ProductRole, WorkMode } from "@/types/apply";
import { loadMasterResume } from "@/lib/profile/resumeRepository";
import { listExperiences } from "@/lib/profile/experienceRepository";
import { listApplicationAnswers } from "@/lib/profile/applicationAnswersRepository";

function client(): SupabaseClient {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  return sb;
}

function emptyProfile(userId: string): ProfileRecord {
  return {
    id: userId,
    preferredName: "",
    school: "",
    major: "",
    minor: "",
    graduationYear: null,
    currentLocation: "",
    preferredEmail: "",
    phone: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    websiteUrl: "",
    workAuthorizationStatus: "",
    requiresSponsorship: null,
    updatedAt: new Date().toISOString(),
    onboardingCompleted: false,
    onboardingCompletedAt: null,
  };
}

function mapProfile(row: Record<string, unknown>, userId: string): ProfileRecord {
  return {
    id: (row["id"] as string) || userId,
    preferredName: (row["preferred_name"] as string) || "",
    school: (row["school"] as string) || "",
    major: (row["major"] as string) || "",
    minor: (row["minor"] as string) || "",
    graduationYear: typeof row["graduation_year"] === "number" ? row["graduation_year"] : null,
    currentLocation: (row["current_location"] as string) || "",
    preferredEmail: (row["preferred_email"] as string) || "",
    phone: (row["phone"] as string) || "",
    linkedinUrl: (row["linkedin_url"] as string) || "",
    githubUrl: (row["github_url"] as string) || "",
    portfolioUrl: (row["portfolio_url"] as string) || "",
    websiteUrl: (row["website_url"] as string) || "",
    workAuthorizationStatus: ((row["work_authorization_status"] as string) ||
      "") as WorkAuthorizationStatus,
    requiresSponsorship:
      typeof row["requires_sponsorship"] === "boolean" ? row["requires_sponsorship"] : null,
    updatedAt: (row["updated_at"] as string) || new Date().toISOString(),
    onboardingCompleted: Boolean(row["onboarding_completed"]),
    onboardingCompletedAt:
      typeof row["onboarding_completed_at"] === "string" ? row["onboarding_completed_at"] : null,
  };
}

/** Ensure a profiles row exists (trigger usually creates it). */
export async function ensureProfile(userId: string): Promise<ProfileRecord> {
  const sb = client();
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (data) return mapProfile(data, userId);

  const { data: inserted, error: insErr } = await sb
    .from("profiles")
    .upsert({ id: userId, updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (insErr || !inserted) throw insErr ?? new Error("Could not create profile.");
  return mapProfile(inserted, userId);
}

export async function loadTargets(userId: string): Promise<ProfileTargets> {
  const sb = client();
  const [rolesRes, locsRes, modesRes, empRes] = await Promise.all([
    sb.from("profile_role_preferences").select("role").eq("user_id", userId),
    sb
      .from("profile_location_preferences")
      .select("id, location_label, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true }),
    sb.from("profile_work_mode_preferences").select("work_mode").eq("user_id", userId),
    sb.from("profile_employment_type_preferences").select("employment_type").eq("user_id", userId),
  ]);
  if (rolesRes.error) throw rolesRes.error;
  if (locsRes.error) throw locsRes.error;
  if (modesRes.error) throw modesRes.error;
  if (empRes.error) throw empRes.error;

  return {
    roles: (rolesRes.data ?? []).map((r) => r.role as ProductRole),
    locations: (locsRes.data ?? []).map((l) => ({
      id: l.id as string,
      label: l.location_label as string,
      sortOrder: l.sort_order as number,
    })),
    workModes: (modesRes.data ?? []).map((m) => m.work_mode as WorkMode),
    employmentTypes: (empRes.data ?? []).map((e) => e.employment_type as EmploymentType),
  };
}

export async function loadProfileBundle(userId: string): Promise<UserProfileBundle> {
  const [profile, targets, answers, masterResume, experiences] = await Promise.all([
    ensureProfile(userId),
    loadTargets(userId),
    listApplicationAnswers(userId),
    loadMasterResume(userId),
    listExperiences(userId),
  ]);
  return { profile, targets, answers, masterResume, experiences };
}

export async function updateProfileBasics(
  userId: string,
  basics: ProfileBasics,
): Promise<ProfileRecord> {
  const sb = client();
  const { data, error } = await sb
    .from("profiles")
    .update({
      preferred_name: basics.preferredName.trim() || null,
      school: basics.school.trim() || null,
      major: basics.major.trim() || null,
      minor: basics.minor.trim() || null,
      graduation_year: basics.graduationYear,
      current_location: basics.currentLocation.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update profile basics.");
  return mapProfile(data, userId);
}

export async function updateApplicationDetails(
  userId: string,
  details: ProfileApplicationDetails,
): Promise<ProfileRecord> {
  const sb = client();
  const { data, error } = await sb
    .from("profiles")
    .update({
      preferred_email: details.preferredEmail.trim() || null,
      phone: details.phone.trim() || null,
      linkedin_url: details.linkedinUrl.trim() || null,
      github_url: details.githubUrl.trim() || null,
      portfolio_url: details.portfolioUrl.trim() || null,
      website_url: details.websiteUrl.trim() || null,
      work_authorization_status: details.workAuthorizationStatus || null,
      requires_sponsorship: details.requiresSponsorship,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update application details.");
  return mapProfile(data, userId);
}

export async function updateTargetRoles(userId: string, roles: ProductRole[]): Promise<void> {
  const sb = client();
  const unique = [...new Set(roles)];
  const { error: delErr } = await sb
    .from("profile_role_preferences")
    .delete()
    .eq("user_id", userId);
  if (delErr) throw delErr;
  if (unique.length === 0) return;
  const { error } = await sb
    .from("profile_role_preferences")
    .insert(unique.map((role) => ({ user_id: userId, role })));
  if (error) throw error;
}

export async function updateWorkModes(userId: string, modes: WorkMode[]): Promise<void> {
  const sb = client();
  const unique = [...new Set(modes)];
  const { error: delErr } = await sb
    .from("profile_work_mode_preferences")
    .delete()
    .eq("user_id", userId);
  if (delErr) throw delErr;
  if (unique.length === 0) return;
  const { error } = await sb
    .from("profile_work_mode_preferences")
    .insert(unique.map((work_mode) => ({ user_id: userId, work_mode })));
  if (error) throw error;
}

export async function updateEmploymentTypes(
  userId: string,
  types: EmploymentType[],
): Promise<void> {
  const sb = client();
  const unique = [...new Set(types)];
  const { error: delErr } = await sb
    .from("profile_employment_type_preferences")
    .delete()
    .eq("user_id", userId);
  if (delErr) throw delErr;
  if (unique.length === 0) return;
  const { error } = await sb
    .from("profile_employment_type_preferences")
    .insert(unique.map((employment_type) => ({ user_id: userId, employment_type })));
  if (error) throw error;
}

export async function replaceLocations(
  userId: string,
  labels: string[],
): Promise<ProfileTargets["locations"]> {
  const sb = client();
  const cleaned = labels.map((l) => l.trim()).filter(Boolean);
  const { error: delErr } = await sb
    .from("profile_location_preferences")
    .delete()
    .eq("user_id", userId);
  if (delErr) throw delErr;
  if (cleaned.length === 0) return [];
  const { data, error } = await sb
    .from("profile_location_preferences")
    .insert(
      cleaned.map((location_label, i) => ({
        user_id: userId,
        location_label,
        sort_order: i,
      })),
    )
    .select("id, location_label, sort_order");
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    label: l.location_label as string,
    sortOrder: l.sort_order as number,
  }));
}

export function emptyProfileRecord(userId: string): ProfileRecord {
  return emptyProfile(userId);
}

/** Lightweight flag check for Account Setup routing. */
export async function loadOnboardingCompleted(userId: string): Promise<boolean> {
  const sb = client();
  const { data, error } = await sb
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    await ensureProfile(userId);
    return false;
  }
  return Boolean(data["onboarding_completed"]);
}

/** Mark Account Setup finished. Only call from the final Ready step. */
export async function markOnboardingComplete(userId: string): Promise<ProfileRecord> {
  await ensureProfile(userId);
  const sb = client();
  const completedAt = new Date().toISOString();
  const { data, error } = await sb
    .from("profiles")
    .update({
      onboarding_completed: true,
      onboarding_completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Could not complete account setup.");
  return mapProfile(data, userId);
}

export type { StandardApplicationAnswer };
