import { generateApplyMaterialsLocally } from "@/lib/apply/generateApplyMaterials";
import { generateApplyMaterialsFn } from "@/lib/apply/generateApplyMaterials.server";
import type { ApplyMaterialsResult } from "@/lib/apply/generateApplyMaterials";
import type { JobListingView } from "@/lib/apply/types";
import type { UserProfileBundle } from "@/types/profile";

export async function generateMaterialsForJob(input: {
  userId: string | null;
  profileBundle: UserProfileBundle | null;
  job: JobListingView;
}): Promise<ApplyMaterialsResult> {
  const jobPayload = {
    company: input.job.company,
    title: input.job.title,
    description: input.job.description,
    productRole: input.job.productRole,
    responsibilities: input.job.responsibilities,
  };

  if (input.userId) {
    return generateApplyMaterialsFn({
      data: {
        userId: input.userId,
        jobId: input.job.id,
        job: jobPayload,
      },
    });
  }

  if (!input.profileBundle) {
    throw new Error("Sign in and complete Profile to generate materials.");
  }

  return generateApplyMaterialsLocally({
    profile: input.profileBundle.profile,
    experiences: input.profileBundle.experiences,
    standardAnswers: input.profileBundle.answers,
    networkInsights: [],
    job: jobPayload,
  });
}
