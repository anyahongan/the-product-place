import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sheet, Tape, Clip } from "@/components/paper/Paper";
import { NextActionBadge, RecruiterBadge, ReferralStamp } from "@/components/network/Badges";
import { MatchReasons } from "@/components/network/MatchReasons";
import { CommunicationTimeline } from "@/components/network/CommunicationTimeline";
import { NotesTimeline } from "@/components/network/NotesTimeline";
import { OutreachDraftPanel } from "@/components/network/OutreachDraft";
import { MeetingPrep } from "@/components/network/MeetingPrep";
import { AddTimelineEvent } from "@/components/network/AddTimelineEvent";
import { referralStatusClass } from "@/components/network/networkUi";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import {
  draftForContact,
  formatNetworkDate,
  networkCompanies,
} from "@/data/network";
import type {
  CommunicationFormatPreference,
  NetworkContact,
  NetworkNote,
  OutreachDraft,
  OutreachKind,
  ReferralStatus,
  TimelineEvent,
} from "@/types/network";
import type { ApplicationRecord } from "@/lib/apply/types";
import { useNavigate } from "@tanstack/react-router";
import { formatShortDate } from "@/data/apply";

const referralOptions: ReferralStatus[] = [
  "NOT DISCUSSED",
  "MAYBE",
  "OFFERED",
  "REQUESTED",
  "SUBMITTED",
  "DECLINED",
  "NOT APPLICABLE",
];

function nextActionLabel(contact: NetworkContact): string {
  switch (contact.nextAction) {
    case "Follow up":
      return "Follow up today";
    case "Prep for meeting":
      return "Prep for meeting";
    case "Send thank-you":
      return "Send thank-you";
    case "Draft intro":
      return "Draft intro";
    case "Send intro":
      return "Send intro";
    case "Ask about referral":
      return "Ask about referral";
    case "Wait":
      return "Waiting for response";
    case "Check in later":
      return "Check in later";
    case "No action":
      return "No action needed";
    default:
      return contact.nextAction;
  }
}

function nextActionCta(contact: NetworkContact): {
  kind: OutreachKind | "meeting" | null;
  label: string;
} {
  switch (contact.nextAction) {
    case "Follow up":
      return { kind: "FOLLOW-UP", label: "Draft follow-up" };
    case "Draft intro":
    case "Send intro":
      return { kind: "COLD OUTREACH", label: "Draft intro" };
    case "Send thank-you":
      return { kind: "THANK-YOU", label: "Send thank-you" };
    case "Ask about referral":
      return { kind: "REFERRAL FOLLOW-UP", label: "Draft referral note" };
    case "Prep for meeting":
      return { kind: "meeting", label: "Prep for meeting" };
    default:
      return { kind: null, label: "" };
  }
}

