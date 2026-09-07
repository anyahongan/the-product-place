import {
  generateApplyMaterialsLocally,
  type ApplyMaterialsResult,
  type ApplyMaterialsTemplates,
} from "@/lib/apply/generateApplyMaterials";
import { generateApplyMaterialsFn } from "@/lib/apply/generateApplyMaterials.server";
import { plainJobDescription } from "@/lib/apply/plainJobText";
import type { JobListingView } from "@/lib/apply/types";
import type { UserProfileBundle } from "@/types/profile";

function jobPayload(job: JobListingView) {
  return {
    company: job.company,
    title: job.title,
    description: plainJobDescription(job.description),
    productRole: job.productRole,
    responsibilities: job.responsibilities.map((item) => plainJobDescription(item)),
  };
}

function localInput(
  profileBundle: UserProfileBundle,
  job: JobListingView,
  templates?: ApplyMaterialsTemplates,
) {
  return {
    profile: profileBundle.profile,
    experiences: profileBundle.experiences,
    standardAnswers: profileBundle.answers,
    networkInsights: [] as { text: string; contactName: string | null }[],
    job: jobPayload(job),
    templates,
  };
}

export async function generateMaterialsForJob(input: {
  userId: string | null;
  profileBundle: UserProfileBundle | null;
  job: JobListingView;
  templates?: ApplyMaterialsTemplates;
}): Promise<ApplyMaterialsResult> {
  if (!input.profileBundle) {
    throw new Error("Complete your Profile first to generate materials.");
  }

  const payload = {
    jobId: input.job.id,
    job: jobPayload(input.job),
    profile: input.profileBundle.profile,
    experiences: input.profileBundle.experiences,
    standardAnswers: input.profileBundle.answers,
    networkInsights: [] as { text: string; contactName: string | null }[],
    resumeTemplate: input.templates?.resumeTemplate ?? null,
    coverLetterTemplate: input.templates?.coverLetterTemplate ?? null,
  };

  try {
    return await generateApplyMaterialsFn({ data: payload });
  } catch {
    return generateApplyMaterialsLocally(localInput(input.profileBundle, input.job, input.templates));
  }
}
