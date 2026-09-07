import type { ApplicationRecord } from "@/lib/apply/types";

/** An application with an active OA window — status set or due date not yet completed. */
export function isOpenOnlineAssessment(app: ApplicationRecord): boolean {
  if (app.onlineAssessment.completed) return false;
  if (app.currentStatus === "Online Assessment") return true;
  return Boolean(app.onlineAssessment.dueDate?.trim());
}

export function openOnlineAssessments(apps: ApplicationRecord[]): ApplicationRecord[] {
  return apps
    .filter(isOpenOnlineAssessment)
    .sort((a, b) => {
      const ad = a.onlineAssessment.dueDate;
      const bd = b.onlineAssessment.dueDate;
      if (ad && bd) return ad.localeCompare(bd);
      if (ad) return -1;
      if (bd) return 1;
      return a.company.localeCompare(b.company);
    });
}
