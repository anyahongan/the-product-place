/**
 * Future Quick Apply / materials aggregator.
 * Returns structured user facts only — no AI generation.
 */
import { loadProfileBundle } from "@/lib/profile/profileRepository";
import type { UserProfileBundle } from "@/types/profile";
import { loadPersonalFromSupabase } from "@/lib/supabase/personalDataRepository";

export type ApplicationContext = {
  jobId: string | null;
  profile: UserProfileBundle["profile"];
  targets: UserProfileBundle["targets"];
  masterResume: UserProfileBundle["masterResume"];
  experiences: UserProfileBundle["experiences"];
  standardAnswers: UserProfileBundle["answers"];
  /** Network insights already marked for application materials, when a job/application is known. */
  networkInsights: {
    noteId: string;
    text: string;
    contactName: string | null;
    applicationId: string | null;
  }[];
};

/**
 * Plain data helper for a future Quick Apply workflow.
 * Does not invent facts. Does not call LLMs.
 */
export async function getApplicationContext(
  userId: string,
  jobId?: string | null,
): Promise<ApplicationContext> {
  const bundle = await loadProfileBundle(userId);
  const personal = await loadPersonalFromSupabase(userId);

  const relatedAppIds = new Set<string>();
  if (jobId && personal) {
    for (const app of personal.apps) {
      if (app.jobId === jobId) relatedAppIds.add(app.applicationId);
    }
  }

  const networkInsights =
    personal?.notes
      .filter((n) => n.useForApplicationMaterials)
      .filter(
        (n) =>
          relatedAppIds.size === 0 ||
          n.relatedApplicationIds.some((id) => relatedAppIds.has(id)),
      )
      .map((n) => {
        const contact = personal.contacts.find((c) => c.id === n.contactId);
        return {
          noteId: n.id,
          text: n.text,
          contactName: contact?.name ?? null,
          applicationId: n.relatedApplicationIds[0] ?? null,
        };
      }) ?? [];

  return {
    jobId: jobId ?? null,
    profile: bundle.profile,
    targets: bundle.targets,
    masterResume: bundle.masterResume,
    experiences: bundle.experiences,
    standardAnswers: bundle.answers,
    networkInsights,
  };
}
