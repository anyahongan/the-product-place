/** Behavioral mock quick guide — original Product Place framing inspired by common recruiting wisdom. */

export const BEHAVIORAL_STRENGTHS_GUIDE = {
  title: "Your non-tech strengths",
  body: "Prior industry experience, domain expertise from other roles (customer facing, business, consulting, design), user empathy, business instincts, cross-functional thinking. These aren’t consolation prizes — they’re what make you unique.",
  tips: [
    "Translate each strength into a PM decision you owned — not a résumé slogan.",
    "Proof > adjectives: situation → constraint → decision → outcome.",
    "Name the stakeholder conflict or scarce resource; that’s where judgment shows.",
  ],
};

export type ClosingQuestionCard = {
  id: string;
  question: string;
  note: string;
};

export const CLOSING_QUESTION_CARDS: ClosingQuestionCard[] = [
  {
    id: "elevate",
    question:
      "Is there any additional information I can provide that would elevate your confidence in me as a candidate?",
    note: "Positive framing — invites them to name gaps you can still close in the room.",
  },
  {
    id: "pause",
    question: "Is there anything about my background that gives you pause about my candidacy?",
    note: "Brave. Use only with real rapport. Listen fully before defending.",
  },
  {
    id: "best-employee",
    question: "What qualities does your best employee have that you’d like to see emulated?",
    note: "Surfaces culture and bar — then mirror with a short proof story.",
  },
  {
    id: "challenge",
    question: "What do you think would be a challenge for me in this role?",
    note: "Shows self-awareness. Follow with how you’d ramp on that challenge.",
  },
  {
    id: "success",
    question: "What does success in this role look like?",
    note: "Classic closer. Pair with “Why do you like working here?” if time allows.",
  },
];

export const MOCK_TECHNICAL_PROMPTS = [
  {
    id: "mt-api",
    title: "Explain an API to a non-engineer",
    prompt:
      "In plain language: what is an API, and how would you explain frontend vs backend when a “simple button” turns into a multi-week project?",
  },
  {
    id: "mt-metric",
    title: "Instrument a feature",
    prompt:
      "You’re shipping a new onboarding checklist. What events would you log, what’s the primary success metric, and what guardrails matter?",
  },
  {
    id: "mt-tradeoff",
    title: "Tech tradeoff call",
    prompt:
      "Engineering can ship a hacky solution in 3 days or a scalable one in 3 weeks. How do you decide? What do you write down?",
  },
  {
    id: "mt-debug",
    title: "Metric drop diagnosis",
    prompt:
      "Weekly retention dropped 8% after a release. Walk through how you’d diagnose before proposing a fix.",
  },
];

export const MOCK_BEHAVIORAL_PROMPTS = [
  {
    id: "mb-conflict",
    title: "Disagreement with eng/design",
    prompt:
      "Tell me about a time you disagreed with engineering or design. What was the decision, and what did you optimize for?",
  },
  {
    id: "mb-influence",
    title: "Influence without authority",
    prompt:
      "Describe a time you had to influence a decision without formal authority. What did you do differently than “being louder”?",
  },
  {
    id: "mb-strength",
    title: "Non-tech strength as PM proof",
    prompt:
      "Pick one non-technical strength (domain, customer-facing, ops, consulting, design). Tell a story that proves it as PM judgment — decision included.",
  },
  {
    id: "mb-closing",
    title: "Your closing questions",
    prompt:
      "You’re at the end of an interview. Which two closing questions do you ask, in your own words, and why those two?",
  },
];
