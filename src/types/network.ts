export type NetworkView = "contacts" | "follow-ups" | "conversations";

/** Company selector value for the unfiltered network-wide view. */
export const ALL_NETWORK_COMPANIES_ID = "all";

export type ContactType =
  "RECRUITER" | "CAMPUS RECRUITER" | "PRODUCT MANAGER" | "FORMER INTERN" | "ALUM" | "OTHER";

export type RelationshipStatus =
  | "Not contacted"
  | "Outreach drafted"
  | "Contacted"
  | "Replied"
  | "Meeting scheduled"
  | "Met"
  | "Follow-up needed"
  | "Referral secured"
  | "Closed / no action";

export type NextAction =
  | "Draft intro"
  | "Send intro"
  | "Wait"
  | "Follow up"
  | "Prep for meeting"
  | "Send thank-you"
  | "Ask about referral"
  | "Check in later"
  | "No action";

export type ReferralStatus =
  "NOT DISCUSSED" | "MAYBE" | "OFFERED" | "REQUESTED" | "SUBMITTED" | "DECLINED" | "NOT APPLICABLE";

export type TimelineEventType =
  | "cold-email"
  | "follow-up"
  | "reply"
  | "meeting-scheduled"
  | "meeting-completed"
  | "thank-you-draft"
  | "thank-you-sent"
  | "note"
  | "suggested-follow-up";

export type NoteType =
  "GENERAL" | "APPLICATION INSIGHT" | "INTERVIEW INSIGHT" | "FOLLOW-UP" | "REFERRAL";

export type OutreachKind = "COLD OUTREACH" | "FOLLOW-UP" | "THANK-YOU" | "REFERRAL FOLLOW-UP";

export type MatchReason =
  | "Campus Recruiter"
  | "University Recruiter"
  | "School alum"
  | "2nd-degree connection"
  | "Same major"
  | "Similar previous company"
  | "Similar student organization"
  | "Product team"
  | "Relevant product area"
  | "Former intern"
  | "Same location"
  | "Shared professional interest";

export type NetworkCompany = {
  id: string;
  name: string;
  tone: "blue" | "green" | "pink" | "yellow" | "purple";
};

export type NetworkApplication = {
  id: string;
  companyId: string;
  role: string;
  status: "Preparing" | "Applied" | "Waiting" | "Interviewing" | "Offer" | "Rejected";
  dateApplied: string | null;
};

export type TimelineEvent = {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  detail?: string;
  emailSubject?: string;
  emailBody?: string;
  meetingTime?: string;
  /** Optional link to a shared ApplicationRecord */
  applicationId?: string;
};

export type NetworkNote = {
  id: string;
  contactId: string;
  companyId: string;
  relatedApplicationIds: string[];
  /** ISO date the user learned / captured this info */
  learnedAt: string;
  /** Optional link to a communication timeline event (call, meeting, email) */
  relatedTimelineEventId: string | null;
  type: NoteType;
  text: string;
  createdAt: string;
  useForApplicationMaterials: boolean;
  useForInterviewPrep: boolean;
};

export type CommunicationFormatMode = "ai" | "template";

export type CommunicationFormatPreference = {
  mode: CommunicationFormatMode;
  template: string | null;
  setAt: string;
};

export type NetworkContact = {
  id: string;
  companyId: string;
  name: string;
  title: string;
  /** Public LinkedIn profile URL when known. */
  linkedinUrl: string | null;
  contactType: ContactType;
  isRecruiter: boolean;
  isCampusRecruiter: boolean;
  schoolRelationship: string | null;
  connectionDegree: "1st" | "2nd" | "3rd+" | null;
  backgroundSimilarities: string[];
  relatedApplicationIds: string[];
  relationshipStatus: RelationshipStatus;
  nextAction: NextAction;
  lastContacted: string | null;
  nextFollowUp: string | null;
  meetingDate: string | null;
  referralStatus: ReferralStatus;
  notes: string;
  timeline: TimelineEvent[];
  isRecommended: boolean;
  matchScore: number | null;
  matchReasons: MatchReason[];
  tone: "blue" | "green" | "pink" | "yellow" | "purple";
};

export type OutreachDraft = {
  kind: OutreachKind;
  to: string;
  subject: string;
  body: string;
};
