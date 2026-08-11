import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sheet } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { ConfirmDialog } from "@/components/network/ConfirmDialog";
import { formatNetworkDate } from "@/data/network";
import type { NetworkNote, TimelineEvent } from "@/types/network";

function summarizeNote(text: string) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 140) return cleaned;
  return `${cleaned.slice(0, 137).trimEnd()}...`;
}

export function NotesTimeline({
  notes,
  timeline,
  expandedId,
  onToggle,
  onChangeNote,
  onAddNote,
  onDeleteNote,
}: {
  notes: NetworkNote[];
  timeline: TimelineEvent[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  onChangeNote: (note: NetworkNote) => void;
  onAddNote: () => void;
  onDeleteNote: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const sorted = [...notes].sort((a, b) => b.learnedAt.localeCompare(a.learnedAt));
  const pendingNote = notes.find((n) => n.id === pendingDeleteId);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="tag font-black text-ink">Notes timeline</p>
        <PinkHoverButton variant="paper" onClick={onAddNote}>
          Add note
        </PinkHoverButton>
      </div>

      {sorted.length === 0 ? (
        <p className="border-2 border-dashed border-ink/40 bg-paper-2 px-4 py-6 text-[0.95rem] text-ink-soft">
          No notes yet. Add what you learned and link it to a call or meeting.
        </p>
      ) : (
        <div className="relative pl-6">
          <motion.div
            aria-hidden
            className="absolute bottom-2 left-[9px] top-2 w-0.5 origin-top bg-ink"
            initial={reduced ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
          />
          <ol className="space-y-4">
            {sorted.map((note, i) => {
              const linked = timeline.find((e) => e.id === note.relatedTimelineEventId);
              const open = expandedId === note.id;
              return (
                <motion.li
                  key={note.id}
                  initial={reduced ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.24, ease: [0.2, 0.9, 0.2, 1] }}
                  className="relative"
                >
                  <span
                    aria-hidden
                    className="absolute -left-6 top-1.5 h-3 w-3 border-2 border-ink bg-yellow"
                  />
                  <p className="tag font-black uppercase text-ink">
                    Learned {formatNetworkDate(note.learnedAt)}
                  </p>
                  <p className="mt-0.5 font-display text-[1.05rem] font-black uppercase leading-none text-ink">
                    {note.type}
                  </p>
                  <p className="mt-2 text-[0.95rem] text-ink-soft">{summarizeNote(note.text)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {note.useForApplicationMaterials && (
                      <span className="tag border-2 border-ink bg-yellow px-2 py-1 uppercase">
                        ✓ Application materials
                      </span>
                    )}
                    {note.useForInterviewPrep && (
                      <span className="tag border-2 border-ink bg-blue-wash px-2 py-1 uppercase">
                        ✓ Interview prep
                      </span>
                    )}
                  </div>
                  {linked && (
                    <p className="tag mt-1 text-ink-faint">
                      Linked to call · {linked.title} · {formatNetworkDate(linked.date)}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PinkHoverButton variant="tag" onClick={() => onToggle(open ? null : note.id)}>
                      {open ? "Hide notes ←" : "View notes →"}
                    </PinkHoverButton>
                    <PinkHoverButton variant="tag" onClick={() => setPendingDeleteId(note.id)}>
                      Delete note
                    </PinkHoverButton>
                  </div>

                  {open && (
                    <Sheet tone="paper-2" shadow="hard-sm" className="mt-3 px-3 py-3">
                      <label className="block">
                        <span className="tag text-ink-faint">Date learned</span>
                        <input
                          type="date"
                          value={note.learnedAt}
                          onChange={(e) =>
                            onChangeNote({ ...note, learnedAt: e.target.value || note.learnedAt })
                          }
                          className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 outline-none focus:bg-yellow-wash"
                        />
                      </label>
                      <label className="mt-3 block">
                        <span className="tag text-ink-faint">Linked call / conversation</span>
                        <select
                          value={note.relatedTimelineEventId ?? ""}
                          onChange={(e) =>
                            onChangeNote({
                              ...note,
                              relatedTimelineEventId: e.target.value || null,
                            })
                          }
                          className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 outline-none focus:bg-yellow-wash"
                        >
                          <option value="">Not linked</option>
                          {timeline.map((event) => (
                            <option key={event.id} value={event.id}>
                              {formatNetworkDate(event.date)} · {event.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="tag text-ink-faint">Note</span>
                        <textarea
                          value={note.text}
                          onChange={(e) => onChangeNote({ ...note, text: e.target.value })}
                          rows={5}
                          className="mt-1 w-full resize-y border-2 border-ink bg-paper px-3 py-2 outline-none focus:bg-yellow-wash"
                        />
                      </label>
                      <div className="mt-3 space-y-2 border-2 border-ink bg-paper px-3 py-3">
                        <p className="tag font-black text-ink">Use this note for</p>
                        <label className="flex cursor-pointer items-center gap-2 text-[0.95rem]">
                          <input
                            type="checkbox"
                            checked={note.useForApplicationMaterials}
                            onChange={() =>
                              onChangeNote({
                                ...note,
                                useForApplicationMaterials: !note.useForApplicationMaterials,
                              })
                            }
                            className="h-4 w-4 accent-[var(--pink)]"
                          />
                          <span className="font-display text-xs font-black uppercase">
                            Use for application materials
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-[0.95rem]">
                          <input
                            type="checkbox"
                            checked={note.useForInterviewPrep}
                            onChange={() =>
                              onChangeNote({
                                ...note,
                                useForInterviewPrep: !note.useForInterviewPrep,
                              })
                            }
                            className="h-4 w-4 accent-[var(--blue)]"
                          />
                          <span className="font-display text-xs font-black uppercase">
                            Use for interview prep
                          </span>
                        </label>
                      </div>
                      <div className="mt-3">
                        <PinkHoverButton
                          variant="paper"
                          onClick={() => setPendingDeleteId(note.id)}
                        >
                          Delete note
                        </PinkHoverButton>
                      </div>
                    </Sheet>
                  )}
                </motion.li>
              );
            })}
          </ol>
        </div>
      )}

      {pendingDeleteId && pendingNote && (
        <ConfirmDialog
          title="Are you sure?"
          message={`Delete this note from ${formatNetworkDate(pendingNote.learnedAt)}? This cannot be undone in this session.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => {
            onDeleteNote(pendingDeleteId);
            setPendingDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
