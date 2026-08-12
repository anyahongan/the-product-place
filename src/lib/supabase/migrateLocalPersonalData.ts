import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listApplications, listAutoQueueIds, listSavedJobIds } from "@/lib/apply/repositories/applicationRepository";
import { listContacts, listNotes, listContactApplicationLinks } from "@/lib/recruiting/networkRepository";
import type { ApplicationRecord } from "@/lib/apply/types";
import type { NetworkContact, NetworkNote } from "@/types/network";

const LOCAL_FLAG_PREFIX = "tpp.recruiting.migrated.supabase.v1:";

export async function migrateLocalPersonalData(userId: string): Promise<{
  skipped: boolean;
  message: string;
}> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { skipped: true, message: "Supabase not configured." };

  const localFlag = `${LOCAL_FLAG_PREFIX}${userId}`;
  if (typeof window !== "undefined" && window.localStorage.getItem(localFlag)) {
    return { skipped: true, message: "Local data already migrated for this account." };
  }

  const { data: remoteFlag } = await supabase
    .from("user_data_migrations")
    .select("local_v1_completed_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (remoteFlag?.local_v1_completed_at) {
    window.localStorage.setItem(localFlag, remoteFlag.local_v1_completed_at);
    return { skipped: true, message: "Account already migrated." };
  }

  const apps = listApplications().filter((a) => !a.jobId.startsWith("demo-job-"));
  const contacts = listContacts();
  const notes = listNotes();
  const links = listContactApplicationLinks();
  const saved = listSavedJobIds();
  const queue = listAutoQueueIds();

  // Applications + status events
  const appIdMap = new Map<string, string>();
  for (const app of apps) {
    const inserted = await upsertApplication(supabase, userId, app);
    if (inserted) appIdMap.set(app.applicationId, inserted);
  }

  // Saved / queue — only when job UUID exists in catalog
  for (const jobId of saved) {
    if (!isUuid(jobId)) continue;
    await supabase.from("saved_jobs").upsert(
      {
        user_id: userId,
        job_id: jobId,
        auto_queue: queue.includes(jobId),
        saved_at: new Date().toISOString(),
      },
      { onConflict: "user_id,job_id" },
    );
  }

  const contactIdMap = new Map<string, string>();
  for (const c of contacts) {
    const id = await upsertContact(supabase, userId, c);
    if (id) contactIdMap.set(c.id, id);
  }

  for (const note of notes) {
    await upsertNote(supabase, userId, note, contactIdMap, appIdMap);
  }

  for (const link of links) {
    const contactId = contactIdMap.get(link.contactId);
    const applicationId = appIdMap.get(link.applicationId);
    if (!contactId || !applicationId) continue;
    await supabase.from("contact_application_links").upsert(
      {
        user_id: userId,
        contact_id: contactId,
        application_id: applicationId,
        relationship_context: link.relationshipContext,
      },
      { onConflict: "contact_id,application_id" },
    );
  }

  // Timeline → interactions
  for (const c of contacts) {
    const contactId = contactIdMap.get(c.id);
    if (!contactId) continue;
    for (const ev of c.timeline) {
      await supabase.from("interactions").insert({
        user_id: userId,
        contact_id: contactId,
        interaction_type: ev.type,
        occurred_at: ev.date,
        subject: ev.title,
        details: ev.detail ?? null,
        email_subject: ev.emailSubject ?? null,
        email_body: ev.emailBody ?? null,
        meeting_time: ev.meetingTime ?? null,
        application_id: ev.applicationId ? appIdMap.get(ev.applicationId) ?? null : null,
      });
    }
    if (c.nextFollowUp) {
      await supabase.from("follow_up_reminders").insert({
        user_id: userId,
        contact_id: contactId,
        due_at: c.nextFollowUp,
        status: "FOLLOW UP",
      });
    }
    if (c.referralStatus && c.referralStatus !== "NOT DISCUSSED") {
      const relatedApp = c.relatedApplicationIds[0];
      await supabase.from("referral_status_events").insert({
        user_id: userId,
        contact_id: contactId,
        application_id: relatedApp ? appIdMap.get(relatedApp) ?? null : null,
        status: c.referralStatus,
      });
    }
  }

  const completedAt = new Date().toISOString();
  await supabase.from("user_data_migrations").upsert({
    user_id: userId,
    local_v1_completed_at: completedAt,
    updated_at: completedAt,
  });
  window.localStorage.setItem(localFlag, completedAt);

  return {
    skipped: false,
    message: `Migrated ${apps.length} applications, ${contacts.length} contacts, ${notes.length} notes. Local copies kept as backup.`,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function upsertApplication(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  userId: string,
  app: ApplicationRecord,
): Promise<string | null> {
  const row = {
    user_id: userId,
    job_id: isUuid(app.jobId) ? app.jobId : null,
    company_id: isUuid(app.companyId) ? app.companyId : null,
    legacy_job_id: app.jobId,
    company_name: app.company,
    title: app.title,
    date_applied: app.dateApplied,
    current_status: app.currentStatus,
    apply_url: app.applyUrl,
    source_url: app.sourceUrl,
    auto_queued: app.autoQueued,
    tone: app.tone,
    job_snapshot: {
      companyId: app.companyId,
      applicationId: app.applicationId,
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("applications")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) return null;

  for (const ev of app.statusHistory) {
    await supabase.from("application_status_events").insert({
      user_id: userId,
      application_id: data.id,
      status: ev.status,
      occurred_at: ev.timestamp,
    });
  }
  return data.id as string;
}

async function upsertContact(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  userId: string,
  c: NetworkContact,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      company_id: isUuid(c.companyId) ? c.companyId : null,
      legacy_company_id: c.companyId,
      name: c.name,
      title: c.title,
      contact_type: c.contactType,
      is_recruiter: c.isRecruiter,
      is_campus_recruiter: c.isCampusRecruiter,
      school_relationship: c.schoolRelationship,
      connection_degree: c.connectionDegree,
      background_similarities: c.backgroundSimilarities,
      relationship_status: c.relationshipStatus,
      next_action: c.nextAction,
      last_contacted_at: c.lastContacted,
      next_follow_up: c.nextFollowUp,
      meeting_date: c.meetingDate,
      referral_status: c.referralStatus,
      notes: c.notes,
      is_recommended: c.isRecommended,
      match_score: c.matchScore,
      match_reasons: c.matchReasons,
      tone: c.tone,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id as string;
}

async function upsertNote(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  userId: string,
  note: NetworkNote,
  contactIdMap: Map<string, string>,
  appIdMap: Map<string, string>,
) {
  const contactId = contactIdMap.get(note.contactId);
  if (!contactId) return;
  const primaryApp = note.relatedApplicationIds[0];
  await supabase.from("notes").insert({
    user_id: userId,
    contact_id: contactId,
    company_id: isUuid(note.companyId) ? note.companyId : null,
    application_id: primaryApp ? appIdMap.get(primaryApp) ?? null : null,
    related_application_ids: note.relatedApplicationIds
      .map((id) => appIdMap.get(id) ?? id)
      .filter(Boolean),
    related_timeline_event_id: note.relatedTimelineEventId,
    note_type: note.type,
    content: note.text,
    learned_at: note.learnedAt,
    use_for_application_materials: note.useForApplicationMaterials,
    use_for_interview_prep: note.useForInterviewPrep,
  });
}
