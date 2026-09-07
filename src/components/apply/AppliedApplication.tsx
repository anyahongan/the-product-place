import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePageDraft } from "@/hooks/usePageDraft";
import { Clip, Sheet, Tape } from "@/components/paper/Paper";
import { ApplicationProgress } from "@/components/apply/ApplicationProgress";
import { NetworkingSuggestions } from "@/components/apply/NetworkingSuggestions";
import { NetworkInsightsPanel } from "@/components/apply/NetworkInsightsPanel";
import {
  ApplicationMaterialsChecklist,
  materialsRequiredSummary,
} from "@/components/apply/ApplicationMaterialsChecklist";
import { OnlineAssessmentModal } from "@/components/apply/OnlineAssessmentModal";
import { OpenOnlineAssessmentsPanel } from "@/components/apply/OpenOnlineAssessmentsPanel";
import { formatShortDate } from "@/data/apply";
import { getOnlineAssessmentGuide } from "@/lib/apply/onlineAssessmentGuides";
import { isOpenOnlineAssessment } from "@/lib/apply/openOnlineAssessments";
import { useRecruiting } from "@/components/recruiting/useRecruiting";
import {
  notesForApplicationMaterials,
  referralContactsForApplication,
} from "@/lib/recruiting/selectors";
import { cn } from "@/lib/utils";
import type {
  ApplicationLifecycleStatus,
  ApplicationRecord,
  OnlineAssessmentState,
} from "@/lib/apply/types";
import type { ProgressStage, ToneName } from "@/types/apply";
import { APPLICATION_STATUSES } from "@/lib/apply/types";

const statusStyle: Record<ApplicationLifecycleStatus, string> = {
  Saved: "bg-paper-2 text-ink",
  Preparing: "bg-yellow-wash text-ink",
  Applied: "bg-blue text-paper",
  Waiting: "bg-yellow text-ink",
  "Online Assessment": "bg-purple text-paper",
  "Recruiter Screen": "bg-green text-paper",
  Interviewing: "bg-purple text-paper",
  "Final Round": "bg-purple text-paper",
  Offer: "bg-green text-paper",
  Rejected: "bg-ink text-paper",
  Withdrawn: "bg-paper-2 text-ink",
};

function cardTone(tone: ToneName): Exclude<ToneName, "pink"> {
  return tone === "pink" ? "blue" : tone;
}

function toProgress(app: ApplicationRecord): {
  current: ProgressStage;
  reached: ProgressStage[];
} {
  const map: Record<ApplicationLifecycleStatus, ProgressStage> = {
    Saved: "Submitted",
    Preparing: "Submitted",
    Applied: "Submitted",
    Waiting: "Submitted",
    "Online Assessment": "Submitted",
    "Recruiter Screen": "Recruiter Screen",
    Interviewing: "Interview",
    "Final Round": "Final",
    Offer: "Offer",
    Rejected: "Submitted",
    Withdrawn: "Submitted",
  };
  const order: ProgressStage[] = ["Submitted", "Recruiter Screen", "Interview", "Final", "Offer"];
  const current = map[app.currentStatus];
  const idx = order.indexOf(current);
  return { current, reached: order.slice(0, Math.max(idx + 1, 1)) };
}

