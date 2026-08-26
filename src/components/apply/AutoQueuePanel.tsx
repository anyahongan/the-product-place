import { Sheet } from "@/components/paper/Paper";
import {
  applyBlueBtnSm,
  applyBlueGhostBtnSm,
  applyBlueHeaderCta,
} from "@/components/apply/applyUi";
import { modeCta } from "@/components/apply/modeCta";
import type { JobListingView } from "@/lib/apply/types";

export function AutoQueuePanel({
  jobs,
  onOpenEmployer,
  onRemove,
  onMarkApplied,
  onOpenNext,
}: {
  jobs: JobListingView[];
  onOpenEmployer: (job: JobListingView) => void;
  onRemove: (jobId: string) => void;
  onMarkApplied: (job: JobListingView) => void;
  onOpenNext: () => void;
}) {
  return (
    <Sheet tone="blue" shadow="hard-sm" className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="tag text-paper/80">Auto mode · local queue</p>
          <h3 className="mt-1 font-display text-[1.45rem] font-black uppercase leading-none text-paper">
            Auto Queue ({jobs.length})
          </h3>
          <p className="mt-2 max-w-xl text-[0.95rem] text-paper/90">
            Roles you queue stay here until you open them. Mark applied to clear each role.
            Nothing is submitted for you.
          </p>
        </div>
        <button
          type="button"
          disabled={jobs.length === 0 || !jobs[0]?.applicationUrl}
          onClick={onOpenNext}
          className={applyBlueHeaderCta}
        >
          Open next →
        </button>
      </div>

      <div className="px-5 py-5">
        {jobs.length === 0 ? (
          <p className="border-2 border-dashed border-paper/70 bg-paper/10 px-4 py-4 text-[0.95rem] text-paper">
            Queue is empty. Use “{modeCta("auto")}” on a listing to add roles.
          </p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="grid gap-3 border-2 border-ink bg-paper px-3 py-3 text-ink shadow-hard-sm sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-black uppercase">{job.company}</p>
                  <p className="truncate text-[0.9rem] text-ink-soft">{job.title}</p>
                  {!job.applicationUrl && (
                    <p className="tag mt-1 text-pink">No direct application link</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!job.applicationUrl}
                    onClick={() => onOpenEmployer(job)}
                    className={applyBlueBtnSm}
                  >
                    Open link
                  </button>
                  <button
                    type="button"
                    onClick={() => onMarkApplied(job)}
                    className={applyBlueGhostBtnSm}
                  >
                    Mark applied
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(job.id)}
                    className={applyBlueGhostBtnSm}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
