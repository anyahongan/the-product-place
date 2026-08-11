import { Sheet, Clip } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { NextActionBadge, RecruiterBadge } from "@/components/network/Badges";
import { netBtn } from "@/components/network/networkUi";
import { formatNetworkDate } from "@/data/network";
import type { NetworkContact } from "@/types/network";
import { cn } from "@/lib/utils";

export function ContactCard({
  contact,
  index = 0,
  onOpen,
  recommended = false,
}: {
  contact: NetworkContact;
  index?: number;
  onOpen: (id: string) => void;
  recommended?: boolean;
}) {
  return (
    <Reveal
      from="up"
      delay={Math.min(index * 0.05, 0.35)}
      distance={40}
      rotate={index % 2 === 0 ? -0.6 : 0.6}
    >
      <button
        type="button"
        onClick={() => onOpen(contact.id)}
        className="focus-ink group block w-full text-left outline-none"
      >
        <Sheet
          tone={recommended ? "pink" : "paper"}
          soft
          pattern="none"
          shadow="hard-sm"
          className={cn(
            "relative px-4 py-4 transition-[transform,box-shadow] group-hover:-translate-y-0.5 group-hover:shadow-hard",
            "text-ink",
          )}
        >
          <Clip size={34} className="absolute -top-2 right-3 opacity-90" />
          <div className="flex flex-wrap items-start justify-between gap-2 pr-6">
            <RecruiterBadge
              contactType={contact.contactType}
              isCampusRecruiter={contact.isCampusRecruiter}
            />
            <NextActionBadge action={contact.nextAction} />
          </div>
          <h3 className="mt-3 font-display text-[1.35rem] font-black uppercase leading-[0.95] tracking-[-0.03em]">
            {contact.name}
          </h3>
          <p className="mt-1 text-[0.95rem] text-ink-soft">{contact.title}</p>
          {recommended && contact.matchScore != null && (
            <p className="mt-3 font-display text-[1.15rem] font-black uppercase text-ink">
              {contact.matchScore}% match
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {contact.connectionDegree && (
              <span className={netBtn.metaChip}>{contact.connectionDegree}-degree</span>
            )}
            {contact.schoolRelationship && (
              <span className="tag border-2 border-ink bg-pink-wash px-2 py-1 uppercase text-ink">
                {contact.schoolRelationship}
              </span>
            )}
            {!contact.connectionDegree && !contact.schoolRelationship && contact.title && (
              <span className={netBtn.metaChip}>{contact.contactType}</span>
            )}
          </div>
          {!recommended && contact.lastContacted && (
            <p className="tag mt-3 text-ink-faint">
              Last contacted {formatNetworkDate(contact.lastContacted)}
            </p>
          )}
          {!recommended && contact.meetingDate && (
            <p className="tag mt-1 font-black text-ink">
              Meeting {formatNetworkDate(contact.meetingDate)}
            </p>
          )}
        </Sheet>
      </button>
    </Reveal>
  );
}
