import { Sheet, Tab } from "@/components/paper/Paper";
import { ContactCard } from "@/components/network/ContactCard";
import type { NetworkContact } from "@/types/network";

export function ExistingContacts({
  contacts,
  onOpen,
}: {
  contacts: NetworkContact[];
  onOpen: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Tab color="yellow">Your contacts</Tab>
          <h2 className="mt-3 font-display text-[1.7rem] font-black uppercase leading-none">
            People you already know
          </h2>
        </div>
        <p className="tag text-ink-faint">{contacts.length} saved</p>
      </div>
      {contacts.length === 0 ? (
        <Sheet tone="paper-2" soft className="px-4 py-8 text-ink-soft">
          No saved contacts for this filter yet.
        </Sheet>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact, i) => (
            <ContactCard key={contact.id} contact={contact} index={i} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