export function AppliedApplicationCard({
  app,
  postedDate,
  deadline,
  expanded,
  onToggle,
  onStatusChange,
  onUpdateApplication,
  onDelete,
  openOaOnMount,
  onOaModalOpened,
}: {
  app: ApplicationRecord;
  postedDate?: string | null;
  deadline?: string | null;
  expanded: boolean;
  openOaOnMount?: boolean;
  onOaModalOpened?: () => void;
  onToggle: () => void;
  onStatusChange: (status: ApplicationLifecycleStatus) => void;
  onUpdateApplication: (
    patch: Partial<
      Pick<ApplicationRecord, "materialsRequired" | "onlineAssessment" | "experienceNotes">
    >,
  ) => void;
  onDelete: () => void;
}) {
  const reduced = useReducedMotion();
  const tone = cardTone(app.tone);
  const progress = toProgress(app);
  const { notes, contacts } = useRecruiting();
  const [oaOpen, setOaOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notesDraft, setNotesDraft, clearNotesDraft] = usePageDraft(
    `apply:notes:${app.applicationId}`,
    app.experienceNotes,
  );
  const materialsSummary = materialsRequiredSummary(app.materialsRequired);
  const showOaPrep =
    isOpenOnlineAssessment(app) || app.currentStatus === "Online Assessment";
  const oaGuide = getOnlineAssessmentGuide(app.company);

  useEffect(() => {
    setNotesDraft((prev) => (prev === app.experienceNotes ? prev : prev || app.experienceNotes));
  }, [app.applicationId, app.experienceNotes, setNotesDraft]);

  useEffect(() => {
    if (!openOaOnMount) return;
    setOaOpen(true);
    onOaModalOpened?.();
  }, [openOaOnMount, onOaModalOpened]);

  useEffect(() => {
    if (!expanded) setConfirmDelete(false);
  }, [expanded]);

  const insights = notesForApplicationMaterials(notes, app.applicationId).map((note) => ({
    note,
    contact: contacts.find((c) => c.id === note.contactId),
  }));
  const referrals = referralContactsForApplication(contacts, app.applicationId);

  const handleStatusClick = (status: ApplicationLifecycleStatus) => {
    if (status === "Online Assessment") {
      setOaOpen(true);
      return;
    }
    onStatusChange(status);
  };

  const saveOnlineAssessment = (oa: OnlineAssessmentState, setStatus: boolean) => {
    onUpdateApplication({ onlineAssessment: oa });
    if (setStatus) onStatusChange("Online Assessment");
  };

  return (
    <motion.article
      layout={!reduced}
      className="relative"
      transition={{ duration: 0.2, ease: [0.2, 0.9, 0.2, 1] }}
    >
      <Sheet
        tone={tone}
        soft
        shadow="hard-sm"
        edge="corner-cut"
        className="relative px-5 py-5 sm:px-7"
      >
        <Tape className="-left-3 top-6" color={tone} angle={-88} width={52} height={22} />

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="focus-ink grid w-full gap-3 text-left outline-none sm:grid-cols-[1fr_auto] sm:items-start"
        >
          <div>
            <h3 className="font-display text-[1.4rem] font-black sm:text-[1.7rem]">
              {app.company}
            </h3>
            <p className="mt-1 text-[0.98rem] text-ink-soft">{app.title}</p>
            {(postedDate || deadline) && (
              <p className="tag mt-2 text-ink-faint">
                {postedDate ? `Posted ${formatShortDate(postedDate)}` : "Posted date unknown"}
                {deadline ? ` · Due ${formatShortDate(deadline)}` : ""}
              </p>
            )}
            <p className="tag mt-2 text-ink-faint">
              {app.dateApplied
                ? `Applied ${formatShortDate(app.dateApplied)}`
                : "Not marked applied yet"}
              {materialsSummary ? ` · Asked: ${materialsSummary}` : ""}
            </p>
            {app.onlineAssessment.dueDate && !app.onlineAssessment.completed && (
              <p className="tag mt-2 text-purple">OA due {formatShortDate(app.onlineAssessment.dueDate)}</p>
            )}
            {referrals[0] && (
              <p className="tag mt-2 uppercase text-ink">
                Referral · {referrals[0].referralStatus} · {referrals[0].name}
              </p>
            )}
          </div>
          <span
            className={cn(
              "tag w-max border-2 border-ink px-2 py-1 uppercase",
              statusStyle[app.currentStatus],
            )}
          >
            {app.currentStatus}
          </span>
        </button>

        <div className="mt-4">
          <ApplicationProgress current={progress.current} reached={progress.reached} />
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0.9, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="relative mt-6 border-t-2 border-ink pt-5">
                <Clip className="absolute -top-8 right-4" size={44} color="blue" angle={-6} />

                <h4 className="font-display text-[1.05rem] font-black uppercase">
                  Application checklist
                </h4>
                <ApplicationMaterialsChecklist
                  value={app.materialsRequired}
                  onChange={(materialsRequired) => onUpdateApplication({ materialsRequired })}
                />

                {showOaPrep && (
                  <div className="mt-5 border-2 border-ink bg-purple/10 px-4 py-4">
                    <h4 className="font-display text-[1.05rem] font-black uppercase">
                      Online assessment prep
                    </h4>
                    <p className="tag mt-1 text-ink-faint">{oaGuide.oaType}</p>
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
                      Company-specific OA prompts — product scenarios, metrics, written responses,
                      and work-style items modeled on reported formats.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to="/practice"
                        search={{
                          mode: "oa",
                          company: app.company,
                          appId: app.applicationId,
                          oa: "1",
                        }}
                        className="focus-ink border-2 border-ink bg-yellow px-3 py-2 font-display text-xs font-black uppercase text-ink outline-none hover:bg-ink hover:text-paper"
                      >
                        OA prep →
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOaOpen(true)}
                        className="focus-ink border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-black uppercase text-ink outline-none hover:bg-blue-wash"
                      >
                        Guidance & due date
                      </button>
                    </div>
                  </div>
                )}

                {(app.applyUrl || app.sourceUrl) && (
                  <div className="mt-5">
                    <h4 className="font-display text-[1.05rem] font-black uppercase">
                      Original link
                    </h4>
                    <a
                      href={app.applyUrl || app.sourceUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tag mt-2 inline-block text-blue underline-offset-2 hover:underline"
                    >
                      Open application / source →
                    </a>
                  </div>
                )}

                <h4 className="mt-5 font-display text-[1.05rem] font-black uppercase">
                  Status history
                </h4>
                <ol className="mt-2 space-y-2">
                  {app.statusHistory.map((h, i) => (
                    <li
                      key={`${h.status}-${h.timestamp}-${i}`}
                      className="flex gap-3 text-[0.92rem]"
                    >
                      <span className="tag shrink-0 text-ink-faint">
                        {formatShortDate(h.timestamp.slice(0, 10))}
                      </span>
                      <span className="text-ink-soft">{h.status}</span>
                    </li>
                  ))}
                </ol>

                <h4 className="mt-5 font-display text-[1.05rem] font-black uppercase">
                  Update status
                </h4>
                <p className="tag mt-1 text-ink-faint">
                  Online Assessment opens guidance, due-date tracking, and practice prep.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {APPLICATION_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusClick(s)}
                      aria-pressed={app.currentStatus === s}
                      className={cn(
                        "focus-ink tag border-2 border-ink px-2.5 py-1.5 uppercase outline-none",
                        app.currentStatus === s ? statusStyle[s] : "bg-paper hover:bg-blue-wash",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <h4 className="mt-5 font-display text-[1.05rem] font-black uppercase">
                  Your notes
                </h4>
                <p className="tag mt-1 text-ink-faint">
                  Capture what happened — OA format, interview vibes, follow-ups.
                </p>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={() => {
                    if (notesDraft !== app.experienceNotes) {
                      onUpdateApplication({ experienceNotes: notesDraft });
                      clearNotesDraft();
                    }
                  }}
                  rows={5}
                  placeholder="Example: OA was 90 min product scenarios + work style. Recruiter follow-up in 5 days…"
                  className="focus-ink mt-2 w-full resize-y border-2 border-ink bg-paper px-3 py-2 text-[0.92rem] text-ink outline-none placeholder:text-ink-faint"
                />

                <NetworkInsightsPanel insights={insights} />
                <NetworkingSuggestions application={app} />

                <div className="mt-8 border-t-2 border-ink/15 pt-5">
                  <h4 className="font-display text-[1.05rem] font-black uppercase">
                    Remove application
                  </h4>
                  <p className="tag mt-1 text-ink-faint">
                    Permanently delete {app.company} · {app.title} from your tracker.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {confirmDelete ? (
                      <>
                        <span className="tag text-ink">Remove this application?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDelete();
                            setConfirmDelete(false);
                          }}
                          className="focus-ink tag border-2 border-ink bg-ink px-2.5 py-1.5 uppercase text-paper outline-none"
                        >
                          Yes, remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="focus-ink tag border-2 border-ink bg-paper px-2.5 py-1.5 uppercase text-ink outline-none hover:bg-blue-wash"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="focus-ink tag border-2 border-ink bg-paper px-2.5 py-1.5 uppercase text-ink outline-none hover:bg-yellow-wash"
                      >
                        Remove from tracker
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>

      <OnlineAssessmentModal
        app={app}
        open={oaOpen}
        onClose={() => setOaOpen(false)}
        onSave={saveOnlineAssessment}
      />
    </motion.article>
  );
}

export function AppliedApplicationListEditor({
  apps,
  onUpdate,
  onStatusChange,
  onDelete,
}: {
  apps: ApplicationRecord[];
  onUpdate: (
    applicationId: string,
    patch: Partial<Pick<ApplicationRecord, "company" | "title" | "dateApplied">>,
  ) => void;
  onStatusChange: (applicationId: string, status: ApplicationLifecycleStatus) => void;
  onDelete: (applicationId: string) => void;
}) {
  return (
    <Sheet tone="paper-2" shadow="hard-sm" className="overflow-hidden">
      <div className="border-b-2 border-ink/15 px-4 py-3 sm:px-5">
        <p className="font-display text-sm font-black uppercase">Edit application list</p>
        <p className="tag mt-1 text-ink-faint">
          Update company, role, status, or date applied. Changes save when you leave a field.
        </p>
      </div>
      <ul className="divide-y-2 divide-ink/10">
        {apps.map((app) => (
          <AppliedApplicationEditRow
            key={app.applicationId}
            app={app}
            onUpdate={(patch) => onUpdate(app.applicationId, patch)}
            onStatusChange={(status) => onStatusChange(app.applicationId, status)}
            onDelete={() => onDelete(app.applicationId)}
          />
        ))}
      </ul>
    </Sheet>
  );
}

function AppliedApplicationEditRow({
  app,
  onUpdate,
  onStatusChange,
  onDelete,
}: {
  app: ApplicationRecord;
  onUpdate: (patch: Partial<Pick<ApplicationRecord, "company" | "title" | "dateApplied">>) => void;
  onStatusChange: (status: ApplicationLifecycleStatus) => void;
  onDelete: () => void;
}) {
  const [company, setCompany] = useState(app.company);
  const [title, setTitle] = useState(app.title);
  const [dateApplied, setDateApplied] = useState(app.dateApplied ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setCompany(app.company);
    setTitle(app.title);
    setDateApplied(app.dateApplied ?? "");
  }, [app.applicationId, app.company, app.title, app.dateApplied]);

  const fieldClass =
    "focus-ink w-full min-w-0 border-2 border-ink/20 bg-paper px-2 py-1.5 text-[0.9rem] outline-none focus:border-ink";

  return (
    <li className="grid gap-3 px-4 py-3 sm:grid-cols-[1.2fr_1.4fr_0.9fr_0.8fr_auto] sm:items-center sm:px-5">
      <label className="min-w-0">
        <span className="tag mb-1 block text-ink-faint sm:hidden">Company</span>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          onBlur={() => {
            if (company.trim() && company !== app.company) onUpdate({ company: company.trim() });
          }}
          className={fieldClass}
        />
      </label>
      <label className="min-w-0">
        <span className="tag mb-1 block text-ink-faint sm:hidden">Role</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() && title !== app.title) onUpdate({ title: title.trim() });
          }}
          className={fieldClass}
        />
      </label>
      <label className="min-w-0">
        <span className="tag mb-1 block text-ink-faint sm:hidden">Status</span>
        <select
          value={app.currentStatus}
          onChange={(e) => onStatusChange(e.target.value as ApplicationLifecycleStatus)}
          className={fieldClass}
        >
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0">
        <span className="tag mb-1 block text-ink-faint sm:hidden">Applied</span>
        <input
          type="date"
          value={dateApplied}
          onChange={(e) => setDateApplied(e.target.value)}
          onBlur={() => {
            const next = dateApplied || null;
            if (next !== app.dateApplied) onUpdate({ dateApplied: next });
          }}
          className={fieldClass}
        />
      </label>
      <div className="flex shrink-0 items-center justify-end gap-1">
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
              className="focus-ink tag border-2 border-ink bg-ink px-2 py-1 uppercase text-paper outline-none"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="focus-ink tag border-2 border-ink px-2 py-1 uppercase text-ink outline-none hover:bg-blue-wash"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="focus-ink tag border-2 border-ink px-2 py-1 uppercase text-ink outline-none hover:bg-yellow-wash"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

export function AppliedStatusFilters({
  value,
  onChange,
  counts,
}: {
  value: "all" | ApplicationLifecycleStatus;
  onChange: (v: "all" | ApplicationLifecycleStatus) => void;
  counts: Record<"all" | ApplicationLifecycleStatus, number>;
}) {
  const options: { id: "all" | ApplicationLifecycleStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "Waiting", label: "Waiting" },
    { id: "Applied", label: "Applied" },
    { id: "Online Assessment", label: "OA" },
    { id: "Interviewing", label: "Interviewing" },
    { id: "Offer", label: "Offers" },
    { id: "Rejected", label: "Rejected" },
    { id: "Withdrawn", label: "Withdrawn" },
  ];

  return (
    <div role="tablist" aria-label="Applied status filters" className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "focus-ink border-2 border-ink px-3 py-2 font-display text-sm font-black uppercase outline-none",
              active ? "bg-blue text-paper" : "bg-paper hover:bg-yellow-wash",
            )}
          >
            {opt.label}
            <span className={cn("tag ml-2", active ? "text-paper/80" : "text-ink-faint")}>
              {counts[opt.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
