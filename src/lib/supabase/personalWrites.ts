import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationLifecycleStatus, ApplicationRecord, JobListingView } from "@/lib/apply/types";
import type { NetworkContact, NetworkNote, TimelineEvent } from "@/types/network";
import type { ContactApplicationLink } from "@/types/recruiting";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { appendStatus, createAppliedRecord } from "@/lib/apply/repositories/applicationRepository";

function client(): SupabaseClient {
  const sb = getSupabaseBrowserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  return sb;
}

export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function saveJob(
  userId: string,
  jobId: string,
  autoQueue = false,
): Promise<void> {
  if (!isUuid(jobId)) {
    throw new Error("Only canonical catalog jobs (UUID) can be saved to Supabase.");
  }
  const { error } = await client().from("saved_jobs").upsert(
    {
      user_id: userId,
      job_id: jobId,
      auto_queue: autoQueue,
      saved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,job_id" },
  );
  if (error) throw error;
}

export async function unsaveJob(userId: string, jobId: string): Promise<void> {
  if (!isUuid(jobId)) return;
  const { error } = await client()
    .from("saved_jobs")
    .delete()
    .eq("user_id", userId)
    .eq("job_id", jobId);
  if (error) throw error;
}

export async function setSavedAutoQueue(
  userId: string,
  jobId: string,
  autoQueue: boolean,
): Promise<void> {
  if (!isUuid(jobId)) return;
  const { error } = await client()
    .from("saved_jobs")
    .upsert(
      {
        user_id: userId,
        job_id: jobId,
        auto_queue: autoQueue,
        saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,job_id" },
    );
  if (error) throw error;
}

/** Create or update application + append status event. Returns domain app with server UUID. */
export async function markJobApplied(
  userId: string,
  job: JobListingView,
  existing: ApplicationRecord | undefined,
): Promise<ApplicationRecord> {
  const sb = client();
  const now = new Date().toISOString();

  if (existing && isUuid(existing.applicationId)) {
    const next = appendStatus(existing, "Applied");
    const catalogCompanyId = isUuid(job.catalogCompanyId) ? job.catalogCompanyId! : null;
    const { error } = await sb
      .from("applications")
      .update({
        current_status: next.currentStatus,
        date_applied: next.dateApplied,
        company_name: job.company,
        title: job.title,
        apply_url: job.applicationUrl || existing.applyUrl,
        source_url: job.sourceUrl || existing.sourceUrl,
        updated_at: now,
        ...(catalogCompanyId ? { company_id: catalogCompanyId } : {}),
      })
      .eq("id", existing.applicationId)
      .eq("user_id", userId);
    if (error) throw error;
    if (existing.currentStatus !== "Applied") {
      const { error: evErr } = await sb.from("application_status_events").insert({
        user_id: userId,
        application_id: existing.applicationId,
        status: "Applied",
        occurred_at: now,
      });
      if (evErr) throw evErr;
    }
    return next;
  }

  // Upsert by user_id+job_id when job is a catalog UUID
  if (isUuid(job.id)) {
    const { data: found } = await sb
      .from("applications")
      .select("id, current_status, date_applied, company_name, title, apply_url, source_url, auto_queued, tone, company_id, job_id, created_at")
      .eq("user_id", userId)
      .eq("job_id", job.id)
      .maybeSingle();
    if (found?.id) {
      const base: ApplicationRecord = {
        applicationId: found.id as string,
        jobId: job.id,
        companyId: (found.company_id as string) || existing?.companyId || `co-unknown`,
        company: (found.company_name as string) || job.company,
        title: (found.title as string) || job.title,
        dateApplied: (found.date_applied as string) ?? null,
        currentStatus: found.current_status as ApplicationLifecycleStatus,
        statusHistory: existing?.statusHistory ?? [
          {
            status: found.current_status as ApplicationLifecycleStatus,
            timestamp: found.created_at as string,
          },
        ],
        resumeUsed: null,
        coverLetterUsed: null,
        applyUrl: (found.apply_url as string) ?? job.applicationUrl ?? null,
        sourceUrl: (found.source_url as string) ?? job.sourceUrl,
        autoQueued: Boolean(found.auto_queued),
        tone: (found.tone as ApplicationRecord["tone"]) || "blue",
      };
      return markJobApplied(userId, job, base);
    }
  }

  const draft = createAppliedRecord(job, "Applied", existing?.companyId);
  const catalogCompanyId = isUuid(job.catalogCompanyId)
    ? job.catalogCompanyId!
    : isUuid(draft.companyId)
      ? draft.companyId
      : null;
  const { data, error } = await sb
    .from("applications")
    .insert({
      user_id: userId,
      job_id: isUuid(job.id) ? job.id : null,
      company_id: catalogCompanyId,
      legacy_job_id: job.id,
      company_name: draft.company,
      title: draft.title,
      date_applied: draft.dateApplied,
      current_status: "Applied",
      apply_url: draft.applyUrl,
      source_url: draft.sourceUrl,
      auto_queued: false,
      tone: draft.tone,
      job_snapshot: {
        companyId: draft.companyId,
        catalogCompanyId,
        jobId: job.id,
        location: job.location,
        productRole: job.productRole,
      },
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create application");

  const { error: evErr } = await sb.from("application_status_events").insert({
    user_id: userId,
    application_id: data.id,
    status: "Applied",
    occurred_at: now,
  });
  if (evErr) throw evErr;

  return { ...draft, applicationId: data.id as string };
}

export async function updateApplicationStatus(
  userId: string,
  app: ApplicationRecord,
  status: ApplicationLifecycleStatus,
): Promise<ApplicationRecord> {
  if (app.currentStatus === status) return app;
  if (!isUuid(app.applicationId)) {
    throw new Error("Application is not synced to Supabase yet.");
  }
  const next = appendStatus(app, status);
  const now = next.statusHistory[next.statusHistory.length - 1]?.timestamp ?? new Date().toISOString();
  const sb = client();
  const { error } = await sb
    .from("applications")
    .update({
      current_status: status,
      date_applied: next.dateApplied,
      updated_at: now,
    })
    .eq("id", app.applicationId)
    .eq("user_id", userId);
  if (error) throw error;
  const { error: evErr } = await sb.from("application_status_events").insert({
    user_id: userId,
    application_id: app.applicationId,
    status,
    occurred_at: now,
  });
  if (evErr) throw evErr;
  return next;
}

export async function upsertContactRow(
  userId: string,
  contact: NetworkContact,
): Promise<string> {
  const sb = client();
  const row = {
    user_id: userId,
    company_id: isUuid(contact.companyId) ? contact.companyId : null,
    legacy_company_id: contact.companyId,
    name: contact.name,
    title: contact.title,
    contact_type: contact.contactType,
    is_recruiter: contact.isRecruiter,
    is_campus_recruiter: contact.isCampusRecruiter,
    school_relationship: contact.schoolRelationship,
    connection_degree: contact.connectionDegree,
    background_similarities: contact.backgroundSimilarities,
    relationship_status: contact.relationshipStatus,
    next_action: contact.nextAction,
    last_contacted_at: contact.lastContacted,
    next_follow_up: contact.nextFollowUp,
    meeting_date: contact.meetingDate,
    referral_status: contact.referralStatus,
    notes: contact.notes,
    is_recommended: contact.isRecommended,
    match_score: contact.matchScore,
    match_reasons: contact.matchReasons,
    tone: contact.tone,
    updated_at: new Date().toISOString(),
  };

  if (isUuid(contact.id)) {
    const { error } = await sb.from("contacts").update(row).eq("id", contact.id).eq("user_id", userId);
    if (error) throw error;
    return contact.id;
  }

  const { data, error } = await sb.from("contacts").insert(row).select("id").single();
  if (error || !data) throw error ?? new Error("Failed to create contact");
  return data.id as string;
}

export async function syncContactApplicationLinks(
  userId: string,
  contactId: string,
  applicationIds: string[],
  existingLinks: ContactApplicationLink[],
): Promise<ContactApplicationLink[]> {
  if (!isUuid(contactId)) return existingLinks;
  const sb = client();
  const uuidApps = applicationIds.filter(isUuid);
  const current = existingLinks.filter((l) => l.contactId === contactId);

  for (const link of current) {
    if (!uuidApps.includes(link.applicationId) && isUuid(link.id)) {
      await sb.from("contact_application_links").delete().eq("id", link.id).eq("user_id", userId);
    }
  }

  const nextLinks = existingLinks.filter(
    (l) => l.contactId !== contactId || uuidApps.includes(l.applicationId),
  );

  for (const appId of uuidApps) {
    if (nextLinks.some((l) => l.contactId === contactId && l.applicationId === appId)) continue;
    const { data, error } = await sb
      .from("contact_application_links")
      .upsert(
        {
          user_id: userId,
          contact_id: contactId,
          application_id: appId,
          relationship_context: "GENERAL NETWORKING",
        },
        { onConflict: "contact_id,application_id" },
      )
      .select("id, contact_id, application_id, relationship_context")
      .single();
    if (error || !data) throw error ?? new Error("Failed to link contact");
    nextLinks.push({
      id: data.id as string,
      contactId: data.contact_id as string,
      applicationId: data.application_id as string,
      relationshipContext: data.relationship_context as ContactApplicationLink["relationshipContext"],
    });
  }
  return nextLinks;
}

export async function insertInteraction(
  userId: string,
  contactId: string,
  event: TimelineEvent,
  companyId: string | null,
): Promise<string> {
  if (!isUuid(contactId)) throw new Error("Contact must be saved before logging interactions.");
  const { data, error } = await client()
    .from("interactions")
    .insert({
      user_id: userId,
      contact_id: contactId,
      company_id: isUuid(companyId) ? companyId : null,
      application_id: event.applicationId && isUuid(event.applicationId) ? event.applicationId : null,
      interaction_type: event.type,
      occurred_at: event.date,
      subject: event.title,
      details: event.detail ?? null,
      email_subject: event.emailSubject ?? null,
      email_body: event.emailBody ?? null,
      meeting_time: event.meetingTime ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create interaction");
  return data.id as string;
}

export async function upsertNoteRow(
  userId: string,
  note: NetworkNote,
): Promise<string> {
  if (!isUuid(note.contactId)) throw new Error("Contact must be saved before notes.");
  const sb = client();
  const primaryApp = note.relatedApplicationIds.find(isUuid) ?? null;
  const row = {
    user_id: userId,
    contact_id: note.contactId,
    company_id: isUuid(note.companyId) ? note.companyId : null,
    application_id: primaryApp,
    related_application_ids: note.relatedApplicationIds,
    related_timeline_event_id: note.relatedTimelineEventId,
    note_type: note.type,
    content: note.text,
    learned_at: note.learnedAt,
    use_for_application_materials: note.useForApplicationMaterials,
    use_for_interview_prep: note.useForInterviewPrep,
    updated_at: new Date().toISOString(),
  };

  if (isUuid(note.id)) {
    const { error } = await sb.from("notes").update(row).eq("id", note.id).eq("user_id", userId);
    if (error) throw error;
    return note.id;
  }

  const { data, error } = await sb.from("notes").insert(row).select("id").single();
  if (error || !data) throw error ?? new Error("Failed to create note");
  return data.id as string;
}

export async function deleteNoteRow(userId: string, noteId: string): Promise<void> {
  if (!isUuid(noteId)) return;
  const { error } = await client().from("notes").delete().eq("id", noteId).eq("user_id", userId);
  if (error) throw error;
}

export async function upsertFollowUpReminder(
  userId: string,
  contactId: string,
  dueAt: string | null,
  status: "FOLLOW UP" | "SNOOZE" | "NO FOLLOW-UP NEEDED" | "COMPLETED",
): Promise<void> {
  if (!isUuid(contactId)) return;
  const sb = client();
  const { data: existing } = await sb
    .from("follow_up_reminders")
    .select("id")
    .eq("user_id", userId)
    .eq("contact_id", contactId)
    .in("status", ["FOLLOW UP", "SNOOZE"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dueAt || status === "NO FOLLOW-UP NEEDED" || status === "COMPLETED") {
    if (existing?.id) {
      const { error } = await sb
        .from("follow_up_reminders")
        .update({
          status,
          completed_at: status === "COMPLETED" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw error;
    }
    return;
  }

  if (existing?.id) {
    const { error } = await sb
      .from("follow_up_reminders")
      .update({
        due_at: dueAt,
        status,
        snoozed_until: status === "SNOOZE" ? dueAt : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await sb.from("follow_up_reminders").insert({
    user_id: userId,
    contact_id: contactId,
    due_at: dueAt,
    status,
    snoozed_until: status === "SNOOZE" ? dueAt : null,
  });
  if (error) throw error;
}

export async function appendReferralEvent(
  userId: string,
  contactId: string,
  status: NetworkContact["referralStatus"],
  applicationId: string | null,
): Promise<void> {
  if (!isUuid(contactId)) return;
  const { error } = await client().from("referral_status_events").insert({
    user_id: userId,
    contact_id: contactId,
    application_id: applicationId && isUuid(applicationId) ? applicationId : null,
    status,
    occurred_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Persist contact field changes + new timeline events + follow-up/referral side effects. */
export async function persistContactChange(
  userId: string,
  prev: NetworkContact | undefined,
  next: NetworkContact,
  links: ContactApplicationLink[],
): Promise<{ contact: NetworkContact; links: ContactApplicationLink[] }> {
  const contactId = await upsertContactRow(userId, next);
  let contact = contactId === next.id ? next : { ...next, id: contactId };

  // Remap timeline / related apps stay; sync new timeline events
  const prevIds = new Set((prev?.timeline ?? []).map((e) => e.id));
  const remappedTimeline: TimelineEvent[] = [];
  for (const ev of contact.timeline) {
    if (prevIds.has(ev.id)) {
      remappedTimeline.push(ev);
      continue;
    }
    const id = await insertInteraction(userId, contactId, ev, contact.companyId);
    remappedTimeline.push({ ...ev, id });
  }
  contact = { ...contact, id: contactId, timeline: remappedTimeline, relatedApplicationIds: next.relatedApplicationIds };

  const nextLinks = await syncContactApplicationLinks(
    userId,
    contactId,
    contact.relatedApplicationIds,
    links.map((l) =>
      l.contactId === next.id && contactId !== next.id ? { ...l, contactId } : l,
    ),
  );

  // Follow-up reminder
  if (next.nextFollowUp !== (prev?.nextFollowUp ?? null) || next.nextAction !== prev?.nextAction) {
    const status =
      next.nextAction === "No action"
        ? "NO FOLLOW-UP NEEDED"
        : next.nextFollowUp && next.nextFollowUp !== prev?.nextFollowUp
          ? "SNOOZE"
          : "FOLLOW UP";
    await upsertFollowUpReminder(userId, contactId, next.nextFollowUp, status);
  }

  // Referral history (append-only on change)
  if (prev && next.referralStatus !== prev.referralStatus) {
    await appendReferralEvent(
      userId,
      contactId,
      next.referralStatus,
      next.relatedApplicationIds.find(isUuid) ?? null,
    );
  } else if (!prev && next.referralStatus !== "NOT DISCUSSED") {
    await appendReferralEvent(
      userId,
      contactId,
      next.referralStatus,
      next.relatedApplicationIds.find(isUuid) ?? null,
    );
  }

  // Keep contact.referral_status column in sync (already in upsertContactRow)
  return { contact, links: nextLinks };
}

export async function persistNotesDiff(
  userId: string,
  prev: NetworkNote[],
  next: NetworkNote[],
): Promise<NetworkNote[]> {
  const prevById = new Map(prev.map((n) => [n.id, n]));
  const nextIds = new Set(next.map((n) => n.id));
  const result: NetworkNote[] = [];

  for (const note of prev) {
    if (!nextIds.has(note.id) && isUuid(note.id)) {
      await deleteNoteRow(userId, note.id);
    }
  }

  for (const note of next) {
    const before = prevById.get(note.id);
    if (
      before &&
      before.text === note.text &&
      before.useForApplicationMaterials === note.useForApplicationMaterials &&
      before.useForInterviewPrep === note.useForInterviewPrep &&
      before.type === note.type &&
      JSON.stringify(before.relatedApplicationIds) === JSON.stringify(note.relatedApplicationIds) &&
      isUuid(note.id)
    ) {
      result.push(note);
      continue;
    }
    if (!isUuid(note.contactId)) {
      result.push(note);
      continue;
    }
    const id = await upsertNoteRow(userId, note);
    result.push(id === note.id ? note : { ...note, id });
  }
  return result;
}
