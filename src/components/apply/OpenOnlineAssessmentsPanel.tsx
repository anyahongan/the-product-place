import { Link } from "@tanstack/react-router";
import { formatShortDate } from "@/data/apply";
import { getOnlineAssessmentGuide } from "@/lib/apply/onlineAssessmentGuides";
import { openOnlineAssessments } from "@/lib/apply/openOnlineAssessments";
import type { ApplicationRecord } from "@/lib/apply/types";
import { cn } from "@/lib/utils";

export function OpenOnlineAssessmentsPanel({
  apps,
  className,
  onOpenGuidance,
}: {
  apps: ApplicationRecord[];
  className?: string;
  /** When set, "Guidance" opens the OA modal instead of navigating away. */
  onOpenGuidance?: (app: ApplicationRecord) => void;
}) {
  const open = openOnlineAssessments(apps);
  if (open.length === 0) return null;

  return (
    <section className={cn("border-2 border-ink bg-purple/10 px-4 py-4 sm:px-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tag text-purple">Open online assessments</p>
          <h2 className="mt-1 font-display text-lg font-black uppercase text-ink">
            Practice for your active OAs
          </h2>
          <p className="mt-1 text-[0.9rem] text-ink-soft">
            Company-specific prompts modeled on reported OA formats — not the general question bank.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {open.map((app) => {
          const guide = getOnlineAssessmentGuide(app.company);
          return (
            <li
              key={app.applicationId}
              className="flex flex-col gap-3 border-2 border-ink bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-display text-base font-black uppercase text-ink">{app.company}</p>
                <p className="text-[0.9rem] text-ink-soft">{app.title}</p>
                <p className="tag mt-1 text-ink-faint">
                  {guide.oaType}
                  {app.onlineAssessment.dueDate && !app.onlineAssessment.completed
                    ? ` · Due ${formatShortDate(app.onlineAssessment.dueDate)}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/practice"
                  search={{
                    mode: "oa",
                    company: app.company,
                    appId: app.applicationId,
                    oa: "1",
                  }}
                  className="focus-ink border-2 border-ink bg-yellow px-3 py-2 font-display text-xs font-black uppercase text-ink outline-none hover:bg-ink hover:text-paper"
                >
                  OA prep →
                </Link>
                {onOpenGuidance ? (
                  <button
                    type="button"
                    onClick={() => onOpenGuidance(app)}
                    className="focus-ink border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-black uppercase text-ink outline-none hover:bg-blue-wash"
                  >
                    Guidance
                  </button>
                ) : (
                  <Link
                    to="/apply"
                    search={{ tab: "applied" }}
                    className="focus-ink border-2 border-ink bg-paper px-3 py-2 font-display text-xs font-black uppercase text-ink outline-none hover:bg-blue-wash"
                  >
                    Application →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
