import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clip, Sheet, Tape } from "@/components/paper/Paper";
import { ApplicationProgress } from "@/components/apply/ApplicationProgress";
import { NetworkingSuggestions } from "@/components/apply/NetworkingSuggestions";
import { NetworkInsightsPanel } from "@/components/apply/NetworkInsightsPanel";
import { formatShortDate } from "@/data/apply";
import { useRecruiting } from "@/components/recruiting/useRecruiting";
import {
  notesForApplicationMaterials,
  referralContactsForApplication,
} from "@/lib/recruiting/selectors";
import { cn } from "@/lib/utils";
import type { ApplicationLifecycleStatus, ApplicationRecord } from "@/lib/apply/types";
import type { ProgressStage, ToneName } from "@/types/apply";
import { APPLICATION_STATUSES } from "@/lib/apply/types";

const statusStyle: Record<ApplicationLifecycleStatus, string> = {
  Saved: "bg-paper-2 text-ink",
  Preparing: "bg-yellow-wash text-ink",
  Applied: "bg-blue text-paper",
  Waiting: "bg-yellow text-ink",
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
}: {
  app: ApplicationRecord;
  postedDate?: string | null;
  deadline?: string | null;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: ApplicationLifecycleStatus) => void;
}) {
  const reduced = useReducedMotion();
  const tone = cardTone(app.tone);
  const progress = toProgress(app);
  const { notes, contacts } = useRecruiting();
  const insights = notesForApplicationMaterials(notes, app.applicationId).map((note) => ({
    note,
    contact: contacts.find((c) => c.id === note.contactId),
  }));
  const referrals = referralContactsForApplication(contacts, app.applicationId);

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
              {" · "}
              Resume: none yet
            </p>
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

                <h4 className="font-display text-[1.05rem] font-black uppercase">Materials used</h4>
                <ul className="mt-2 space-y-1 text-[0.95rem] text-ink-soft">
                  <li>Resume: {app.resumeUsed ?? "None attached yet"}</li>
                  <li>Cover letter: {app.coverLetterUsed ?? "None attached yet"}</li>
                </ul>

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
                <p className="tag mt-1 text-ink-faint">Saved locally on this device</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {APPLICATION_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onStatusChange(s)}
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

                <NetworkInsightsPanel insights={insights} />
                <NetworkingSuggestions application={app} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>
    </motion.article>
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
