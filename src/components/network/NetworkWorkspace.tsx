import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { CompanySelector } from "@/components/network/CompanySelector";
import { NetworkViewTabs } from "@/components/network/NetworkViewTabs";
import { ContactSaturation } from "@/components/network/ContactSaturation";
import { ExistingContacts } from "@/components/network/ExistingContacts";
import { RecommendedContacts } from "@/components/network/RecommendedContacts";
import { FollowUpQueue } from "@/components/network/FollowUpQueue";
import { ConversationsView } from "@/components/network/ConversationsView";
import { ContactProfile } from "@/components/network/ContactProfile";
import { OutreachDraftPanel } from "@/components/network/OutreachDraft";
import { CommunicationFormatPrompt } from "@/components/network/CommunicationFormatPrompt";
import { useRecruiting } from "@/components/recruiting/useRecruiting";
import { draftForContact } from "@/data/network";
import { companyIdFromName, toneForCompanyId } from "@/types/recruiting";
import type {
  CommunicationFormatPreference,
  NetworkCompany,
  NetworkContact,
  NetworkView,
  OutreachDraft,
} from "@/types/network";

const EXTRA_CATALOG: NetworkCompany[] = [
  { id: "co-asana", name: "Asana", tone: "pink" },
  { id: "co-spotify", name: "Spotify", tone: "green" },
  { id: "co-dropbox", name: "Dropbox", tone: "blue" },
];

const FORMAT_KEY = "tpp-network-comm-format";
const routeApi = getRouteApi("/network");

function loadFormatPref(): CommunicationFormatPreference | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FORMAT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CommunicationFormatPreference;
  } catch {
    return null;
  }
}

function promoteToSaved(contact: NetworkContact): NetworkContact {
  if (!contact.isRecommended) return contact;
  return {
    ...contact,
    isRecommended: false,
    relationshipStatus:
      contact.relationshipStatus === "Not contacted" ? "Not contacted" : contact.relationshipStatus,
  };
}

function markOutreachDrafted(contact: NetworkContact): NetworkContact {
  return {
    ...promoteToSaved(contact),
    relationshipStatus:
      contact.relationshipStatus === "Not contacted" || contact.isRecommended
        ? "Outreach drafted"
        : contact.relationshipStatus,
    nextAction: contact.nextAction === "Draft intro" ? "Send intro" : contact.nextAction,
  };
}

function toNetworkCompany(c: {
  id: string;
  name: string;
  tone: string;
}): NetworkCompany {
  const tone = (["blue", "green", "pink", "yellow", "purple"] as const).includes(
    c.tone as NetworkCompany["tone"],
  )
    ? (c.tone as NetworkCompany["tone"])
    : "blue";
  return { id: c.id, name: c.name, tone };
}

