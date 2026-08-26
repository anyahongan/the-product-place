import { motion, useReducedMotion } from "motion/react";
import { Sheet } from "@/components/paper/Paper";
import { formatNetworkDate, networkCompanies } from "@/data/network";
import type { NetworkContact, TimelineEvent } from "@/types/network";
import type { Tone } from "@/components/paper/Paper";
import { ContactLinkedInLink } from "@/components/network/ContactLinkedInLink";
import { normalizeLinkedInUrl } from "@/lib/network/linkedinUrl";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";

type ConversationRow = {
  contact: NetworkContact;
  event: TimelineEvent;
};

const pattern: Array<{ tone: Tone; soft: boolean }> = [
  { tone: "pink", soft: true },
  { tone: "paper", soft: false },
  { tone: "yellow", soft: true },
];

export function ConversationsView({
  contacts,
  onOpenContact,
  onOpenEvent,
}: {
  contacts: NetworkContact[];
  onOpenContact: (id: string) => void;
  onOpenEvent: (contactId: string, eventId: string) => void;
}) {
  const reduced = useReducedMotion();
  const rows: ConversationRow[] = contacts
    .flatMap((contact) => contact.timeline.map((event) => ({ contact, event })))
    .sort((a, b) => b.event.date.localeCompare(a.event.date));

  return (
    <div>
      <p className="tag text-ink-faint">Conversation trail</p>
      <h2 className="mt-1 font-display text-[1.8rem] font-black uppercase leading-none">
        Historical interactions
      </h2>
      <p className="mt-3 max-w-xl text-[0.98rem] text-ink-soft">
        Chronological history across this company. Click a name for the person, or an event for
        details.
      </p>

      {rows.length === 0 && (
        <p className="mt-6 border-2 border-dashed border-ink/40 bg-paper px-4 py-8 text-ink-soft">
          No conversations for this filter yet.
        </p>
      )}

      <ol className="relative mt-6 space-y-3 border-l-2 border-ink pl-5">
        {rows.map(({ contact, event }, i) => {
          const company = networkCompanies.find((c) => c.id === contact.companyId)?.name;
          const swatch = pattern[i % pattern.length]!;
          return (
            <motion.li
              key={`${contact.id}-${event.id}`}
              initial={reduced ? false : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: Math.min(i * 0.03, 0.4),
                duration: 0.24,
                ease: [0.2, 0.9, 0.2, 1],
              }}
            >
              <Sheet
                tone={swatch.tone}
                soft={swatch.soft}
                shadow="hard-sm"
                className="px-4 py-3 text-ink"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="tag font-black uppercase">{formatNetworkDate(event.date)}</p>
                  <p className="tag text-ink-faint">{company}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenEvent(contact.id, event.id)}
                  className="focus-ink mt-1 block text-left outline-none"
                >
                  <span className="font-display text-[1.1rem] font-black uppercase leading-none text-ink underline-offset-2 hover:underline">
                    {event.title}
                  </span>
                </button>
                <p className="mt-2 text-[0.95rem] text-ink-soft">
                  {normalizeLinkedInUrl(contact.linkedinUrl) ? (
                    <a
                      href={normalizeLinkedInUrl(contact.linkedinUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ink font-black uppercase outline-none hover:underline"
                    >
                      {contact.name}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenContact(contact.id)}
                      className="focus-ink font-black uppercase outline-none hover:text-pink"
                    >
                      {contact.name}
                    </button>
                  )}
                  <span> · {contact.title}</span>
                </p>
                <ContactLinkedInLink url={contact.linkedinUrl} className="mt-2" size="xs" />
                {event.detail && (
                  <p className="mt-1 text-[0.9rem] text-ink-faint">{event.detail}</p>
                )}
                <div className="mt-3">
                  <PinkHoverButton variant="tag" onClick={() => onOpenEvent(contact.id, event.id)}>
                    View event →
                  </PinkHoverButton>
                </div>
              </Sheet>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