/** Universal Contact Profile — same sheet from Contacts, Follow-ups, Conversations, Recommendations. */
export function ContactProfile({
  contact,
  notes,
  applications,
  formatPref,
  focusEventId = null,
  onClose,
  onUpdateContact,
  onChangeNotes,
  onSaveContact,
  onUnsaveContact,
  onChangeFormat,
  onMarkContacted,
}: {
  contact: NetworkContact;
  notes: NetworkNote[];
  applications: ApplicationRecord[];
  formatPref: CommunicationFormatPreference | null;
  focusEventId?: string | null;
  onClose: () => void;
  onUpdateContact: (next: NetworkContact) => void;
  onChangeNotes: (notes: NetworkNote[]) => void;
  onSaveContact: () => void;
  onUnsaveContact: () => void;
  onChangeFormat: () => void;
  onMarkContacted: () => void;
}) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const draftSectionRef = useRef<HTMLElement>(null);
  const notesSectionRef = useRef<HTMLElement>(null);
  const companyName =
    applications.find((a) => a.companyId === contact.companyId)?.company ??
    networkCompanies.find((c) => c.id === contact.companyId)?.name;
  const relatedApps = applications.filter((a) =>
    contact.relatedApplicationIds.includes(a.applicationId),
  );
  const contactNotes = notes.filter((n) => n.contactId === contact.id);

  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [eventPopup, setEventPopup] = useState<TimelineEvent | null>(null);
  const [noteEvent, setNoteEvent] = useState<NetworkNote | null>(null);
  const [savedDraftToast, setSavedDraftToast] = useState(false);
  const [showReferralEditor, setShowReferralEditor] = useState(false);

  useEffect(() => {
    setExpandedNoteId(null);
    setDraft(null);
    setShowMeeting(false);
    setShowAddTimeline(false);
    setEventPopup(null);
    setNoteEvent(null);
    if (focusEventId) {
      const ev = contact.timeline.find((e) => e.id === focusEventId);
      if (!ev) return;
      const linked = contactNotes.find((n) => n.relatedTimelineEventId === ev.id);
      if (linked && !ev.emailBody && !ev.meetingTime && !ev.type.includes("meeting")) {
        setExpandedNoteId(linked.id);
        setNoteEvent(linked);
      } else {
        setEventPopup(ev);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open focused event once per profile open
  }, [contact.id, focusEventId]);

  const openDraft = (kind: OutreachKind, scroll = false) => {
    setShowMeeting(false);
    onMarkContacted();
    setDraft(draftForContact(contact, kind, formatPref, applications));
    if (scroll) {
      window.setTimeout(() => {
        draftSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  const cta = nextActionCta(contact);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 p-0 sm:items-stretch sm:justify-end sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.aside
          role="dialog"
          aria-modal
          aria-label={`${contact.name} relationship`}
          onClick={(e) => e.stopPropagation()}
          initial={reduced ? false : { x: 48, y: 24, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { x: 40, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
          className="relative flex h-[96vh] w-full max-w-[560px] flex-col overflow-hidden border-2 border-ink bg-paper shadow-hard sm:h-auto sm:max-h-[calc(100vh-2rem)]"
        >
          <div className="relative border-b-2 border-ink bg-pink-wash px-5 py-5 sm:px-6">
            <Clip size={40} className="absolute -top-1 left-5" color="pink" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <RecruiterBadge
                  contactType={contact.contactType}
                  isCampusRecruiter={contact.isCampusRecruiter}
                />
                <h2 className="mt-3 font-display text-[clamp(1.8rem,5vw,2.4rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]">
                  {contact.name}
                </h2>
                <p className="mt-2 text-[1rem] text-ink-soft">
                  {contact.title}
                  {companyName ? ` · ${companyName}` : ""}
                </p>
                <p className="tag mt-2 text-ink-faint">
                  {[
                    contact.schoolRelationship,
                    contact.connectionDegree ? `${contact.connectionDegree}-degree` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <PinkHoverButton variant="close" onClick={onClose}>
                  Close
                </PinkHoverButton>
                {contact.isRecommended ? (
                  <PinkHoverButton variant="paper" onClick={onSaveContact}>
                    Save contact
                  </PinkHoverButton>
                ) : (
                  <PinkHoverButton variant="paper" onClick={onUnsaveContact}>
                    Unsave
                  </PinkHoverButton>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="tag border-2 border-ink bg-paper px-2 py-1 uppercase">
                {contact.relationshipStatus}
              </span>
              <NextActionBadge action={contact.nextAction} />
              <ReferralStamp status={contact.referralStatus} />
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <Sheet tone="paper" shadow="hard-sm" className="px-4 py-4">
              <p className="tag text-ink-faint">Related to</p>
              {relatedApps.length === 0 ? (
                <p className="mt-2 text-ink-soft">Company-wide relationship</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {relatedApps.map((app) => (
                    <li key={app.applicationId}>
                      <RelatedApplicationButton
                        company={app.company}
                        title={app.title}
                        status={app.currentStatus}
                        dateApplied={app.dateApplied}
                        onClick={() => {
                          onClose();
                          void navigate({
                            to: "/apply",
                            search: {
                              tab: "applied",
                              application: app.applicationId,
                            },
                          });
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Sheet>

            <Sheet tone="yellow" soft shadow="hard-sm" className="px-4 py-4">
              <p className="tag text-ink-faint">Next action</p>
              <p className="mt-2 font-display text-[1.55rem] font-black uppercase leading-none">
                {nextActionLabel(contact)}
              </p>
              {cta.kind && (
                <div className="mt-4">
                  <PinkHoverButton
                    variant="ink"
                    onClick={() => {
                      if (cta.kind === "meeting") setShowMeeting(true);
                      else if (cta.kind) openDraft(cta.kind, true);
                    }}
                  >
                    {cta.label}
                  </PinkHoverButton>
                </div>
              )}
            </Sheet>

            {contact.isRecommended && (
              <Sheet tone="pink" soft shadow="hard-sm" className="px-4 py-4">
                {contact.matchScore != null && (
                  <p className="font-display text-[1.3rem] font-black uppercase">
                    {contact.matchScore}% match
                  </p>
                )}
                <div className="mt-3">
                  <MatchReasons reasons={contact.matchReasons} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <PinkHoverButton variant="paper" onClick={onSaveContact}>
                    Save contact
                  </PinkHoverButton>
                  <PinkHoverButton variant="ink" onClick={() => openDraft("COLD OUTREACH", true)}>
                    Draft outreach
                  </PinkHoverButton>
                </div>
              </Sheet>
            )}

            {!contact.isRecommended && contact.matchReasons.length > 0 && (
              <section>
                <MatchReasons reasons={contact.matchReasons} />
              </section>
            )}

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="tag font-black text-ink">Timeline</p>
                {!showAddTimeline && (
                  <PinkHoverButton variant="paper" onClick={() => setShowAddTimeline(true)}>
                    Add to timeline
                  </PinkHoverButton>
                )}
              </div>
              {showAddTimeline && (
                <AddTimelineEvent
                  contact={contact}
                  onCancel={() => setShowAddTimeline(false)}
                  onAdd={(event, updates) => {
                    onUpdateContact({
                      ...contact,
                      ...updates,
                      timeline: [...contact.timeline, event],
                      lastContacted: event.date,
                      ...(event.type === "meeting-scheduled" || event.type === "meeting-completed"
                        ? { meetingDate: event.date }
                        : {}),
                      ...(event.type === "suggested-follow-up" || event.type === "follow-up"
                        ? { nextFollowUp: event.date }
                        : {}),
                    });
                    setShowAddTimeline(false);
                    setEventPopup(event);
                  }}
                />
              )}
              <div className="mt-3">
                <CommunicationTimeline
                  events={contact.timeline}
                  notes={contactNotes}
                  onViewEvent={setEventPopup}
                  onViewNote={(note) => {
                    setExpandedNoteId(note.id);
                    setNoteEvent(note);
                    notesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              </div>
            </section>

            <section ref={notesSectionRef}>
              <p className="tag font-black text-ink">Notes</p>
              <p className="mt-1 text-[0.9rem] text-ink-soft">
                Linked to this contact and related applications by ID for later Apply insights.
              </p>
              <div className="mt-3">
                <NotesTimeline
                  notes={contactNotes}
                  timeline={contact.timeline}
                  expandedId={expandedNoteId}
                  onToggle={setExpandedNoteId}
                  onChangeNote={(note) =>
                    onChangeNotes(notes.map((n) => (n.id === note.id ? note : n)))
                  }
                  onDeleteNote={(id) => onChangeNotes(notes.filter((n) => n.id !== id))}
                  onAddNote={() => {
                    const id = `nn-local-${Date.now()}`;
                    const today = new Date().toISOString().slice(0, 10);
                    const newest: NetworkNote = {
                      id,
                      contactId: contact.id,
                      companyId: contact.companyId,
                      relatedApplicationIds: contact.relatedApplicationIds,
                      learnedAt: today,
                      relatedTimelineEventId: contact.timeline.at(-1)?.id ?? null,
                      type: "GENERAL",
                      text: "",
                      createdAt: today,
                      useForApplicationMaterials: false,
                      useForInterviewPrep: false,
                    };
                    onChangeNotes([newest, ...notes]);
                    setExpandedNoteId(id);
                  }}
                />
              </div>
            </section>

            <section>
              <p className="tag font-black text-ink">Referral</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ReferralStamp status={contact.referralStatus} />
                <PinkHoverButton variant="paper" onClick={() => setShowReferralEditor((v) => !v)}>
                  Update status
                </PinkHoverButton>
              </div>
              {showReferralEditor && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {referralOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        onUpdateContact({ ...contact, referralStatus: status });
                        setShowReferralEditor(false);
                      }}
                      className={referralStatusClass(contact.referralStatus === status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section ref={draftSectionRef}>
              <p className="tag font-black text-ink">Draft outreach</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    "COLD OUTREACH",
                    "FOLLOW-UP",
                    "THANK-YOU",
                    "REFERRAL FOLLOW-UP",
                  ] as OutreachKind[]
                ).map((kind) => (
                  <PinkHoverButton key={kind} variant="paper" onClick={() => openDraft(kind, true)}>
                    {kind}
                  </PinkHoverButton>
                ))}
                {contact.meetingDate && (
                  <PinkHoverButton variant="paper" onClick={() => setShowMeeting(true)}>
                    Meeting prep
                  </PinkHoverButton>
                )}
              </div>
              {savedDraftToast && (
                <p className="tag mt-2 text-green">Draft saved locally for this session.</p>
              )}
            </section>

            {draft && (
              <div id="network-outreach-draft">
                <OutreachDraftPanel
                  draft={draft}
                  onClose={() => setDraft(null)}
                  onChangeFormat={onChangeFormat}
                  onSave={(d) => {
                    setDraft(d);
                    setSavedDraftToast(true);
                    onMarkContacted();
                    onUpdateContact({
                      ...contact,
                      isRecommended: false,
                      relationshipStatus:
                        contact.relationshipStatus === "Not contacted"
                          ? "Outreach drafted"
                          : contact.relationshipStatus,
                      nextAction:
                        contact.nextAction === "Draft intro" ? "Send intro" : contact.nextAction,
                    });
                  }}
                />
              </div>
            )}

            {showMeeting && (
              <MeetingPrep
                contact={contact}
                applications={relatedApps}
                onClose={() => setShowMeeting(false)}
                onComplete={({ notes: meetingNotes, referral, completed }) => {
                  if (meetingNotes.trim()) {
                    const today = new Date().toISOString().slice(0, 10);
                    const id = `nn-meet-${Date.now()}`;
                    onChangeNotes([
                      {
                        id,
                        contactId: contact.id,
                        companyId: contact.companyId,
                        relatedApplicationIds: contact.relatedApplicationIds,
                        learnedAt: today,
                        relatedTimelineEventId:
                          contact.timeline.find((e) => e.type.includes("meeting"))?.id ?? null,
                        type: "GENERAL",
                        text: meetingNotes,
                        createdAt: today,
                        useForApplicationMaterials: true,
                        useForInterviewPrep: true,
                      },
                      ...notes,
                    ]);
                    setExpandedNoteId(id);
                  }
                  onUpdateContact({
                    ...contact,
                    isRecommended: false,
                    referralStatus: referral,
                    notes: meetingNotes || contact.notes,
                    relationshipStatus: completed ? "Met" : contact.relationshipStatus,
                    nextAction: completed ? "Send thank-you" : contact.nextAction,
                  });
                }}
                onOpenThankYou={() => {
                  setShowMeeting(false);
                  openDraft("THANK-YOU", true);
                }}
              />
            )}
          </div>
        </motion.aside>
      </motion.div>

      <AnimatePresence>
        {eventPopup && (
          <MockPanel
            title={eventPopup.title}
            onClose={() => setEventPopup(null)}
            kicker={formatNetworkDate(eventPopup.date)}
          >
            <p className="tag uppercase">{eventPopup.type.replace(/-/g, " ")}</p>
            {eventPopup.detail && (
              <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft">
                {eventPopup.detail}
              </p>
            )}
            {eventPopup.meetingTime && (
              <p className="mt-3 font-black text-ink">
                {eventPopup.meetingTime}
                {eventPopup.type.includes("meeting") ? ` · with ${contact.name}` : ""}
              </p>
            )}
            {eventPopup.emailSubject && (
              <>
                <p className="tag mt-4 text-ink-faint">Subject</p>
                <p className="mt-1 font-display text-[1.1rem] font-black uppercase">
                  {eventPopup.emailSubject}
                </p>
              </>
            )}
            {eventPopup.emailBody && (
              <pre className="mt-4 whitespace-pre-wrap border-2 border-ink bg-paper-2 px-3 py-3 font-sans text-[0.95rem] leading-relaxed">
                {eventPopup.emailBody}
              </pre>
            )}
            {!eventPopup.detail &&
              !eventPopup.meetingTime &&
              !eventPopup.emailBody &&
              !eventPopup.emailSubject && (
                <p className="mt-3 text-ink-soft">No extra detail stored for this interaction yet.</p>
              )}
            <p className="tag mt-4 text-ink-faint">Mock event panel · not connected to email or calendar</p>
          </MockPanel>
        )}
        {noteEvent && (
          <MockPanel
            title="Note"
            onClose={() => setNoteEvent(null)}
            kicker={formatNetworkDate(noteEvent.learnedAt)}
          >
            <p className="tag uppercase">{noteEvent.type}</p>
            <p className="mt-3 text-[0.98rem] leading-relaxed">{noteEvent.text}</p>
            <p className="tag mt-4 text-ink-faint">
              Application materials: {noteEvent.useForApplicationMaterials ? "on" : "off"} ·
              Interview prep: {noteEvent.useForInterviewPrep ? "on" : "off"}
            </p>
          </MockPanel>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

/** @deprecated Use ContactProfile — kept as alias for existing imports. */
export const ContactDetail = ContactProfile;

const PALE_BLUE = "var(--blue-wash)";

function RelatedApplicationButton({
  company,
  title,
  status,
  dateApplied,
  onClick,
}: {
  company: string;
  title: string;
  status: string;
  dateApplied: string | null;
  onClick: () => void;
}) {
  const [hot, setHot] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      style={{ background: hot ? PALE_BLUE : "var(--paper)" }}
      className="focus-ink w-full border-2 border-ink px-3 py-3 text-left text-ink outline-none transition-[background-color] duration-150"
    >
      <span className="tag text-ink-faint">{company}</span>
      <span className="mt-1 block font-display text-[1.05rem] font-black uppercase leading-none">
        {title}
      </span>
      <span className="tag mt-2 block text-ink-soft">
        {status}
        {dateApplied ? ` · Applied ${formatShortDate(dateApplied)}` : ""}
      </span>
    </button>
  );
}

function MockPanel({
  title,
  kicker,
  children,
  onClose,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <Sheet tone="paper" shadow="hard" className="relative w-full max-w-lg px-5 py-5">
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <Tape className="-top-3 left-8" color="blue" angle={-4} width={90} height={20} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="tag text-ink-faint">{kicker}</p>
              <h3 className="mt-1 font-display text-[1.4rem] font-black uppercase">{title}</h3>
            </div>
            <PinkHoverButton variant="closeSm" onClick={onClose}>
              Close
            </PinkHoverButton>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </Sheet>
    </motion.div>
  );
}
