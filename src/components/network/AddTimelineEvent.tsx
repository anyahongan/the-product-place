import { useState } from "react";
import { Sheet } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import type {
  NetworkContact,
  NextAction,
  RelationshipStatus,
  TimelineEvent,
  TimelineEventType,
} from "@/types/network";

const ACTION_OPTIONS: Array<{
  type: TimelineEventType;
  label: string;
  title: string;
}> = [
  { type: "cold-email", label: "Cold email sent", title: "Cold outreach sent" },
  { type: "follow-up", label: "Follow-up sent", title: "Follow-up sent" },
  { type: "reply", label: "They replied", title: "Reply received" },
  { type: "meeting-scheduled", label: "Meeting scheduled", title: "Meeting scheduled" },
  { type: "meeting-completed", label: "Meeting completed", title: "Meeting completed" },
  { type: "thank-you-sent", label: "Thank-you sent", title: "Thank-you sent" },
  { type: "thank-you-draft", label: "Thank-you drafted", title: "Thank-you drafted" },
  { type: "note", label: "Logged note / call", title: "Interaction logged" },
  { type: "suggested-follow-up", label: "Suggested follow-up", title: "Suggested follow-up" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function statusFromType(type: TimelineEventType): {
  relationshipStatus?: RelationshipStatus;
  nextAction?: NextAction;
} {
  switch (type) {
    case "cold-email":
    case "follow-up":
    case "thank-you-sent":
      return { relationshipStatus: "Contacted", nextAction: "Wait" };
    case "reply":
      return { relationshipStatus: "Replied", nextAction: "Follow up" };
    case "meeting-scheduled":
      return { relationshipStatus: "Meeting scheduled", nextAction: "Prep for meeting" };
    case "meeting-completed":
      return { relationshipStatus: "Met", nextAction: "Send thank-you" };
    case "thank-you-draft":
      return { nextAction: "Send thank-you" };
    case "suggested-follow-up":
      return { nextAction: "Follow up" };
    default:
      return {};
  }
}

export function AddTimelineEvent({
  contact,
  onAdd,
  onCancel,
}: {
  contact: NetworkContact;
  onAdd: (event: TimelineEvent, updates: Partial<NetworkContact>) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState<TimelineEventType>("reply");
  const [title, setTitle] = useState("Reply received");
  const [detail, setDetail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [meetingTime, setMeetingTime] = useState("");

  const needsEmail =
    type === "cold-email" ||
    type === "follow-up" ||
    type === "reply" ||
    type === "thank-you-sent" ||
    type === "thank-you-draft";
  const needsMeeting = type === "meeting-scheduled" || type === "meeting-completed";

  const selectType = (next: TimelineEventType) => {
    const option = ACTION_OPTIONS.find((o) => o.type === next);
    setType(next);
    if (option) setTitle(option.title);
  };

  const save = () => {
    const event: TimelineEvent = {
      id: `te-local-${Date.now()}`,
      date,
      type,
      title: title.trim() || ACTION_OPTIONS.find((o) => o.type === type)?.title || "Logged event",
      ...(detail.trim() ? { detail: detail.trim() } : {}),
      ...(emailSubject.trim() ? { emailSubject: emailSubject.trim() } : {}),
      ...(emailBody.trim() ? { emailBody: emailBody.trim() } : {}),
      ...(meetingTime.trim() ? { meetingTime: meetingTime.trim() } : {}),
    };
    onAdd(event, statusFromType(type));
  };

  return (
    <Sheet tone="paper-2" soft shadow="hard-sm" className="mt-3 space-y-3 px-4 py-4">
      <p className="tag font-black text-ink">Log interaction</p>
      <p className="text-[0.9rem] text-ink-soft">
        Mailboxes aren’t connected — add what happened with {contact.name} so the trail stays
        accurate.
      </p>

      <label className="block">
        <span className="tag text-ink-faint">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-sans text-[0.95rem] outline-none focus:bg-yellow-wash"
        />
      </label>

      <label className="block">
        <span className="tag text-ink-faint">Action</span>
        <select
          value={type}
          onChange={(e) => selectType(e.target.value as TimelineEventType)}
          className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-sans text-[0.95rem] outline-none focus:bg-yellow-wash"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.type} value={opt.type}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="tag text-ink-faint">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-sans text-[0.95rem] outline-none focus:bg-yellow-wash"
        />
      </label>

      <label className="block">
        <span className="tag text-ink-faint">Detail (optional)</span>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={2}
          placeholder="What happened, next steps, context…"
          className="mt-1 w-full resize-y border-2 border-ink bg-paper px-3 py-2 font-sans text-[0.95rem] outline-none focus:bg-yellow-wash"
        />
      </label>

      {needsEmail && (
        <>
          <label className="block">
            <span className="tag text-ink-faint">Email subject (optional)</span>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-sans text-[0.95rem] outline-none focus:bg-yellow-wash"
            />
          </label>
          <label className="block">
            <span className="tag text-ink-faint">Email body (optional)</span>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={5}
              placeholder="Paste the email you sent or received…"
              className="mt-1 w-full resize-y border-2 border-ink bg-paper px-3 py-2 font-sans text-[0.95rem] outline-none focus:bg-yellow-wash"
            />
          </label>
        </>
      )}

      {needsMeeting && (
        <label className="block">
          <span className="tag text-ink-faint">Meeting time (optional)</span>
          <input
            type="text"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            placeholder="e.g. 2:00 PM"
            className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-sans text-[0.95rem] outline-none focus:bg-yellow-wash"
          />
        </label>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <PinkHoverButton variant="ink" onClick={save}>
          Add to timeline
        </PinkHoverButton>
        <PinkHoverButton variant="closeSm" onClick={onCancel}>
          Cancel
        </PinkHoverButton>
      </div>
    </Sheet>
  );
}
