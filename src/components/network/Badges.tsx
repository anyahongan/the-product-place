import { cn } from "@/lib/utils";
import type { ContactType, NextAction, ReferralStatus } from "@/types/network";

export function RecruiterBadge({
  contactType,
  isCampusRecruiter,
}: {
  contactType: ContactType;
  isCampusRecruiter: boolean;
}) {
  if (isCampusRecruiter || contactType === "CAMPUS RECRUITER") {
    return (
      <span className="tag inline-flex items-center gap-1 border-2 border-ink bg-pink px-2 py-1 font-black uppercase text-paper">
        <span aria-hidden>★</span> Campus Recruiter
      </span>
    );
  }
  if (contactType === "RECRUITER") {
    return (
      <span className="tag inline-flex items-center gap-1 border-2 border-ink bg-pink px-2 py-1 font-black uppercase text-paper">
        Recruiter
      </span>
    );
  }
  return (
    <span className="tag border-2 border-ink bg-paper px-2 py-1 uppercase text-ink">
      {contactType}
    </span>
  );
}

export function NextActionBadge({ action }: { action: NextAction }) {
  const hot =
    action === "Follow up" ||
    action === "Send thank-you" ||
    action === "Prep for meeting" ||
    action === "Send intro" ||
    action === "Draft intro";
  return (
    <span
      className={cn(
        "tag border-2 border-ink px-2 py-1 font-black uppercase",
        hot ? "bg-yellow text-ink" : "bg-paper text-ink-soft",
      )}
    >
      {action}
    </span>
  );
}

export function ReferralStamp({ status }: { status: ReferralStatus }) {
  return (
    <span className="tag border-2 border-ink bg-paper-2 px-2 py-1 font-black uppercase tracking-wide">
      Referral · {status}
    </span>
  );
}
