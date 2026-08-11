import { motion, useReducedMotion } from "motion/react";
import { Sheet, Tape } from "@/components/paper/Paper";
import { NextActionBadge, RecruiterBadge } from "@/components/network/Badges";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { formatNetworkDate } from "@/data/network";
import type { NetworkContact } from "@/types/network";

export function FollowUpQueue({
  contacts,
  onOpen,
  onSnooze,
  onDismiss,
  onDraft,
}: {
  contacts: NetworkContact[];
  onOpen: (id: string) => void;
  onSnooze: (id: string) => void;
  onDismiss: (id: string) => void;
  onDraft: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const actionable = contacts.filter(
    (c) =>
      c.nextAction === "Follow up" ||
      c.nextAction === "Prep for meeting" ||
      c.nextAction === "Send thank-you" ||
      c.nextAction === "Send intro" ||
      c.nextAction === "Draft intro" ||
      c.nextAction === "Ask about referral",
  );

  return (
    <div>
      <Sheet tone="pink" soft shadow="hard-sm" className="relative mb-6 px-4 py-4">
        <Tape className="-top-3 left-6" color="yellow" angle={-6} width={96} height={20} />
        <p className="tag text-ink-faint">Next up</p>
        <p className="mt-1 font-display text-[1.8rem] font-black uppercase leading-none">
          {actionable.length} contacts need action
        </p>
      </Sheet>

      {actionable.length === 0 && (
        <p className="border-2 border-dashed border-ink/40 bg-paper px-4 py-8 text-ink-soft">
          Nothing queued for this company filter. Switch companies or clear the application filter.
        </p>
      )}

      <ul className="space-y-3">
        {actionable.map((contact, i) => (
          <motion.li
            key={contact.id}
            initial={reduced ? false : { opacity: 0, y: 18, rotate: i % 2 === 0 ? -0.8 : 0.8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: i * 0.04, duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <Sheet tone="paper" shadow="hard-sm" className="relative px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <RecruiterBadge
                    contactType={contact.contactType}
                    isCampusRecruiter={contact.isCampusRecruiter}
                  />
                  <button
                    type="button"
                    onClick={() => onOpen(contact.id)}
                    className="focus-ink mt-2 block text-left outline-none"
                  >
                    <span className="font-display text-[1.25rem] font-black uppercase leading-none">
                      {contact.name}
                    </span>
                  </button>
                  <p className="mt-1 text-[0.92rem] text-ink-soft">{contact.title}</p>
                  <p className="tag mt-2 text-ink-faint">
                    {contact.nextFollowUp
                      ? `Follow-up ${formatNetworkDate(contact.nextFollowUp)}`
                      : contact.meetingDate
                        ? `Meeting ${formatNetworkDate(contact.meetingDate)}`
                        : contact.relationshipStatus}
                  </p>
                </div>
                <NextActionBadge action={contact.nextAction} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <PinkHoverButton variant="ink" onClick={() => onDraft(contact.id)}>
                  {contact.nextAction === "Prep for meeting"
                    ? "Prep for meeting"
                    : contact.nextAction === "Send thank-you"
                      ? "Draft thank-you"
                      : "Draft follow-up"}
                </PinkHoverButton>
                <PinkHoverButton variant="paper" onClick={() => onOpen(contact.id)}>
                  Open
                </PinkHoverButton>
                <PinkHoverButton variant="paper" onClick={() => onSnooze(contact.id)}>
                  Snooze
                </PinkHoverButton>
                <PinkHoverButton variant="paper" onClick={() => onDismiss(contact.id)}>
                  No follow-up needed
                </PinkHoverButton>
              </div>
            </Sheet>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
