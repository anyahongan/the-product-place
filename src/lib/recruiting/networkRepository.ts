import type { ContactApplicationLink } from "@/types/recruiting";
import type { NetworkContact, NetworkNote } from "@/types/network";
import { networkContacts, networkNotes } from "@/data/network";
import { readJson, writeJson } from "@/lib/recruiting/storage";

const CONTACTS_KEY = "tpp.recruiting.contacts.v1";
const NOTES_KEY = "tpp.recruiting.notes.v1";
const LINKS_KEY = "tpp.recruiting.links.v1";
const SEEDED_KEY = "tpp.recruiting.networkSeeded.v1";

export function listContacts(): NetworkContact[] {
  return readJson<NetworkContact[]>(CONTACTS_KEY, []);
}

export function saveContacts(contacts: NetworkContact[]) {
  writeJson(CONTACTS_KEY, contacts);
}

export function listNotes(): NetworkNote[] {
  return readJson<NetworkNote[]>(NOTES_KEY, []);
}

export function saveNotes(notes: NetworkNote[]) {
  writeJson(NOTES_KEY, notes);
}

export function listContactApplicationLinks(): ContactApplicationLink[] {
  return readJson<ContactApplicationLink[]>(LINKS_KEY, []);
}

export function saveContactApplicationLinks(links: ContactApplicationLink[]) {
  writeJson(LINKS_KEY, links);
}

function linksFromContacts(contacts: NetworkContact[]): ContactApplicationLink[] {
  const links: ContactApplicationLink[] = [];
  for (const c of contacts) {
    for (const applicationId of c.relatedApplicationIds) {
      links.push({
        id: `link-${c.id}-${applicationId}`,
        contactId: c.id,
        applicationId,
        relationshipContext: c.isRecruiter || c.isCampusRecruiter ? "RECRUITING" : "GENERAL NETWORKING",
      });
    }
  }
  return links;
}

/** First visit: seed sample contacts/notes; later loads use persisted data. */
export function hydrateNetworkPersonal(): {
  contacts: NetworkContact[];
  notes: NetworkNote[];
  links: ContactApplicationLink[];
} {
  const seeded = readJson<boolean>(SEEDED_KEY, false);
  if (!seeded) {
    const contacts = structuredClone(networkContacts);
    const notes = structuredClone(networkNotes);
    const links = linksFromContacts(contacts);
    saveContacts(contacts);
    saveNotes(notes);
    saveContactApplicationLinks(links);
    writeJson(SEEDED_KEY, true);
    return { contacts, notes, links };
  }

  let contacts = listContacts();
  let notes = listNotes();
  let links = listContactApplicationLinks();

  if (contacts.length === 0) {
    contacts = structuredClone(networkContacts);
    saveContacts(contacts);
  }
  if (notes.length === 0) {
    notes = structuredClone(networkNotes);
    saveNotes(notes);
  }
  if (links.length === 0) {
    links = linksFromContacts(contacts);
    saveContactApplicationLinks(links);
  }
  return { contacts, notes, links };
}

export function syncLinksFromContact(
  links: ContactApplicationLink[],
  contact: NetworkContact,
): ContactApplicationLink[] {
  const others = links.filter((l) => l.contactId !== contact.id);
  const next = contact.relatedApplicationIds.map((applicationId) => {
    const existing = links.find(
      (l) => l.contactId === contact.id && l.applicationId === applicationId,
    );
    return (
      existing ?? {
        id: `link-${contact.id}-${applicationId}`,
        contactId: contact.id,
        applicationId,
        relationshipContext:
          contact.isRecruiter || contact.isCampusRecruiter
            ? ("RECRUITING" as const)
            : ("GENERAL NETWORKING" as const),
      }
    );
  });
  return [...others, ...next];
}
