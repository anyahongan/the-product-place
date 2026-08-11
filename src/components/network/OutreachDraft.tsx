import { useEffect, useState } from "react";
import { Sheet, Tape } from "@/components/paper/Paper";
import type { OutreachDraft as OutreachDraftType } from "@/types/network";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";

export function OutreachDraftPanel({
  draft,
  onClose,
  onSave,
  onChangeFormat,
}: {
  draft: OutreachDraftType;
  onClose: () => void;
  onSave: (draft: OutreachDraftType) => void;
  onChangeFormat?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(draft);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocal(draft);
    setEditing(false);
    setCopied(false);
  }, [draft]);

  return (
    <Sheet tone="pink" soft pattern="ruled" shadow="hard" className="relative px-5 py-5 sm:px-6">
      <Tape className="-top-3 left-10" color="blue" angle={-5} width={110} height={22} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tag text-ink">{draft.kind}</p>
          <h3 className="mt-1 font-display text-[1.5rem] font-black uppercase leading-none text-ink">
            Outreach draft
          </h3>
        </div>
        <PinkHoverButton variant="closeSm" onClick={onClose}>
          Close
        </PinkHoverButton>
      </div>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="tag text-ink-faint">To</span>
          {editing ? (
            <input
              value={local.to}
              onChange={(e) => setLocal({ ...local, to: e.target.value })}
              className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-display text-sm font-black uppercase outline-none focus:bg-yellow-wash"
            />
          ) : (
            <p className="mt-1 border-2 border-ink bg-paper px-3 py-2 font-display text-sm font-black uppercase">
              {local.to}
            </p>
          )}
        </label>
        <label className="block">
          <span className="tag text-ink-faint">Subject</span>
          {editing ? (
            <input
              value={local.subject}
              onChange={(e) => setLocal({ ...local, subject: e.target.value })}
              className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 outline-none focus:bg-yellow-wash"
            />
          ) : (
            <p className="mt-1 border-2 border-ink bg-paper px-3 py-2">{local.subject}</p>
          )}
        </label>
        <label className="block">
          <span className="tag text-ink-faint">Message</span>
          {editing ? (
            <textarea
              value={local.body}
              onChange={(e) => setLocal({ ...local, body: e.target.value })}
              rows={8}
              className="mt-1 w-full resize-y border-2 border-ink bg-paper px-3 py-2 leading-relaxed outline-none focus:bg-yellow-wash"
            />
          ) : (
            <pre className="mt-1 whitespace-pre-wrap border-2 border-ink bg-paper px-3 py-2 font-sans text-[0.95rem] leading-relaxed">
              {local.body}
            </pre>
          )}
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(
              `To: ${local.to}\nSubject: ${local.subject}\n\n${local.body}`,
            );
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
          className="focus-ink border-2 border-ink bg-blue px-4 py-2 font-display text-sm font-black uppercase text-paper outline-none"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="focus-ink border-2 border-ink bg-yellow px-4 py-2 font-display text-sm font-black uppercase outline-none"
        >
          {editing ? "Done editing" : "Edit"}
        </button>
        <PinkHoverButton variant="paper" onClick={() => onSave(local)}>
          Save draft
        </PinkHoverButton>
        {onChangeFormat && (
          <PinkHoverButton variant="closeSm" onClick={onChangeFormat}>
            Change email format
          </PinkHoverButton>
        )}
      </div>
      <p className="tag mt-3 text-ink-faint">Does not send email. Copy into your own client.</p>
    </Sheet>
  );
}
