import { Sheet } from "@/components/paper/Paper";
import { applyBlueHeaderCta } from "@/components/apply/applyUi";
import { applyJobTheme } from "@/components/apply/applyJobTheme";
import { applyListCta } from "@/components/apply/modeCta";
import { cn } from "@/lib/utils";
import type { JobListingView } from "@/lib/apply/types";

export function QuickApplyListPanel({
  jobs,
  onPrepare,
  onRemove,
  onStartNext,
}: {
  jobs: JobListingView[];
  onPrepare: (job: JobListingView) => void;
  onRemove: (jobId: string) => void;
  onStartNext: () => void;
}) {
  return (
    <Sheet tone="blue" shadow="hard-sm" className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="tag text-paper/80">Quick mode · apply list</p>
          <h3 className="mt-1 font-display text-[1.45rem] font-black uppercase leading-none text-paper">
            Apply list ({jobs.length})
          </h3>
          <p className="mt-2 max-w-xl text-[0.95rem] text-paper/90">
            Batch roles you want to work through. Start next opens the materials packet for each
            role — you review, copy, and submit on the employer site.
          </p>
        </div>
        <button
          type="button"
          disabled={jobs.length === 0}
          onClick={onStartNext}
          className={applyBlueHeaderCta}
        >
          Start next →
        </button>
      </div>

      <div className="px-5 py-5">
        {jobs.length === 0 ? (
          <p className="border-2 border-dashed border-paper/70 bg-paper/10 px-4 py-4 text-[0.95rem] text-paper">
            List is empty. Use “{applyListCta()}” on a listing, or open a role with Quick Apply
            first.
          </p>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job, index) => {
              const theme = applyJobTheme(job);
              return (
                <li
                  key={job.id}
                  className={cn(
                    "grid gap-0 overflow-hidden border-2 border-ink shadow-hard-sm sm:grid-cols-[1fr_auto]",
                    theme.wash,
                  )}
                >
                  <div className={cn("min-w-0", theme.listHeader)}>
                    <p className={cn("tag", theme.listHeaderMuted)}>#{index + 1}</p>
                    <p className="mt-1 truncate font-display text-sm font-black uppercase text-ink">
                      {job.company}
                    </p>
                    <p className={cn("truncate text-[0.9rem]", theme.listHeaderMuted)}>
                      {job.title}
                    </p>
                    {!job.applicationUrl && (
                      <p className="tag mt-2 text-pink">No direct application link</p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex flex-wrap content-center gap-2 px-3 py-3 sm:flex-col sm:justify-center sm:px-4",
                      theme.wash,
                    )}
                  >
                    <button type="button" onClick={() => onPrepare(job)} className={theme.primaryBtnSm}>
                      Prepare
                    </button>
                    <button type="button" onClick={() => onRemove(job.id)} className={theme.paperBtnSm}>
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
