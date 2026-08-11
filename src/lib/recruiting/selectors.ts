import type { ApplicationRecord } from "@/lib/apply/types";
import type { NetworkContact, NetworkNote } from "@/types/network";

export function notesForApplicationMaterials(
  notes: NetworkNote[],
  applicationId: string,
): NetworkNote[] {
  return notes.filter(
    (n) =>
      n.relatedApplicationIds.includes(applicationId) && n.useForApplicationMaterials,
  );
}

export function notesForInterviewPrep(
  notes: NetworkNote[],
  applicationId: string,
): NetworkNote[] {
  return notes.filter(
    (n) => n.relatedApplicationIds.includes(applicationId) && n.useForInterviewPrep,
  );
}

export function referralContactsForApplication(
  contacts: NetworkContact[],
  applicationId: string,
): NetworkContact[] {
  return contacts.filter(
    (c) =>
      c.relatedApplicationIds.includes(applicationId) &&
      (c.referralStatus === "SUBMITTED" ||
        c.referralStatus === "OFFERED" ||
        c.referralStatus === "REQUESTED"),
  );
}

export function applicationsForCompany(
  apps: ApplicationRecord[],
  companyId: string,
): ApplicationRecord[] {
  return apps.filter((a) => a.companyId === companyId);
}

export function contactById(
  contacts: NetworkContact[],
  id: string,
): NetworkContact | undefined {
  return contacts.find((c) => c.id === id);
}
