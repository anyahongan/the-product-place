import type { CommunicationFormatPreference, NetworkContact, OutreachDraft } from "@/types/network";
import type { ProfileBasics, ProfileApplicationDetails } from "@/types/profile";

export type OutreachProfile = Pick<ProfileBasics, "preferredName" | "school" | "major"> &
  Pick<ProfileApplicationDetails, "preferredEmail">;

export function buildOutreachDraftLocal(input: {
  contact: NetworkContact;
  kind: OutreachDraft["kind"];
  format?: CommunicationFormatPreference | null;
  profile: OutreachProfile;
  companyName: string;
  roleTitle: string;
}): OutreachDraft {
  const { contact, kind, format, profile, companyName, roleTitle } = input;
  const firstName = contact.name.split(" ")[0] ?? contact.name;
  const sender = profile.preferredName.trim() || "there";
  const school = profile.school.trim() || "my university";
  const major = profile.major.trim() || "my field";

  const reason =
    contact.isCampusRecruiter || contact.contactType === "CAMPUS RECRUITER"
      ? `you lead campus recruiting for product at ${companyName}`
      : contact.isRecruiter
        ? `you recruit for product roles at ${companyName}`
        : contact.contactType === "PRODUCT MANAGER"
          ? `of your product work at ${companyName}`
          : contact.schoolRelationship?.toLowerCase().includes("alum")
            ? `you are an alum from ${school} on the ${companyName} team`
            : contact.contactType === "FORMER INTERN"
              ? `you were a former intern at ${companyName}`
              : `of your role as ${contact.title} at ${companyName}`;

  if (format?.mode === "template" && format.template) {
    const filled = format.template
      .replaceAll("[First Name]", firstName)
      .replaceAll("[Company]", companyName)
      .replaceAll("[Role]", roleTitle)
      .replaceAll("[Your Name]", sender)
      .replaceAll("[Major]", major)
      .replaceAll("[School]", school)
      .replaceAll("[Field]", "product management")
      .replaceAll("[Specific Reason]", reason);
    const subjectPrefix =
      kind === "FOLLOW-UP"
        ? "Following up"
        : kind === "THANK-YOU"
          ? "Thank you"
          : kind === "REFERRAL FOLLOW-UP"
            ? "Referral next steps"
            : "Introduction";
    return {
      kind,
      to: contact.name,
      subject: `${subjectPrefix}: ${companyName}`,
      body: filled,
    };
  }

  if (kind === "FOLLOW-UP") {
    return {
      kind,
      to: contact.name,
      subject: `Following up: ${companyName}`,
      body: `Hi ${firstName},\n\nI hope you are having a good day. I wanted to follow up on my note about the ${roleTitle} role at ${companyName}. I remain very interested and would appreciate any guidance you can share.\n\nThank you,\n${sender}`,
    };
  }
  if (kind === "THANK-YOU") {
    return {
      kind,
      to: contact.name,
      subject: `Thank you for our conversation about ${companyName}`,
      body: `Hi ${firstName},\n\nThank you for taking the time to speak with me about ${companyName}. I appreciated your perspective and will incorporate it into my application materials.\n\nBest,\n${sender}`,
    };
  }
  if (kind === "REFERRAL FOLLOW-UP") {
    return {
      kind,
      to: contact.name,
      subject: `Referral next steps at ${companyName}`,
      body: `Hi ${firstName},\n\nChecking in on the referral we discussed for the ${roleTitle} role at ${companyName}. Please let me know if any materials would help on your side.\n\nThank you,\n${sender}`,
    };
  }
  return {
    kind: "COLD OUTREACH",
    to: contact.name,
    subject: `${companyName} ${roleTitle} introduction`,
    body: `Hi ${firstName},\n\nMy name is ${sender}, and I am a ${major} student at ${school} interested in product management. I wanted to reach out because ${reason}. I am preparing an application for ${roleTitle} at ${companyName} and would value 15 minutes to learn what makes a strong candidate.\n\nThank you,\n${sender}`,
  };
}
