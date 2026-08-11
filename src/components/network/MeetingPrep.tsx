import { Sheet, Tape } from "@/components/paper/Paper";
import { formatNetworkDate } from "@/data/network";
import type { NetworkContact, ReferralStatus } from "@/types/network";
import type { ApplicationRecord } from "@/lib/apply/types";
import { CommunicationTimeline } from "@/components/network/CommunicationTimeline";
import { referralStatusClass } from "@/components/network/networkUi";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { useState } from "react";

const referralChoices: ReferralStatus[] = [
  "NOT DISCUSSED",
  "MAYBE",
  "OFFERED",
  "REQUESTED",
  "SUBMITTED",
  "DECLINED",
  "NOT APPLICABLE",
];

export function MeetingPrep({
  contact,
  applications,
  onClose,
  onComplete,
  onOpenThankYou,
}: {
  contact: NetworkContact;
  applications: ApplicationRecord[];
  onClose: () => void;
  onComplete: (payload: { notes: string; referral: ReferralStatus; completed: boolean }) => void;
  onOpenThankYou: () => void;
}) {
  const related = applications.filter((a) =>
    contact.relatedApplicationIds.includes(a.applicationId),
  );
  const [questions, setQuestions] = useState(
    "1. How does the intern pod ship work?\n2. What makes a strong PM intern here?\n3. What should I emphasize in my application?",
  );
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(contact.relationshipStatus === "Met");
  const [referral, setReferral] = useState<ReferralStatus>(contact.referralStatus);

  return (
    <Sheet
      tone="yellow"
      soft
      pattern="grid-fine"
      shadow="hard"
      className="relative px-5 py-5 sm:px-6"
    >
      <Tape className="-top-3 right-8" color="pink" angle={6} width={100} height={22} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tag text-ink-faint">Meeting with</p>
          <h3 className="mt-1 font-display text-[1.55rem] font-black uppercase leading-none">
            {contact.name}
          </h3>
          <p className="mt-2 text-ink-soft">
            {contact.title} · {formatNetworkDate(contact.meetingDate ?? "2026-08-12")}
          </p>
        </div>
        <PinkHoverButton variant="closeSm" onClick={onClose}>
          Close
        </PinkHoverButton>
      </div>

      <div className="mt-5 border-2 border-ink bg-paper px-4 py-3">
        <p className="tag text-ink-faint">Related application</p>
        <p className="mt-1 font-display text-[1.05rem] font-black uppercase">
          {related.map((a) => a.title).join(" · ") || "Company-wide"}
        </p>
      </div>

      <div className="mt-5">
        <p className="tag font-black text-ink">Previous communication</p>
        <div className="mt-3">
          <CommunicationTimeline events={contact.timeline.slice(-3)} />
        </div>
      </div>

      <label className="mt-5 block">
        <span className="tag font-black text-ink">Questions to ask</span>
        <textarea
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-y border-2 border-ink bg-paper px-3 py-2 outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="tag font-black text-ink">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Capture what you heard. Mark insights later for application materials."
          className="mt-2 w-full resize-y border-2 border-ink bg-paper px-3 py-2 outline-none"
        />
      </label>

      {!completed ? (
        <PinkHoverButton
          variant="ink"
          className="mt-5 px-4 py-3 text-sm"
          onClick={() => {
            setCompleted(true);
            onComplete({ notes, referral, completed: true });
          }}
        >
          Meeting complete
        </PinkHoverButton>
      ) : (
        <div className="mt-5 space-y-4 border-2 border-ink bg-paper px-4 py-4">
          <p className="font-display text-[1.2rem] font-black uppercase">Meeting complete</p>
          <div>
            <p className="tag text-ink-faint">Referral offered?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["OFFERED", "MAYBE", "DECLINED"] as ReferralStatus[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReferral(r);
                    onComplete({ notes, referral: r, completed: true });
                  }}
                  className={referralStatusClass(referral === r)}
                >
                  {r === "OFFERED" ? "Yes" : r === "MAYBE" ? "Maybe" : "No"}
                </button>
              ))}
            </div>
            <p className="tag mt-2 text-ink-faint">Full status: {referralChoices.join(" · ")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PinkHoverButton
              variant="paper"
              className="px-4 py-2 text-sm"
              onClick={() => onComplete({ notes, referral, completed: true })}
            >
              Add notes
            </PinkHoverButton>
            <PinkHoverButton variant="ink" className="px-4 py-2 text-sm" onClick={onOpenThankYou}>
              Send thank-you
            </PinkHoverButton>
          </div>
        </div>
      )}
    </Sheet>
  );
}
