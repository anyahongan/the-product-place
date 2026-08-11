import { Link } from "@tanstack/react-router";
import { Sheet, Tape } from "@/components/paper/Paper";
import { formatShortDate } from "@/data/apply";
import type { NetworkContact, NetworkNote } from "@/types/network";

export type NetworkInsight = {
  note: NetworkNote;
  contact: NetworkContact | undefined;
};

/** Restrained insights strip for Apply / Interviewing — same notes Network owns. */
export function NetworkInsightsPanel({
  insights,
  emptyLabel = "No application insights yet. Notes from relevant conversations can appear here.",
  title = "Insights from your network",
}: {
  insights: NetworkInsight[];
  emptyLabel?: string;
  title?: string;
}) {
  return (
    <Sheet tone="pink" soft shadow="hard-sm" className="relative mt-6 px-4 py-4">
      <Tape className="-top-2 left-6" color="pink" angle={-4} width={72} height={18} />
      <p className="font-display text-[1.05rem] font-black uppercase">{title}</p>
      {insights.length === 0 ? (
        <p className="mt-2 text-[0.9rem] text-ink-faint">{emptyLabel}</p>
      ) : (
        <>
          <p className="tag mt-1 text-ink-faint">
            {insights.length} useful insight{insights.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-3 space-y-3">
            {insights.map(({ note, contact }) => (
              <li key={note.id} className="border-2 border-ink bg-paper px-3 py-3">
                <p className="text-[0.95rem] leading-relaxed text-ink">
                  &ldquo;{note.text}&rdquo;
                </p>
                <p className="tag mt-2 text-ink-faint">
                  {contact ? (
                    <Link
                      to="/network"
                      search={{
                        company: contact.companyId,
                        ...(note.relatedApplicationIds[0]
                          ? { application: note.relatedApplicationIds[0] }
                          : {}),
                        contact: contact.id,
                      }}
                      className="font-black uppercase text-pink underline-offset-2 hover:text-ink hover:underline"
                    >
                      {contact.name}
                    </Link>
                  ) : (
                    "Contact"
                  )}
                  {contact?.title ? ` · ${contact.title}` : ""}
                  {" · "}
                  {formatShortDate(note.learnedAt)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
