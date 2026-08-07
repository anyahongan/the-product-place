export type Deadline = {
  id: string;
  company: string;
  role: string;
  deadline: string;
  due: string;
  grad: string;
  status: "Not started" | "Drafting" | "Submitted" | "Interviewing";
  tone: "blue" | "green" | "pink" | "yellow" | "purple";
};

export const deadlines: Deadline[] = [
  {
    id: "d1",
    company: "Northline Labs",
    role: "APM Intern — Summer",
    deadline: "Oct 14",
    due: "in 6 days",
    grad: "'27 · '28",
    status: "Drafting",
    tone: "blue",
  },
  {
    id: "d2",
    company: "Marrow & Co.",
    role: "Product Intern, Growth",
    deadline: "Oct 21",
    due: "in 13 days",
    grad: "'27 only",
    status: "Not started",
    tone: "pink",
  },
  {
    id: "d3",
    company: "Verdant Health",
    role: "PM Intern, Patient Apps",
    deadline: "Oct 30",
    due: "in 22 days",
    grad: "'26 – '28",
    status: "Submitted",
    tone: "green",
  },
  {
    id: "d4",
    company: "Foldwell",
    role: "Associate PM Intern",
    deadline: "Nov 04",
    due: "in 27 days",
    grad: "'28",
    status: "Interviewing",
    tone: "purple",
  },
];

export const dailyFive = {
  kicker: "Daily five-minute",
  edition: "No. 128",
  date: "Friday, October 8",
  topic: "On-device inference",
  subtitle: "Why teams are moving models off the server and onto the phone",
  readingTime: "5 min read",
  explainer:
    "On-device inference runs a model directly on a user's phone or laptop instead of a remote server. Smaller distilled models plus dedicated neural chips make this practical: responses arrive in milliseconds, work offline, and never leave the device. The tradeoff is capability — a phone-sized model is narrower than its cloud counterpart, so teams route the hard cases upstream.",
  whyItMatters:
    "It changes the unit economics of an AI feature. If eighty percent of requests can be answered locally, your per-user inference cost collapses and latency stops being a design constraint. It also unlocks a privacy story you can put in front of enterprise buyers without asterisks.",
  takeaways: [
    "Cost per request stops scaling linearly with usage — model your infra spend as a hybrid split, not a flat rate.",
    "Offline capability becomes a feature you can ship, not a caveat you apologise for.",
  ],
  source: "Notebook entry · adapted from an engineering blog",
  margin: "ask: what % of our calls are actually simple?",
};

export const networkActivity = [
  {
    id: "n1",
    name: "Priya Raman",
    role: "Sr. PM · Northline Labs",
    note: "Replied — happy to chat Thursday",
    state: "replied" as const,
    when: "2d ago",
  },
  {
    id: "n2",
    name: "Marcus Feld",
    role: "APM · Foldwell",
    note: "Cold email sent, referenced his teardown post",
    state: "waiting" as const,
    when: "5d ago",
  },
  {
    id: "n3",
    name: "Dana Oyelaran",
    role: "Director of Product · Verdant",
    note: "Follow up — she offered a referral",
    state: "todo" as const,
    when: "today",
  },
];

export const lesson = {
  track: "Frameworks",
  title: "Opportunity sizing without lying with numbers",
  chapter: "Chapter 4 of 7",
  progress: 57,
  note: "you left off mid-example",
};

export const projectPrompt = {
  label: "Project prompt no. 09",
  title:
    "Design a way for two people in different timezones to decide on one thing together.",
  constraints: [
    "No group chat. No polls.",
    "Ship a case study, not a mockup.",
    "One week, scoped to a single decision type.",
  ],
};

export const practicePaths = [
  {
    id: "sense",
    title: "Product Sense",
    prompt: "Design a reading app for someone who has stopped finishing books.",
    count: "24 prompts",
    tone: "blue" as const,
  },
  {
    id: "metrics",
    title: "Execution & Metrics",
    prompt: "Signups are flat but activation is up 9%. What do you look at?",
    count: "18 prompts",
    tone: "green" as const,
  },
  {
    id: "behavioral",
    title: "Behavioral",
    prompt: "Tell me about a decision you made with incomplete information.",
    count: "31 prompts",
    tone: "pink" as const,
  },
  {
    id: "case",
    title: "Case Studies",
    prompt: "A marketplace has supply, demand, and no repeat usage. Diagnose.",
    count: "12 walkthroughs",
    tone: "purple" as const,
  },
];

export const starterTasks = [
  { id: "t1", text: "Finish Northline cover letter", done: false },
  { id: "t2", text: "Reply to Priya about Thursday", done: false },
  { id: "t3", text: "Read the Daily Five-Minute", done: true },
  { id: "t4", text: "One product-sense prompt out loud", done: false },
];
