import type { ApplicationRecord, ApplicationLifecycleStatus, StatusEvent } from "@/lib/apply/types";
import type { NetworkContact, NetworkNote, TimelineEvent } from "@/types/network";
import type { ContactApplicationLink } from "@/types/recruiting";
import { companyIdFromName } from "@/types/recruiting";
import type { ToneName } from "@/types/apply";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function loadPersonalFromSupabase(userId: string): Promise<{
  apps: ApplicationRecord[];
  contacts: NetworkContact[];
  notes: NetworkNote[];
  links: ContactApplicationLink[];
  savedIds: string[];
  queueIds: string[];
} | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const [appsRes, contactsRes, notesRes, linksRes, savedRes] = await Promise.all([
    supabase.from("applications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("contacts").select("*").eq("user_id", userId),
    supabase.from("notes").select("*").eq("user_id", userId),
    supabase.from("contact_application_links").select("*").eq("user_id", userId),
    supabase.from("saved_jobs").select("job_id, auto_queue").eq("user_id", userId),
  ]);

  if (appsRes.error || contactsRes.error || notesRes.error || linksRes.error || savedRes.error) {
    console.error("loadPersonalFromSupabase", {
      apps: appsRes.error,
      contacts: contactsRes.error,
      notes: notesRes.error,
      links: linksRes.error,
      saved: savedRes.error,
    });
    return null;
  }

  const appRows = appsRes.data ?? [];
  const appIds = appRows.map((a) => a.id as string);
  const { data: events } = appIds.length
    ? await supabase
        .from("application_status_events")
        .select("*")
        .in("application_id", appIds)
        .order("occurred_at", { ascending: true })
    : { data: [] as Array<Record<string, unknown>> };

  const eventsByApp = new Map<string, StatusEvent[]>();
  for (const ev of events ?? []) {
    const list = eventsByApp.get(ev.application_id as string) ?? [];
    list.push({
      status: ev.status as ApplicationLifecycleStatus,
      timestamp: ev.occurred_at as string,
    });
    eventsByApp.set(ev.application_id as string, list);
  }

  const contactIds = (contactsRes.data ?? []).map((c) => c.id as string);
  const { data: interactions } = contactIds.length
    ? await supabase.from("interactions").select("*").in("contact_id", contactIds)
    : { data: [] as Array<Record<string, unknown>> };

  const timelineByContact = new Map<string, TimelineEvent[]>();
  for (const ix of interactions ?? []) {
    const list = timelineByContact.get(ix.contact_id as string) ?? [];
    const event: TimelineEvent = {
      id: ix.id as string,
      date: (ix.occurred_at as string).slice(0, 10),
      type: ix.interaction_type as TimelineEvent["type"],
      title: (ix.subject as string) || (ix.interaction_type as string),
    };
    if (ix.details) event.detail = ix.details as string;
    if (ix.email_subject) event.emailSubject = ix.email_subject as string;
    if (ix.email_body) event.emailBody = ix.email_body as string;
    if (ix.meeting_time) event.meetingTime = ix.meeting_time as string;
    if (ix.application_id) event.applicationId = ix.application_id as string;
    list.push(event);
    timelineByContact.set(ix.contact_id as string, list);
  }

  const links: ContactApplicationLink[] = (linksRes.data ?? []).map((l) => ({
    id: l.id as string,
    contactId: l.contact_id as string,
    applicationId: l.application_id as string,
    relationshipContext: l.relationship_context as ContactApplicationLink["relationshipContext"],
  }));

  const relatedByContact = new Map<string, string[]>();
  for (const l of links) {
    const arr = relatedByContact.get(l.contactId) ?? [];
    arr.push(l.applicationId);
    relatedByContact.set(l.contactId, arr);
  }

  const apps: ApplicationRecord[] = appRows.map((a) => {
    const snapshot = a.job_snapshot as
      | { companyId?: string; catalogCompanyId?: string }
      | null;
    // Prefer snapshot UI/legacy company id (co-*) so Network deep-links keep working.
    // applications.company_id may be the shared catalog UUID — do not use it as Network companyId.
    const snapUi = snapshot?.companyId && !isUuid(snapshot.companyId) ? snapshot.companyId : null;
    const rawUi =
      typeof a.company_id === "string" && !isUuid(a.company_id) ? (a.company_id as string) : null;
    const uiCompanyId = snapUi || rawUi || companyIdFromName((a.company_name as string) || "Unknown");
    return {
      applicationId: a.id as string,
      jobId: (a.job_id as string) || (a.legacy_job_id as string) || `legacy-${a.id}`,
      companyId: uiCompanyId,
      company: a.company_name as string,
      title: a.title as string,
      dateApplied: (a.date_applied as string) ?? null,
      currentStatus: a.current_status as ApplicationLifecycleStatus,
      statusHistory: eventsByApp.get(a.id as string) ?? [
        { status: a.current_status as ApplicationLifecycleStatus, timestamp: a.created_at as string },
      ],
      resumeUsed: null,
      coverLetterUsed: null,
      applyUrl: (a.apply_url as string) ?? null,
      sourceUrl: (a.source_url as string) ?? null,
      autoQueued: Boolean(a.auto_queued),
      tone: (a.tone as ToneName) || "blue",
    };
  });

  const contacts: NetworkContact[] = (contactsRes.data ?? []).map((c) => ({
    id: c.id as string,
    companyId: (c.company_id as string) || (c.legacy_company_id as string) || "co-unknown",
    name: c.name as string,
    title: c.title as string,
    linkedinUrl: (c.linkedin_url as string) || null,
    contactType: c.contact_type as NetworkContact["contactType"],
    isRecruiter: Boolean(c.is_recruiter),
    isCampusRecruiter: Boolean(c.is_campus_recruiter),
    schoolRelationship: (c.school_relationship as string) ?? null,
    connectionDegree: (c.connection_degree as NetworkContact["connectionDegree"]) ?? null,
    backgroundSimilarities: (c.background_similarities as string[]) ?? [],
    relatedApplicationIds: relatedByContact.get(c.id as string) ?? [],
    relationshipStatus: c.relationship_status as NetworkContact["relationshipStatus"],
    nextAction: c.next_action as NetworkContact["nextAction"],
    lastContacted: (c.last_contacted_at as string) ?? null,
    nextFollowUp: (c.next_follow_up as string) ?? null,
    meetingDate: (c.meeting_date as string) ?? null,
    referralStatus: c.referral_status as NetworkContact["referralStatus"],
    notes: (c.notes as string) ?? "",
    timeline: timelineByContact.get(c.id as string) ?? [],
    isRecommended: Boolean(c.is_recommended),
    matchScore: (c.match_score as number) ?? null,
    matchReasons: (c.match_reasons as NetworkContact["matchReasons"]) ?? [],
    tone: (c.tone as NetworkContact["tone"]) || "pink",
  }));

  const notes: NetworkNote[] = (notesRes.data ?? []).map((n) => ({
    id: n.id as string,
    contactId: n.contact_id as string,
    companyId: (n.company_id as string) || "co-unknown",
    relatedApplicationIds: (n.related_application_ids as string[]) ?? [],
    learnedAt: n.learned_at as string,
    relatedTimelineEventId: (n.related_timeline_event_id as string) ?? null,
    type: n.note_type as NetworkNote["type"],
    text: n.content as string,
    createdAt: (n.created_at as string).slice(0, 10),
    useForApplicationMaterials: Boolean(n.use_for_application_materials),
    useForInterviewPrep: Boolean(n.use_for_interview_prep),
  }));

  const savedIds = (savedRes.data ?? []).map((s) => s.job_id as string);
  const queueIds = (savedRes.data ?? []).filter((s) => s.auto_queue).map((s) => s.job_id as string);

  return { apps, contacts, notes, links, savedIds, queueIds };
}
