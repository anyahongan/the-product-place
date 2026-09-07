import type { PracticeQuestion } from "@/lib/learning/types";
import { getPracticeQuestion } from "@/lib/learning/content";

export type OAQuestionSection =
  | "Product scenarios"
  | "Metrics & prioritization"
  | "Written response"
  | "Work style";

export type OnlineAssessmentQuestion = PracticeQuestion & {
  oaSection: OAQuestionSection;
  companySlug: string;
};

function normCompany(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function companySlugForOA(company: string): string {
  const key = normCompany(company);
  if (key.includes("robinhood")) return "robinhood";
  if (key.includes("google")) return "google";
  if (key.includes("meta") || key.includes("facebook")) return "meta";
  if (key.includes("amazon")) return "amazon";
  return "generic";
}

const ROBINHOOD: OnlineAssessmentQuestion[] = [
  {
    id: "oa-rh-mc-trust-drop",
    title: "First-trade completion drop",
    prompt:
      "Robinhood sees a 12% drop in first-trade completion among users who signed up in the last 14 days. The product team suspects a recent UI change to the order confirmation screen. What is the best first step?",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Metrics & prioritization",
    companySlug: "robinhood",
    competencies: ["diagnosing-metrics", "interview-execution"],
    relatedLessonIds: ["lesson-diagnose-drop"],
    relatedCreateTemplateIds: ["experiment-plan"],
    rubric: ["Validate the metric before shipping fixes.", "Segment new-user cohorts."],
    choices: [
      { id: "a", label: "Revert the confirmation UI immediately for all users." },
      {
        id: "b",
        label: "Confirm metric definition, check data quality, and segment by platform, acquisition channel, and funnel step.",
      },
      { id: "c", label: "Launch a referral bonus to offset the drop." },
      { id: "d", label: "Add more crypto assets to the homepage." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Robinhood OAs often test disciplined diagnosis under time pressure — verify the number, localize the drop, then hypothesize about the confirmation UI change.",
  },
  {
    id: "oa-rh-mc-prioritize",
    title: "Regulated broker backlog",
    prompt:
      "You are a Robinhood PM intern. The team can ship only ONE of these in the next sprint. Compliance says all options are feasible. Which do you prioritize?",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Product scenarios",
    companySlug: "robinhood",
    competencies: ["prioritization", "interview-execution"],
    relatedLessonIds: ["lesson-prioritize"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: ["Name user + risk.", "Tie pick to measurable outcome.", "Acknowledge tradeoff."],
    choices: [
      { id: "a", label: "Instant deposit limit increase for verified accounts." },
      { id: "b", label: "Pre-trade risk disclosure copy on options orders." },
      { id: "c", label: "Dark mode for the portfolio chart." },
      { id: "d", label: "Social feed for sharing trade screenshots." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Fintech OAs reward trust and regulatory awareness. Options disclosure reduces harm for newer traders — a common Robinhood tension point.",
  },
  {
    id: "oa-rh-open-onboarding",
    title: "Onboarding trust (written)",
    prompt:
      "Robinhood’s online assessment may include a short written response (~150–250 words). How would you improve first-week onboarding so new investors feel informed — not overwhelmed — before their first trade? Structure: user → problem → 2 options → recommendation → success metric.",
    category: "product-sense",
    difficulty: "standard",
    estimatedMinutes: 8,
    oaSection: "Written response",
    companySlug: "robinhood",
    competencies: ["interview-product-sense", "pain-points", "feature-ideation"],
    relatedLessonIds: ["lesson-product-sense", "lesson-user-problem"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: [
      "Names a specific new-investor segment.",
      "States a clear trust or comprehension problem.",
      "Compares options with tradeoffs.",
      "Picks one with rationale.",
      "Defines a measurable success metric.",
    ],
  },
  {
    id: "oa-rh-cb-metrics",
    title: "Recurring invest launch metrics",
    prompt:
      "Robinhood is launching recurring investments (auto-buy weekly). Select ALL metrics you would monitor in the first 30 days.",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 3,
    format: "checkbox",
    oaSection: "Metrics & prioritization",
    companySlug: "robinhood",
    competencies: ["north-star-metrics", "interview-execution"],
    relatedLessonIds: ["lesson-choose-metrics"],
    relatedCreateTemplateIds: ["experiment-plan"],
    rubric: ["Mix outcome + guardrail metrics.", "Avoid vanity counts alone."],
    choices: [
      { id: "a", label: "% of eligible users who enable recurring invest" },
      { id: "b", label: "Weekly active recurring investors (completed buys)" },
      { id: "c", label: "Support tickets about unexpected charges" },
      { id: "d", label: "Total app store screenshot downloads" },
      { id: "e", label: "Chargeback / dispute rate on recurring funding" },
    ],
    correctChoiceIds: ["a", "b", "c", "e"],
    choiceExplanation:
      "Adoption, retained usage, support load, and payment disputes cover growth and trust — typical analytical OA checklist thinking.",
  },
  {
    id: "oa-rh-mc-workstyle",
    title: "Work style — ambiguous spec",
    prompt:
      "Your Robinhood mentor gives you a one-line spec: ‘Make options easier for beginners.’ You have 48 hours before a review. What do you do first?",
    category: "behavioral",
    difficulty: "warmup",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Work style",
    companySlug: "robinhood",
    competencies: ["executive-communication", "interview-behavioral"],
    relatedLessonIds: [],
    relatedCreateTemplateIds: ["interview-prep"],
    rubric: ["Clarify before building.", "Show structured thinking."],
    choices: [
      { id: "a", label: "Wireframe six screens and pick the prettiest one." },
      {
        id: "b",
        label: "Write assumptions, list user risks, draft 2–3 scoped directions, and schedule a 15-min alignment check.",
      },
      { id: "c", label: "Copy a competitor’s options flow verbatim." },
      { id: "d", label: "Wait until someone sends a full PRD." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Work-style sections reward proactive clarity on ambiguous fintech problems — not waiting or over-building.",
  },
];

const GOOGLE: OnlineAssessmentQuestion[] = [
  {
    id: "oa-goog-mc-youtube",
    title: "YouTube teen watch time",
    prompt:
      "YouTube watch time among users 13–17 dropped 5% week-over-week globally after a homepage ranking change. What is the best first move?",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Metrics & prioritization",
    companySlug: "google",
    competencies: ["diagnosing-metrics", "interview-execution"],
    relatedLessonIds: ["lesson-diagnose-drop"],
    relatedCreateTemplateIds: ["experiment-plan"],
    rubric: ["Diagnose before fixing.", "Segment cohorts."],
    choices: [
      { id: "a", label: "Revert the ranking model for all users worldwide." },
      {
        id: "b",
        label: "Validate the metric, check experiment exposure, and slice by country, platform, and content category.",
      },
      { id: "c", label: "Launch a new YouTube Shorts creator fund." },
      { id: "d", label: "Increase ad load to recover watch time." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Google OAs frequently test metric diagnosis at scale — confirm the experiment read before proposing product changes.",
  },
  {
    id: "oa-goog-open-maps",
    title: "Google Maps for new students (written)",
    prompt:
      "Write a structured response (~150–250 words): How would you improve Google Maps for college freshmen navigating a campus they’ve never visited? Include user, problem, solution sketch, and how you’d measure success in the first semester.",
    category: "product-sense",
    difficulty: "standard",
    estimatedMinutes: 8,
    oaSection: "Written response",
    companySlug: "google",
    competencies: ["interview-product-sense", "feature-ideation"],
    relatedLessonIds: ["lesson-product-sense"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: [
      "Specific user context.",
      "Clear pain on a real Google surface.",
      "Feasible improvement.",
      "Measurable success criteria.",
    ],
  },
  {
    id: "oa-goog-mc-gmail",
    title: "Gmail feature success metric",
    prompt:
      "Your team shipped ‘Schedule send reminders’ in Gmail mobile. Which is the strongest primary success metric for a 6-week readout?",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Metrics & prioritization",
    companySlug: "google",
    competencies: ["north-star-metrics", "interview-execution"],
    relatedLessonIds: ["lesson-choose-metrics"],
    relatedCreateTemplateIds: ["experiment-plan"],
    rubric: ["Outcome over vanity.", "Tied to user value."],
    choices: [
      { id: "a", label: "Number of marketing blog posts about the feature." },
      { id: "b", label: "% of scheduled sends that are successfully delivered without user undo" },
      { id: "c", label: "Total Gmail MAU worldwide." },
      { id: "d", label: "Lines of code added in the release." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Google analytical items want metrics tied to the feature’s job — successful scheduled delivery, not broad MAU.",
  },
  {
    id: "oa-goog-mc-improve",
    title: "Improve a Google product",
    prompt:
      "A Google PM OA asks: ‘Pick one Google product and improve it for students.’ Which opening line is strongest?",
    category: "product-sense",
    difficulty: "warmup",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Product scenarios",
    companySlug: "google",
    competencies: ["interview-product-sense", "user-segmentation"],
    relatedLessonIds: ["lesson-segmentation", "lesson-product-sense"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: ["Segment first.", "Problem before solution."],
    choices: [
      { id: "a", label: "Google should use AI for everything — here are ten features." },
      {
        id: "b",
        label: "Junior CS majors preparing for internships struggle to find past interview questions in Search — I’d focus on that job-to-be-done.",
      },
      { id: "c", label: "Students want more colors in the UI." },
      { id: "d", label: "I’d copy Notion because it’s trendy." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Strong Google OA answers anchor on a specific user job on a real surface before ideating.",
  },
  {
    id: "oa-goog-cb-experiment",
    title: "Experiment read checklist",
    prompt:
      "A Search results experiment shows +1.2% click-through rate but -0.3% daily active Search users. Select ALL checks you would run before launching.",
    category: "execution-metrics",
    difficulty: "stretch",
    estimatedMinutes: 3,
    format: "checkbox",
    oaSection: "Product scenarios",
    companySlug: "google",
    competencies: ["diagnosing-metrics", "experimentation"],
    relatedLessonIds: ["lesson-diagnose-drop", "lesson-experimentation"],
    relatedCreateTemplateIds: ["experiment-plan"],
    rubric: ["Guardrails matter.", "Segment-level impact.", "Long-term vs short-term."],
    choices: [
      { id: "a", label: "Segment impact by query category and device" },
      { id: "b", label: "Check for novelty effects wearing off in week 3+" },
      { id: "c", label: "Review latency and error rates in treatment" },
      { id: "d", label: "Launch immediately — CTR is up" },
      { id: "e", label: "Assess ad revenue and user trust survey signals" },
    ],
    correctChoiceIds: ["a", "b", "c", "e"],
    choiceExplanation:
      "Google case-style OAs expect holistic experiment reads — local wins can hide global harm.",
  },
];

const META: OnlineAssessmentQuestion[] = [
  {
    id: "oa-meta-mc-integrity",
    title: "Engagement vs integrity",
    prompt:
      "Instagram Reels watch time is up 8%, but reports of scam links in comments rose 15%. Leadership wants both trends to continue. What is the best product response?",
    category: "product-sense",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Product scenarios",
    companySlug: "meta",
    competencies: ["prioritization", "interview-product-sense"],
    relatedLessonIds: ["lesson-product-sense"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: ["Name guardrails.", "Don’t trade long-term trust for short-term growth."],
    choices: [
      { id: "a", label: "Ignore reports — engagement is the north star." },
      {
        id: "b",
        label: "Add comment link detection + friction for low-trust accounts while monitoring creator reach impact.",
      },
      { id: "c", label: "Turn off all comments globally." },
      { id: "d", label: "Increase ad frequency to offset report volume." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Meta OAs often probe integrity vs growth tradeoffs at scale — guardrails with measured rollout.",
  },
  {
    id: "oa-meta-open-dm",
    title: "DM safety feature (written)",
    prompt:
      "Short written response (~150–250 words): Design an integrity feature for Instagram DMs that reduces scam outreach to teens without killing legitimate creator-fan messages. Include target user, failure mode today, proposal, and guardrail metrics.",
    category: "product-sense",
    difficulty: "standard",
    estimatedMinutes: 8,
    oaSection: "Written response",
    companySlug: "meta",
    competencies: ["interview-product-sense", "pain-points"],
    relatedLessonIds: ["lesson-user-problem", "lesson-product-sense"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: [
      "Teen-specific risk named.",
      "Current failure articulated.",
      "Proposal with tradeoffs.",
      "Guardrail metrics included.",
    ],
  },
  {
    id: "oa-meta-mc-reels",
    title: "Reels north star vs guardrails",
    prompt:
      "Which pair best reflects north-star vs guardrail metrics for Instagram Reels?",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Metrics & prioritization",
    companySlug: "meta",
    competencies: ["north-star-metrics", "interview-execution"],
    relatedLessonIds: ["lesson-choose-metrics"],
    relatedCreateTemplateIds: ["experiment-plan"],
    rubric: ["North star = value delivered.", "Guardrail = harm or quality."],
    choices: [
      { id: "a", label: "North star: daily Reels uploads · Guardrail: office headcount" },
      {
        id: "b",
        label: "North star: quality-adjusted watch time · Guardrail: integrity report rate per 1k views",
      },
      { id: "c", label: "North star: app icon color tests · Guardrail: font size" },
      { id: "d", label: "North star: press mentions · Guardrail: tweet count" },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Meta execution screens love north-star + guardrail framing for social products.",
  },
  {
    id: "oa-meta-mc-prioritize",
    title: "Backlog at social scale",
    prompt:
      "You can ship one item this quarter for Facebook Groups. Which best shows Meta-style prioritization?",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Product scenarios",
    companySlug: "meta",
    competencies: ["prioritization", "interview-execution"],
    relatedLessonIds: ["lesson-prioritize"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: ["Impact at scale.", "Risk acknowledged."],
    choices: [
      { id: "a", label: "Custom group emoji packs for all users." },
      {
        id: "b",
        label: "Admin tools to slow spam join requests in large public groups, measured by member retention and report rate.",
      },
      { id: "c", label: "Rename Groups to Communities because branding." },
      { id: "d", label: "Add a third shade of blue to the header." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Scale tradeoffs — spam friction vs growth — are a Meta OA staple.",
  },
  {
    id: "oa-meta-cb-launch",
    title: "Launch checklist at scale",
    prompt:
      "Select ALL elements you would include before launching a new social sharing flow to 100M+ users.",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 3,
    format: "checkbox",
    oaSection: "Work style",
    companySlug: "meta",
    competencies: ["experimentation", "executive-communication"],
    relatedLessonIds: ["lesson-experimentation"],
    relatedCreateTemplateIds: ["experiment-plan"],
    rubric: ["Phased rollout.", "Rollback plan.", "Cross-functional risks."],
    choices: [
      { id: "a", label: "Gradual rollout with kill switch" },
      { id: "b", label: "Pre-mortem with integrity, privacy, and infra partners" },
      { id: "c", label: "Ship to 100% on Friday at 5pm with no monitoring" },
      { id: "d", label: "Success metrics + guardrails defined upfront" },
      { id: "e", label: "Localization review for top markets" },
    ],
    correctChoiceIds: ["a", "b", "d", "e"],
    choiceExplanation:
      "Meta work-style and execution items expect operational rigor at scale, not move-fast-and-break-things alone.",
  },
];

const AMAZON: OnlineAssessmentQuestion[] = [
  {
    id: "oa-amz-mc-lp",
    title: "Customer obsession scenario",
    prompt:
      "Amazon sellers report that return labels fail to generate during peak hours. Customer support volume spikes. Which response best reflects Customer Obsession?",
    category: "behavioral",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Work style",
    companySlug: "amazon",
    competencies: ["interview-behavioral", "executive-communication"],
    relatedLessonIds: [],
    relatedCreateTemplateIds: ["interview-prep"],
    rubric: ["Customer impact first.", "Ownership.", "Measurable fix path."],
    choices: [
      { id: "a", label: "Tell sellers to wait until next quarter’s roadmap." },
      {
        id: "b",
        label: "Pull error logs, quantify affected orders, ship a temporary manual label flow, and communicate ETA to sellers.",
      },
      { id: "c", label: "Blame the warehouse team in the status channel." },
      { id: "d", label: "Disable returns entirely to reduce tickets." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Amazon work-style assessments map scenarios to Leadership Principles — ownership plus customer-backwards action.",
  },
  {
    id: "oa-amz-open-prime",
    title: "Prime Video discovery (written)",
    prompt:
      "Written response (~150–250 words): You own Prime Video discovery for new subscribers in their first 7 days. Walk through how you would prioritize three backlog items customer-backwards. Include how you’d decide and what metric you’d watch.",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 8,
    oaSection: "Written response",
    companySlug: "amazon",
    competencies: ["prioritization", "interview-execution"],
    relatedLessonIds: ["lesson-prioritize"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: [
      "Customer problem stated first.",
      "Three items compared with tradeoffs.",
      "Clear recommendation.",
      "Metric tied to first-week value.",
    ],
  },
  {
    id: "oa-amz-mc-prioritize",
    title: "Analytical prioritization",
    prompt:
      "Your Amazon PM OA presents three initiatives with equal eng cost. Which framing is strongest?",
    category: "execution-metrics",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Metrics & prioritization",
    companySlug: "amazon",
    competencies: ["prioritization", "interview-execution"],
    relatedLessonIds: ["lesson-prioritize"],
    relatedCreateTemplateIds: ["feature-proposal"],
    rubric: ["Customer impact estimate.", "Input metrics.", "Risk."],
    choices: [
      { id: "a", label: "Pick the idea the VP likes most." },
      {
        id: "b",
        label: "Estimate customer pain, forecast leading indicators, and document second-order risks before recommending one.",
      },
      { id: "c", label: "Choose whichever has the flashiest demo." },
      { id: "d", label: "Randomize to avoid bias." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Amazon analytical sections reward structured, customer-backwards prioritization narratives.",
  },
  {
    id: "oa-amz-cb-lp",
    title: "Leadership Principles — delay",
    prompt:
      "A launch slips two weeks because a dependency team missed a handoff. Select ALL responses that demonstrate Ownership and Bias for Action.",
    category: "behavioral",
    difficulty: "standard",
    estimatedMinutes: 3,
    format: "checkbox",
    oaSection: "Work style",
    companySlug: "amazon",
    competencies: ["interview-behavioral"],
    relatedLessonIds: [],
    relatedCreateTemplateIds: ["interview-prep"],
    rubric: ["Own the outcome.", "Act without blame spirals."],
    choices: [
      { id: "a", label: "Write a blameless post-mortem and propose process fix" },
      { id: "b", label: "Escalate with facts, options, and a recommended path today" },
      { id: "c", label: "Go silent until someone asks" },
      { id: "d", label: "Scope a smaller MVP you can ship while waiting on the dependency" },
      { id: "e", label: "Publicly criticize the other team in chat" },
    ],
    correctChoiceIds: ["a", "b", "d"],
    choiceExplanation:
      "LP-aligned work-style items want ownership, escalation with options, and pragmatic scope cuts.",
  },
  {
    id: "oa-amz-mc-star",
    title: "Situational — disagree and commit",
    prompt:
      "Your manager wants to deprioritize a seller feedback feature you believe reduces defects. The OA asks what you do next. Best answer?",
    category: "behavioral",
    difficulty: "standard",
    estimatedMinutes: 2,
    format: "multiple-choice",
    oaSection: "Product scenarios",
    companySlug: "amazon",
    competencies: ["executive-communication", "interview-behavioral"],
    relatedLessonIds: [],
    relatedCreateTemplateIds: ["interview-prep"],
    rubric: ["Data-backed dissent.", "Commit after decision."],
    choices: [
      { id: "a", label: "Stop working and wait for them to change their mind." },
      {
        id: "b",
        label: "Present defect data and customer quotes, propose a cheap experiment, then commit to the team decision.",
      },
      { id: "c", label: "Ship the feature anyway in secret." },
      { id: "d", label: "Complain to skip-level without new information." },
    ],
    correctChoiceIds: ["b"],
    choiceExplanation:
      "Amazon assessments test Have Backbone; Disagree and Commit — argue with data, then align.",
  },
];

function genericQuestions(company: string): OnlineAssessmentQuestion[] {
  return [
    {
      id: "oa-gen-mc-metric",
      title: "Metric drop — first move",
      prompt: `${company}’s product OA includes analytical items. Activation fell 7% week-over-week after a release. What should you do first?`,
      category: "execution-metrics",
      difficulty: "standard",
      estimatedMinutes: 2,
      format: "multiple-choice",
      oaSection: "Metrics & prioritization",
      companySlug: "generic",
      competencies: ["diagnosing-metrics", "interview-execution"],
      relatedLessonIds: ["lesson-diagnose-drop"],
      relatedCreateTemplateIds: ["experiment-plan"],
      rubric: ["Diagnose before prescribing."],
      choices: [
        { id: "a", label: "Ship a marketing campaign immediately." },
        {
          id: "b",
          label: "Validate the metric definition, data pipeline, and segment the drop by cohort and funnel step.",
        },
        { id: "c", label: "Rebuild the entire product from scratch." },
        { id: "d", label: "Ignore it — weekly noise is normal." },
      ],
      correctChoiceIds: ["b"],
      choiceExplanation: "Most product OAs start with disciplined metric diagnosis under time pressure.",
    },
    {
      id: "oa-gen-open-improve",
      title: `${company} product improvement (written)`,
      prompt: `Timed written prompt (~150–250 words): How would you improve ${company}’s core product for users applying through an intern pipeline? Use: user → problem → options → recommendation → success metric.`,
      category: "product-sense",
      difficulty: "standard",
      estimatedMinutes: 8,
      oaSection: "Written response",
      companySlug: "generic",
      competencies: ["interview-product-sense", "feature-ideation"],
      relatedLessonIds: ["lesson-product-sense"],
      relatedCreateTemplateIds: ["feature-proposal"],
      rubric: [
        "Specific user segment.",
        "Clear problem on a real surface.",
        "Structured comparison.",
        "Metric defined.",
      ],
    },
    {
      id: "oa-gen-mc-prioritize",
      title: "Prioritize under constraints",
      prompt: `${company} gives you three feature ideas with equal eng cost but only one can ship this month. What is the strongest approach?`,
      category: "execution-metrics",
      difficulty: "standard",
      estimatedMinutes: 2,
      format: "multiple-choice",
      oaSection: "Product scenarios",
      companySlug: "generic",
      competencies: ["prioritization", "interview-execution"],
      relatedLessonIds: ["lesson-prioritize"],
      relatedCreateTemplateIds: ["feature-proposal"],
      rubric: ["Impact framing.", "Tradeoffs explicit."],
      choices: [
        { id: "a", label: "Pick the loudest stakeholder’s idea." },
        {
          id: "b",
          label: "Score options on user impact, confidence, and effort; state what you are not doing and why.",
        },
        { id: "c", label: "Ship all three partially with no goal." },
        { id: "d", label: "Delay the decision indefinitely." },
      ],
      correctChoiceIds: ["b"],
      choiceExplanation: "OA prioritization screens reward explicit tradeoffs, not politics or indecision.",
    },
    {
      id: "oa-gen-cb-structure",
      title: "Strong OA answer structure",
      prompt:
        "Select ALL elements that make a strong short written response in a timed product OA portal.",
      category: "execution-metrics",
      difficulty: "warmup",
      estimatedMinutes: 2,
      format: "checkbox",
      oaSection: "Work style",
      companySlug: "generic",
      competencies: ["executive-communication", "interview-execution"],
      relatedLessonIds: [],
      relatedCreateTemplateIds: ["interview-prep"],
      rubric: ["Structure beats prose.", "Assumptions stated."],
      choices: [
        { id: "a", label: "State assumptions you are making" },
        { id: "b", label: "Numbered steps or headings when space allows" },
        { id: "c", label: "One vague paragraph with no metric" },
        { id: "d", label: "Name who the user is before solutions" },
        { id: "e", label: "Jargon with no explanation" },
      ],
      correctChoiceIds: ["a", "b", "d"],
      choiceExplanation: "Structured, assumption-aware answers score well on opaque OA platforms.",
    },
    {
      id: "oa-gen-mc-workstyle",
      title: "Ambiguous OA prompt",
      prompt: `The ${company} OA portal shows: "Improve onboarding." You have 20 minutes total. Best approach?`,
      category: "behavioral",
      difficulty: "warmup",
      estimatedMinutes: 2,
      format: "multiple-choice",
      oaSection: "Work style",
      companySlug: "generic",
      competencies: ["executive-communication", "interview-behavioral"],
      relatedLessonIds: [],
      relatedCreateTemplateIds: ["interview-prep"],
      rubric: ["Scope quickly.", "Show structure."],
      choices: [
        { id: "a", label: "Write an essay about company history." },
        {
          id: "b",
          label: "Pick a narrow user slice, state one problem, propose one solution with a metric, note one risk.",
        },
        { id: "c", label: "Leave it blank and move on." },
        { id: "d", label: "Paste a generic answer from another company." },
      ],
      correctChoiceIds: ["b"],
      choiceExplanation: "Timed OAs reward tight scoping and visible structure over breadth.",
    },
  ];
}

const BY_SLUG: Record<string, OnlineAssessmentQuestion[]> = {
  robinhood: ROBINHOOD,
  google: GOOGLE,
  meta: META,
  amazon: AMAZON,
};

const ALL_OA: OnlineAssessmentQuestion[] = [
  ...ROBINHOOD,
  ...GOOGLE,
  ...META,
  ...AMAZON,
];

const OA_BY_ID = new Map(ALL_OA.map((q) => [q.id, q]));

export function getOAQuestionsForCompany(company: string): OnlineAssessmentQuestion[] {
  const slug = companySlugForOA(company);
  if (slug !== "generic") return BY_SLUG[slug] ?? genericQuestions(company);
  return genericQuestions(company);
}

export function getOAQuestion(
  id: string,
  company?: string,
): OnlineAssessmentQuestion | undefined {
  const direct = OA_BY_ID.get(id);
  if (direct) return direct;
  if (company) {
    return getOAQuestionsForCompany(company).find((q) => q.id === id);
  }
  return undefined;
}

export function isOAQuestionId(id: string): boolean {
  return id.startsWith("oa-");
}

/** Resolve drill questions from OA bank or general practice bank. */
export function resolveDrillQuestion(id: string, company?: string): PracticeQuestion | undefined {
  const oa = getOAQuestion(id, company);
  if (oa) return oa;
  return getPracticeQuestion(id);
}

export const OA_SECTION_ORDER: OAQuestionSection[] = [
  "Product scenarios",
  "Metrics & prioritization",
  "Written response",
  "Work style",
];

export function groupOAQuestionsBySection(
  questions: OnlineAssessmentQuestion[],
): Record<OAQuestionSection, OnlineAssessmentQuestion[]> {
  const grouped = {} as Record<OAQuestionSection, OnlineAssessmentQuestion[]>;
  for (const section of OA_SECTION_ORDER) grouped[section] = [];
  for (const q of questions) {
    grouped[q.oaSection].push(q);
  }
  return grouped;
}