export function NetworkWorkspace() {
  const reduced = useReducedMotion();
  const navigate = useNavigate({ from: "/network" });
  const search = routeApi.useSearch();
  const {
    apps,
    companies,
    contacts,
    notes,
    setContacts,
    setNotes,
    updateContact,
    addCompanyToCatalog,
    hydrated,
  } = useRecruiting();

  const catalog = useMemo(() => {
    const map = new Map<string, NetworkCompany>();
    for (const c of companies) map.set(c.id, toNetworkCompany(c));
    for (const c of EXTRA_CATALOG) if (!map.has(c.id)) map.set(c.id, c);
    return [...map.values()];
  }, [companies]);

  const defaultVisible = useMemo(() => {
    const withApps = new Set(apps.map((a) => a.companyId));
    const seeds = companies.slice(0, 5).map((c) => c.id);
    return [...new Set([...seeds, ...withApps])];
  }, [apps, companies]);

  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState("co-figma");
  const [view, setView] = useState<NetworkView>("contacts");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusEventId, setFocusEventId] = useState<string | null>(null);
  const [queueDraft, setQueueDraft] = useState<{ id: string; draft: OutreachDraft } | null>(null);
  const [formatPref, setFormatPref] = useState<CommunicationFormatPreference | null>(null);
  const [formatChecked, setFormatChecked] = useState(false);
  const [showFormatPrompt, setShowFormatPrompt] = useState(false);
  const [savedFlashIds, setSavedFlashIds] = useState<Record<string, boolean>>({});
  const [searchApplied, setSearchApplied] = useState(false);

  useEffect(() => {
    const existing = loadFormatPref();
    setFormatPref(existing);
    setShowFormatPrompt(!existing);
    setFormatChecked(true);
  }, []);

  useEffect(() => {
    if (!hydrated || visibleIds.length > 0) return;
    setVisibleIds(defaultVisible.length ? defaultVisible : catalog.slice(0, 5).map((c) => c.id));
  }, [hydrated, defaultVisible, catalog, visibleIds.length]);

  useEffect(() => {
    if (!hydrated || searchApplied) return;
    if (search.company && catalog.some((c) => c.id === search.company)) {
      setCompanyId(search.company);
      setVisibleIds((prev) =>
        prev.includes(search.company!) ? prev : [...prev, search.company!],
      );
    }
    if (search.contact) {
      setSelectedId(search.contact);
      setView("contacts");
    }
    setSearchApplied(true);
  }, [hydrated, search, catalog, searchApplied]);

  const saveFormatPref = (pref: CommunicationFormatPreference) => {
    setFormatPref(pref);
    setShowFormatPrompt(false);
    window.localStorage.setItem(FORMAT_KEY, JSON.stringify(pref));
  };

  const barCompanies = useMemo(
    () => catalog.filter((c) => visibleIds.includes(c.id)),
    [catalog, visibleIds],
  );

  const company =
    catalog.find((c) => c.id === companyId) ??
    barCompanies[0] ??
    ({ id: companyId, name: "Company", tone: "pink" } as const);

  const filtered = useMemo(
    () => contacts.filter((c) => c.companyId === companyId),
    [contacts, companyId],
  );

  const existing = filtered.filter((c) => !c.isRecommended);
  const recommended = filtered.filter((c) => c.isRecommended);
  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  const saveContact = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (!c.isRecommended) return c;
        return promoteToSaved(c);
      }),
    );
    setSavedFlashIds((prev) => ({ ...prev, [id]: true }));
  };

  const unsaveContact = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, isRecommended: true };
      }),
    );
    setSelectedId(null);
    setFocusEventId(null);
  };

  const openProfile = (id: string, eventId: string | null = null) => {
    setFocusEventId(eventId);
    setSelectedId(id);
  };

  const handleCompanyChange = (id: string) => {
    setCompanyId(id);
    setSelectedId(null);
    setFocusEventId(null);
    setQueueDraft(null);
    void navigate({ search: { company: id } });
  };

  const toggleVisible = (id: string) => {
    setVisibleIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        const next = prev.filter((x) => x !== id);
        if (companyId === id) setCompanyId(next[0] ?? prev[0]!);
        return next;
      }
      return [...prev, id];
    });
  };

  const addCompany = (name: string) => {
    const id = companyIdFromName(name);
    const existingCompany = catalog.find(
      (c) => c.id === id || c.name.toLowerCase() === name.toLowerCase(),
    );
    if (existingCompany) {
      if (!visibleIds.includes(existingCompany.id)) {
        setVisibleIds((prev) => [...prev, existingCompany.id]);
      }
      handleCompanyChange(existingCompany.id);
      return;
    }
    const created: NetworkCompany = {
      id,
      name,
      tone: toneForCompanyId(id) === "pink" ? "blue" : toneForCompanyId(id),
    };
    addCompanyToCatalog({
      id: created.id,
      name: created.name,
      tone: created.tone === "pink" ? "blue" : created.tone,
    });
    setVisibleIds((prev) => [...prev, id]);
    handleCompanyChange(id);
  };

  const makeDraft = (contact: NetworkContact, kind: OutreachDraft["kind"]) =>
    draftForContact(contact, kind, formatPref, apps);

  const startOutreachDraft = (id: string, kind: OutreachDraft["kind"] = "COLD OUTREACH") => {
    const c = contacts.find((x) => x.id === id);
    if (!c) return;
    setContacts((prev) => prev.map((x) => (x.id === id ? markOutreachDrafted(x) : x)));
    setQueueDraft({ id, draft: makeDraft({ ...c, isRecommended: false }, kind) });
  };

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-12 sm:px-8 sm:pt-14">
      <div
        aria-hidden
        className="grid-bold pointer-events-none absolute inset-0 -z-10 opacity-55"
      />

      <div className="mx-auto max-w-[1320px]">
        <header className="mb-8 sm:mb-10">
          <p className="tag text-pink">The Product Place · Network</p>
          <h1 className="mt-2 font-display text-[clamp(2.6rem,9vw,5.5rem)] font-black uppercase leading-[0.8]">
            Network
          </h1>
          <p className="mt-4 max-w-2xl text-[1.02rem] text-ink-soft">
            A relationship workspace around each company: who you know, who to meet next, and what
            to do after every conversation.
          </p>
        </header>

        <div className="space-y-5">
          <CompanySelector
            companies={barCompanies}
            catalog={catalog}
            value={companyId}
            onChange={handleCompanyChange}
            onToggleVisible={toggleVisible}
            onAddCompany={addCompany}
          />
          <NetworkViewTabs value={view} onChange={setView} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${companyId}-${view}`}
            initial={reduced ? false : { opacity: 0, y: 16, rotate: -0.35 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -10, rotate: 0.25 }}
            transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
            className="mt-8"
          >
            {view === "contacts" && (
              <div className="space-y-12">
                <ExistingContacts contacts={existing} onOpen={(id) => openProfile(id)} />
                <ContactSaturation companyName={company.name} contacts={existing} />
                <RecommendedContacts
                  contacts={recommended}
                  onOpen={(id) => openProfile(id)}
                  onSave={(id) => saveContact(id)}
                  onDraft={(id) => startOutreachDraft(id, "COLD OUTREACH")}
                />
                {Object.keys(savedFlashIds).length > 0 && recommended.length === 0 && (
                  <p className="tag text-green">Saved contacts now appear under Your Contacts.</p>
                )}
              </div>
            )}

            {view === "follow-ups" && (
              <FollowUpQueue
                contacts={filtered}
                onOpen={(id) => openProfile(id)}
                onSnooze={(id) => {
                  const c = contacts.find((x) => x.id === id);
                  if (!c) return;
                  updateContact({ ...c, nextAction: "Check in later", nextFollowUp: "2026-08-20" });
                }}
                onDismiss={(id) => {
                  const c = contacts.find((x) => x.id === id);
                  if (!c) return;
                  updateContact({
                    ...c,
                    nextAction: "No action",
                    relationshipStatus: "Closed / no action",
                    nextFollowUp: null,
                  });
                }}
                onDraft={(id) => {
                  const c = contacts.find((x) => x.id === id);
                  if (!c) return;
                  if (c.nextAction === "Prep for meeting") {
                    openProfile(id);
                    return;
                  }
                  const kind =
                    c.nextAction === "Send thank-you"
                      ? "THANK-YOU"
                      : c.nextAction === "Ask about referral"
                        ? "REFERRAL FOLLOW-UP"
                        : c.nextAction === "Draft intro" || c.nextAction === "Send intro"
                          ? "COLD OUTREACH"
                          : "FOLLOW-UP";
                  startOutreachDraft(id, kind);
                }}
              />
            )}

            {view === "conversations" && (
              <ConversationsView
                contacts={filtered}
                onOpenContact={(id) => openProfile(id)}
                onOpenEvent={(contactId, eventId) => openProfile(contactId, eventId)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selected && (
          <ContactProfile
            key={selected.id}
            contact={selected}
            notes={notes}
            applications={apps}
            formatPref={formatPref}
            focusEventId={focusEventId}
            onClose={() => {
              setSelectedId(null);
              setFocusEventId(null);
            }}
            onUpdateContact={updateContact}
            onChangeNotes={setNotes}
            onSaveContact={() => saveContact(selected.id)}
            onUnsaveContact={() => unsaveContact(selected.id)}
            onChangeFormat={() => setShowFormatPrompt(true)}
            onMarkContacted={() => {
              updateContact(markOutreachDrafted(selected));
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {queueDraft && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQueueDraft(null)}
          >
            <motion.div
              className="w-full max-w-xl"
              initial={reduced ? false : { y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <OutreachDraftPanel
                draft={queueDraft.draft}
                onClose={() => setQueueDraft(null)}
                onChangeFormat={() => setShowFormatPrompt(true)}
                onSave={(d) => {
                  setQueueDraft({ ...queueDraft, draft: d });
                  const c = contacts.find((x) => x.id === queueDraft.id);
                  if (!c) return;
                  updateContact(markOutreachDrafted(c));
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {formatChecked && showFormatPrompt && (
        <CommunicationFormatPrompt
          onComplete={saveFormatPref}
          onClose={() => setShowFormatPrompt(false)}
        />
      )}
    </main>
  );
}
