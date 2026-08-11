import { motion, useReducedMotion } from "motion/react";
import { formatNetworkDate } from "@/data/network";
import type { NetworkNote, TimelineEvent } from "@/types/network";
import { cn } from "@/lib/utils";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";

export function CommunicationTimeline({
  events,
  notes = [],
  onViewEvent,
  onViewNote,
}: {
  events: TimelineEvent[];
  notes?: NetworkNote[];
  onViewEvent?: (event: TimelineEvent) => void;
  onViewNote?: (note: NetworkNote) => void;
}) {
  const reduced = useReducedMotion();
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <p className="border-2 border-dashed border-ink/40 bg-paper-2 px-4 py-6 text-[0.95rem] text-ink-soft">
        No communication yet. Draft an intro to start the trail.
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      <motion.div
        aria-hidden
        className="absolute bottom-2 left-[9px] top-2 w-0.5 origin-top bg-ink"
        initial={reduced ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1] }}
      />
      <ol className="space-y-4">
        {sorted.map((event, i) => {
          const linkedNotes = notes.filter((n) => n.relatedTimelineEventId === event.id);
          return (
            <motion.li
              key={event.id}
              initial={reduced ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
              className="relative"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute -left-6 top-1.5 h-3 w-3 border-2 border-ink bg-paper",
                  event.type.includes("meeting") && "bg-yellow",
                  event.type.includes("thank") && "bg-green",
                  (event.type === "cold-email" || event.type === "follow-up") && "bg-pink",
                  event.type === "reply" && "bg-blue",
                )}
              />
              <p className="tag font-black uppercase text-ink">{formatNetworkDate(event.date)}</p>
              <p className="mt-0.5 font-display text-[1.05rem] font-black uppercase leading-none text-ink">
                {event.title}
              </p>
              {event.detail && <p className="mt-1 text-[0.92rem] text-ink-soft">{event.detail}</p>}
              {event.meetingTime && (
                <p className="mt-1 text-[0.92rem] font-black text-ink">{event.meetingTime}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {onViewEvent && (
                  <PinkHoverButton variant="tag" onClick={() => onViewEvent(event)}>
                    {event.emailBody
                      ? "View email →"
                      : event.type.includes("meeting") || event.meetingTime
                        ? "Calendar event →"
                        : "View event →"}
                  </PinkHoverButton>
                )}
                {linkedNotes.map((note) => (
                  <PinkHoverButton key={note.id} variant="tag" onClick={() => onViewNote?.(note)}>
                    View notes →
                  </PinkHoverButton>
                ))}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
