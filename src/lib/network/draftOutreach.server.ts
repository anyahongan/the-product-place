import { createServerFn } from "@tanstack/react-start";
import { fetchOpenAiJson } from "@/lib/ai/openaiJson";
import { buildOutreachDraftLocal, type OutreachProfile } from "@/lib/network/outreachDraftLocal";
import type { NetworkContact, OutreachDraft } from "@/types/network";
import { loadProfileBundle } from "@/lib/profile/profileRepository";

type DraftPayload = {
  userId: string;
  contact: NetworkContact;
  kind: OutreachDraft["kind"];
  companyName: string;
  roleTitle: string;
  useAi: boolean;
};

async function draftWithOpenAI(input: {
  contact: NetworkContact;
  kind: OutreachDraft["kind"];
  profile: OutreachProfile;
  companyName: string;
  roleTitle: string;
}): Promise<OutreachDraft | null> {
  const ai = await fetchOpenAiJson<{ subject?: string; body?: string }>(
    `You write concise, professional networking emails for PM internship outreach at The Product Place.
Use ONLY provided facts. Never invent meetings, referrals, or shared connections.
Return JSON: { "subject": string, "body": string }`,
    JSON.stringify(
      {
        kind: input.kind,
        contact: {
          name: input.contact.name,
          title: input.contact.title,
          type: input.contact.contactType,
          isRecruiter: input.contact.isRecruiter,
          isCampusRecruiter: input.contact.isCampusRecruiter,
          schoolRelationship: input.contact.schoolRelationship,
        },
        sender: input.profile,
        company: input.companyName,
        role: input.roleTitle,
      },
      null,
      2,
    ),
  );
  if (!ai?.subject || !ai.body) return null;
  return {
    kind: input.kind,
    to: input.contact.name,
    subject: ai.subject,
    body: ai.body,
  };
}

export const draftOutreachFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid payload");
    const d = data as Record<string, unknown>;
    if (typeof d["userId"] !== "string") throw new Error("Missing user");
    if (!d["contact"] || typeof d["contact"] !== "object") throw new Error("Missing contact");
    return {
      userId: d["userId"] as string,
      contact: d["contact"] as NetworkContact,
      kind: d["kind"] as OutreachDraft["kind"],
      companyName: String(d["companyName"] ?? "the company"),
      roleTitle: String(d["roleTitle"] ?? "a product internship"),
      useAi: Boolean(d["useAi"]),
    } satisfies DraftPayload;
  })
  .handler(async ({ data }): Promise<OutreachDraft> => {
    const bundle = await loadProfileBundle(data.userId);
    const profile: OutreachProfile = {
      preferredName: bundle.profile.preferredName,
      school: bundle.profile.school,
      major: bundle.profile.major,
      preferredEmail: bundle.profile.preferredEmail,
    };

    const local = buildOutreachDraftLocal({
      contact: data.contact,
      kind: data.kind,
      profile,
      companyName: data.companyName,
      roleTitle: data.roleTitle,
      format: data.useAi ? { mode: "ai", template: null, setAt: new Date().toISOString() } : null,
    });

    if (!data.useAi) return local;

    try {
      const ai = await draftWithOpenAI({
        contact: data.contact,
        kind: data.kind,
        profile,
        companyName: data.companyName,
        roleTitle: data.roleTitle,
      });
      if (ai) return ai;
    } catch {
      /* fallback */
    }
    return local;
  });
