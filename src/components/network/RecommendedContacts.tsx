import { useState } from "react";
import { Sheet, Tab } from "@/components/paper/Paper";
import { ContactCard } from "@/components/network/ContactCard";
import { MatchReasons } from "@/components/network/MatchReasons";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import type { NetworkContact } from "@/types/network";

export function RecommendedContacts({
  contacts,
  onOpen,
  onDraft,
  onSave,
  resolveCompanyName,
}: {
  contacts: NetworkContact[];
  onOpen: (id: string) => void;
  onDraft: (id: string) => void;
  onSave: (id: string) => void;
  resolveCompanyName?: (companyId: string) => string;
}) {
  const ranked = [...contacts].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  const [savedUi, setSavedUi] = useState<Record<string, boolean>>({});

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Tab color="pink">People worth reaching out to</Tab>
          <h2 className="mt-3 font-display text-[1.7rem] font-black uppercase leading-none">
            Recommended matches
          </h2>
          <p className="mt-2 max-w-xl text-[0.95rem] text-ink-soft">
            Ranked from your Profile, applications, and contact signals. Save a contact to move
            them into Your Contacts.
          </p>
        </div>
        <p className="tag text-ink-faint">{ranked.length} ranked</p>
      </div>

      {ranked.length === 0 ? (
        <Sheet tone="paper-2" soft className="px-4 py-8 text-ink-soft">
          No recommendations for this filter.
        </Sheet>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ranked.map((contact, i) => {
            const justSaved = !!savedUi[contact.id];
            return (
              <div key={contact.id} className="space-y-0">
                <ContactCard
                  contact={contact}
                  index={i}
                  onOpen={onOpen}
                  recommended
                  {...(resolveCompanyName
                    ? { companyName: resolveCompanyName(contact.companyId) }
                    : {})}
                />
                <Sheet tone="paper" shadow="hard-sm" className="-mt-1 border-t-0 px-4 py-3">
                  <MatchReasons reasons={contact.matchReasons} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PinkHoverButton variant="paper" onClick={() => onOpen(contact.id)}>
                      View
                    </PinkHoverButton>
                    {justSaved ? (
                      <span className="border-2 border-ink bg-green px-3 py-2 font-display text-xs font-black uppercase text-ink">
                        Saved ✓
                      </span>
                    ) : (
                      <PinkHoverButton
                        variant="paper"
                        onClick={() => {
                          setSavedUi((prev) => ({ ...prev, [contact.id]: true }));
                          window.setTimeout(() => onSave(contact.id), 450);
                        }}
                      >
                        Save contact
                      </PinkHoverButton>
                    )}
                    <PinkHoverButton variant="ink" onClick={() => onDraft(contact.id)}>
                      Draft outreach
                    </PinkHoverButton>
                  </div>
                </Sheet>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
