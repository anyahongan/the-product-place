import { Sheet, Tape } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";

export function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/50 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <Sheet
        tone="paper"
        shadow="hard"
        className="relative w-full max-w-md px-5 py-5"
        // click stop via inner wrapper
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal
          aria-labelledby="network-confirm-title"
        >
          <Tape className="-top-3 left-8" color="pink" angle={-4} width={90} height={20} />
          <h3
            id="network-confirm-title"
            className="font-display text-[1.4rem] font-black uppercase leading-none"
          >
            {title}
          </h3>
          <p className="mt-3 text-[0.98rem] text-ink-soft">{message}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <PinkHoverButton variant="ink" onClick={onConfirm}>
              {confirmLabel}
            </PinkHoverButton>
            <PinkHoverButton variant="closeSm" onClick={onCancel}>
              Cancel
            </PinkHoverButton>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
