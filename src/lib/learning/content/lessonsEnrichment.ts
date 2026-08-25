import type { Lesson } from "@/lib/learning/types";

/**
 * Enrichment curriculum: study roadmap, technical literacy, frameworks,
 * recruiting strengths, glossary companion, interview closing.
 * All prose is original Product Place content.
 */
export const ENRICHMENT_LESSONS: Lesson[] = [
  {
    id: "lesson-weeks-1-3-roadmap",
    slug: "weeks-1-3-master-core-skills",
    title: "Weeks 1–3: Master Core Skills",
    groupId: "foundations",
    competencies: ["study-planning", "role-of-pm", "technical-fluency", "prioritization"],
    estimatedMinutes: 6,
    idea:
      "Early recruiting prep works best as three parallel tracks: enough technical literacy to talk with engineers, core PM judgment (sense, prioritization, research), and honest use of your non-technical strengths.",
    whyPmsCare:
      "Scattered studying feels busy and still leaves gaps in interviews. A short roadmap keeps technical fluency, frameworks, and story-building in balance.",
    howToThink:
      "Budget ~30 minutes/week for technical literacy (docs, APIs, product types). Spend focused blocks on PM cores: sense, prioritization (RICE/MoSCoW), tradeoffs, OKRs, JTBD, research, stakeholder talk. Then translate your background into PM language — domain expertise is a differentiator, not a backup plan.",
    example:
      "Week 1: product lifecycle + B2B/B2C differences + one NeetCode easy if you want coding fluency. Week 2: RICE on a real backlog and a JTBD rewrite of a feature. Week 3: rehearse eng collaboration stories and end-of-interview questions.",
    watchOut:
      "Only grinding coding problems while skipping product sense — or only reading PM blogs while staying fuzzy on how software actually ships.",
    tryIt:
      "Write a three-week calendar with one technical, one PM-core, and one strengths/story block each week. Keep each block under 45 minutes.",
    keyTakeaways: [
      "Technical literacy is fluency, not a second CS degree.",
      "PM cores are judgment tools: sense, prioritization, research, communication.",
      "Non-technical strengths (domain, customer-facing work, consulting, design) are assets — name them.",
    ],
    relatedPracticeIds: ["pq-tech-b2b-b2c", "pq-exec-rice-prioritize"],
    relatedLessonIds: ["lesson-tech-literacy-basics", "lesson-non-technical-strengths", "lesson-rice-moscow"],
    relatedCreateTemplateIds: ["study-plan"],
    externalResources: [
      {
        label: "NeetCode",
        url: "https://neetcode.io/",
        note: "Optional — one easy problem a day if technical screens make you nervous.",
      },
    ],
  },
  {
    id: "lesson-tech-literacy-basics",
    slug: "pm-technical-literacy-basics",
    title: "PM Technical Literacy Basics",
    groupId: "technical-literacy",
    competencies: ["technical-fluency", "working-with-engineering", "interview-technical"],
    estimatedMinutes: 5,
    idea:
      "You do not need to be a strong coder to land a PM internship. You need enough fluency to ask sharp questions, understand constraints, and survive technical screens that often lean on data structures and algorithms.",
    whyPmsCare:
      "Engineers trust PMs who respect complexity. Interviewers probe whether you’ll invent impossible timelines or partner well under ambiguity.",
    howToThink:
      "Aim for “informed collaborator”: know the product lifecycle, what frontend/backend/API mean, how to skim a doc, and when to ask for a spike. If coding screens appear, treat one easy practice problem a day as maintenance — not your whole identity.",
    example:
      "In a design review you ask whether a new filter needs a new index or can use existing search — not because you’ll write the query, but because you understand latency and cost tradeoffs.",
    watchOut:
      "Faking expertise, or swinging to the opposite extreme: “I’m non-technical so I don’t need any of this.”",
    tryIt:
      "Explain to a friend, in two minutes, how a button tap becomes data on a server and back. Note where you get stuck — that’s your study list.",
    keyTakeaways: [
      "Fluency > wizardry for most early PM roles.",
      "DSA screens are often the sharpest technical filter — practice lightly and consistently if relevant.",
      "Your job is judgment with engineers, not competing with them.",
    ],
    relatedPracticeIds: ["pq-tech-frontend-backend", "pq-tech-api-explain"],
    relatedLessonIds: ["lesson-apis-frontend-backend", "lesson-coding-interview-reality", "lesson-eng-design"],
    relatedCreateTemplateIds: ["study-plan"],
    externalResources: [
      { label: "NeetCode", url: "https://neetcode.io/", note: "Optional coding warmups." },
    ],
    sourceRefs: [
      {
        title: "Cracking the PM Interview",
        author: "Gayle Laakmann McDowell & Jackie Bavaro",
        topic: "Technical topics for PMs",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-product-lifecycle",
    slug: "product-development-lifecycle",
    title: "Understanding the Product Development Lifecycle",
    groupId: "technical-literacy",
    competencies: ["product-lifecycle", "technical-fluency", "working-with-engineering"],
    estimatedMinutes: 5,
    idea:
      "Software usually moves through discovery → definition → build → launch → learn — looping, not a one-way waterfall. PMs keep the loop honest: problem clarity before build, and measurement after launch.",
    whyPmsCare:
      "If you only show up for “write tickets,” you miss where outcomes are decided — problem framing and post-launch learning.",
    howToThink:
      "Map any initiative onto the loop. Ask: Are we still discovering? Defining scope? Building? Launching? Measuring? Different stages need different artifacts (research notes, PRD, tickets, experiment plan).",
    example:
      "A “simple” settings toggle still needs: who asked, success metric, edge cases, rollout plan, and a check that support load didn’t spike.",
    watchOut:
      "Skipping discovery because a stakeholder “already knows,” then discovering the real constraint in QA week.",
    tryIt:
      "Take a feature you use. Guess which lifecycle stage it’s in for the team shipping it — and what evidence would prove you wrong.",
    keyTakeaways: [
      "Lifecycle is a loop, not a badge ceremony.",
      "PMs own continuity across stages more than any single ceremony.",
    ],
    relatedPracticeIds: ["pq-tech-lifecycle", "pq-behavioral-ambiguity"],
    relatedLessonIds: ["lesson-what-pm-does", "lesson-tech-literacy-basics"],
    relatedCreateTemplateIds: ["prd"],
  },
  {
    id: "lesson-b2b-b2c-ai",
    slug: "b2b-b2c-b2b2c-ai-native",
    title: "B2B vs B2C vs B2B2C vs AI-Native Products",
    groupId: "technical-literacy",
    competencies: ["product-business-models", "market-understanding", "positioning"],
    estimatedMinutes: 6,
    idea:
      "Product shape follows who pays, who uses, and how value compounds. B2B optimizes for org workflows and multi-threaded buying; B2C for individual habit; B2B2C for partner + end-user tension; AI-native products add model cost, evals, and trust constraints.",
    whyPmsCare:
      "Interviewers and teammates expect you to change prioritization logic when the customer is a company, a consumer, both, or a model-mediated experience.",
    howToThink:
      "Ask: Who buys? Who uses? What’s the sales motion? What’s the retention loop? For AI-native: what’s the failure mode when the model is wrong, and how expensive is each call?",
    example:
      "A campus SaaS sold to universities (B2B) cares about admin controls and SSO. The same idea as a consumer study app (B2C) cares about streak retention and viral invites.",
    watchOut:
      "Copying consumer growth tactics into enterprise products — or treating “AI” as a feature sprinkle without evals and cost awareness.",
    tryIt:
      "Pick one product you love. Label it B2B / B2C / B2B2C / AI-native (or hybrid) and name the #1 metric that should matter most.",
    keyTakeaways: [
      "Buyer ≠ user is the classic B2B trap.",
      "AI-native adds reliability, cost, and evaluation as first-class product concerns.",
    ],
    relatedPracticeIds: ["pq-tech-b2b-b2c", "pq-strategy-enter-market"],
    relatedLessonIds: ["lesson-strategy-tradeoffs", "lesson-tech-literacy-basics"],
    relatedCreateTemplateIds: ["product-teardown"],
  },
  {
    id: "lesson-apis-frontend-backend",
    slug: "apis-frontend-backend",
    title: "APIs, Frontend, Backend — and Why PMs Care",
    groupId: "technical-literacy",
    competencies: ["apis-systems", "frontend-backend", "technical-fluency"],
    estimatedMinutes: 5,
    idea:
      "Frontend is what users interact with; backend is the logic and data behind it; APIs are the contracts connecting pieces (and partners). PMs use this map to estimate risk, sequence work, and ask better questions.",
    whyPmsCare:
      "“Just add a button” can mean a UI change, a schema change, a new service, or an external dependency. Technical literacy prevents fantasy roadmaps.",
    howToThink:
      "For any feature: what does the user see (frontend)? What rules and storage are required (backend)? What systems must talk (APIs)? Where are the failure modes?",
    example:
      "Showing “delivery ETA” may need a frontend component, a backend estimate service, and an API from logistics — each with different owners and SLAs.",
    watchOut:
      "Assuming UI polish equals product completeness while the API contract is still undefined.",
    tryIt:
      "Describe Instagram “like” (or a similar action) as frontend event → API call → backend write → fan-out. Keep it to five sentences.",
    keyTakeaways: [
      "Frontend ≠ backend ≠ API — different failure modes.",
      "Integrations inherit other teams’ constraints.",
    ],
    relatedPracticeIds: ["pq-tech-api-explain", "pq-tech-frontend-backend"],
    relatedLessonIds: ["lesson-reading-tech-docs", "lesson-tech-literacy-basics"],
    relatedCreateTemplateIds: ["prd"],
  },
  {
    id: "lesson-reading-tech-docs",
    slug: "reading-technical-docs",
    title: "How to Read Technical Docs as a PM",
    groupId: "technical-literacy",
    competencies: ["reading-tech-docs", "technical-fluency", "working-with-engineering"],
    estimatedMinutes: 5,
    idea:
      "You don’t read docs like an engineer implementing them. You skim for: what it enables, constraints/limits, auth, error cases, and what would break a user journey.",
    whyPmsCare:
      "Docs are often the fastest way to understand platform bets, third-party risk, and whether a “simple integration” is actually weeks of work.",
    howToThink:
      "Pass 1: purpose + core objects. Pass 2: limits, rate limits, auth. Pass 3: errors and edge cases that affect UX. Write three clarifying questions for eng.",
    example:
      "Before promising “export to Sheets,” you skim the API’s rate limits and notice bulk export needs pagination — so the timeline includes a job queue, not a weekend hack.",
    watchOut:
      "Reading only the happy-path quickstart and discovering production limits after commit.",
    tryIt:
      "Open any public API docs. Write: capability, one hard limit, one error case that would confuse users.",
    keyTakeaways: [
      "PM reading = constraints and user impact, not implementation trivia.",
      "Good questions beat pretending you understood everything.",
    ],
    relatedPracticeIds: ["pq-tech-read-docs", "pq-tech-api-explain"],
    relatedLessonIds: ["lesson-apis-frontend-backend", "lesson-eng-design"],
    relatedCreateTemplateIds: ["prd"],
    externalResources: [
      {
        label: "Microsoft Learn — Azure Fundamentals",
        url: "https://learn.microsoft.com/training/paths/azure-fundamentals/",
        note: "Optional cloud vocabulary.",
      },
    ],
  },
  {
    id: "lesson-rice-moscow",
    slug: "prioritization-rice-moscow-tradeoffs",
    title: "Prioritization: RICE, MoSCoW, and Tradeoffs",
    groupId: "execution-metrics",
    competencies: ["rice-moscow", "prioritization", "tradeoffs", "saying-no"],
    estimatedMinutes: 6,
    idea:
      "Frameworks don’t decide for you — they make assumptions visible. RICE compares options with Reach/Impact/Confidence/Effort. MoSCoW draws a release cut line. Tradeoffs name what you give up.",
    whyPmsCare:
      "Stakeholders argue louder when prioritization is vibes. Lightweight structure turns arguments into inspectable inputs.",
    howToThink:
      "Use RICE when comparing a list. Use MoSCoW when scoping a release. Always attach a one-sentence tradeoff: “We optimize X over Y this quarter.”",
    example:
      "Three asks: dark mode, search speed, partner API. Search scores high on impact/confidence; dark mode is loud but lower reach; partner is revenue-tied but high effort — you MoSCoW partner to Should with a time-boxed spike.",
    watchOut:
      "Fake precision (confidence 87%) or using frameworks as theater after the decision was already made.",
    tryIt:
      "Score two real backlog ideas with RICE on a napkin. Then write the MoSCoW cut for a two-week release.",
    keyTakeaways: [
      "Frameworks surface assumptions — they don’t replace judgment.",
      "Every priority implies a deferred cost; say it.",
    ],
    relatedPracticeIds: ["pq-exec-rice-prioritize", "pq-exec-moscow-scope", "pq-sense-prioritize-features"],
    relatedLessonIds: ["lesson-prioritize", "lesson-weeks-1-3-roadmap"],
    relatedCreateTemplateIds: ["feature-proposal", "prd"],
    sourceRefs: [
      {
        title: "Cracking the PM Interview",
        author: "Gayle Laakmann McDowell & Jackie Bavaro",
        topic: "Prioritization frameworks",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-okrs-jtbd",
    slug: "okrs-and-jtbd",
    title: "OKRs and Jobs To Be Done",
    groupId: "execution-metrics",
    competencies: ["okrs-jtbd", "goals", "user-problems", "user-research-basics"],
    estimatedMinutes: 5,
    idea:
      "OKRs align teams on an objective and measurable results. JTBD reframes products as tools people “hire” to make progress. Together they keep goals user-grounded instead of feature-chasing.",
    whyPmsCare:
      "OKRs without user jobs become vanity metrics. Jobs without measurable results become poetry.",
    howToThink:
      "Objective = direction. Key results = evidence. JTBD = the progress situation (“when… I want to… so I can…”). Connect KR to a job, not to shipping volume.",
    example:
      "Objective: help first-years feel oriented. KR: % who attend one event in week 2. JTBD: when I’m new on campus, help me find low-awkward ways to show up.",
    watchOut:
      "Stacking twenty OKRs or writing jobs that are secretly feature requests.",
    tryIt:
      "Rewrite one feature on your phone as a JTBD. Then invent one KR that would prove the job got done.",
    keyTakeaways: [
      "OKRs measure progress; JTBD names the progress people seek.",
      "User stories often fall out of clear jobs.",
    ],
    relatedPracticeIds: ["pq-exec-user-story", "pq-exec-okr-draft"],
    relatedLessonIds: ["lesson-user-problem", "lesson-choose-metrics"],
    relatedCreateTemplateIds: ["feature-proposal"],
  },
  {
    id: "lesson-user-research-stakeholders",
    slug: "user-research-and-stakeholder-communication",
    title: "User Research and Stakeholder Communication",
    groupId: "pm-in-practice",
    competencies: ["user-research-basics", "stakeholder-management", "executive-communication"],
    estimatedMinutes: 5,
    idea:
      "Research reduces uncertainty; stakeholder communication reduces surprise. Both are about translating evidence into decisions people can follow.",
    whyPmsCare:
      "Great insights die in unread decks. Great politics without evidence ships the wrong thing confidently.",
    howToThink:
      "For research: decide the decision it will inform before you recruit anyone. For stakeholders: lead with the decision, then evidence, then ask.",
    example:
      "Instead of “we talked to 8 users,” you say: “We’re pausing Feature X because 6/8 target users abandoned at step 2; proposed next test is Y.”",
    watchOut:
      "Collecting quotes to decorate a predetermined roadmap.",
    tryIt:
      "Write a 4-line stakeholder update: context, evidence, decision, ask.",
    keyTakeaways: [
      "Research serves decisions.",
      "Stakeholders need decisions more than slide volume.",
    ],
    relatedPracticeIds: ["pq-behavioral-influence", "pq-stakeholder-update"],
    relatedLessonIds: ["lesson-stakeholders", "lesson-user-problem"],
    relatedCreateTemplateIds: ["feature-proposal"],
    sourceRefs: [
      {
        title: "Product Management in Practice",
        author: "Matt LeMay",
        topic: "Communication and collaboration",
        chapter: null,
      },
    ],
  },
  {
    id: "lesson-non-technical-strengths",
    slug: "non-technical-strengths-as-pm",
    title: "Your Non-Technical Strengths as a PM Candidate",
    groupId: "pm-in-practice",
    competencies: ["non-technical-strengths", "interview-behavioral", "stakeholder-management"],
    estimatedMinutes: 5,
    idea:
      "Industry experience, domain expertise, customer-facing work, consulting, and design backgrounds are not “consolation prizes.” They are differentiators when you translate them into user empathy, business instinct, and cross-functional judgment.",
    whyPmsCare:
      "Recruiting narratives that apologize for not being SWE leave your strongest evidence on the table.",
    howToThink:
      "Map each past role to a PM skill: customer support → pain point detection; consulting → structured tradeoffs; ops → process constraints; design → interaction clarity. Then tell a story with a decision and outcome.",
    example:
      "A retail floor lead explaining how they noticed a checkout bottleneck and changed staffing — that’s discovery, metrics, and stakeholder buy-in in plain clothes.",
    watchOut:
      "Listing soft skills without proof, or claiming “I love people” instead of showing a hard call you made.",
    tryIt:
      "Write three bullets: Past experience → PM skill → Proof moment.",
    keyTakeaways: [
      "Non-technical ≠ non-rigorous.",
      "Translation beats apology.",
    ],
    relatedPracticeIds: ["pq-behavioral-strengths-story", "pq-behavioral-influence"],
    relatedLessonIds: ["lesson-weeks-1-3-roadmap", "lesson-what-pm-does"],
    relatedCreateTemplateIds: ["interview-prep"],
  },
  {
    id: "lesson-coding-interview-reality",
    slug: "coding-screens-reality-check",
    title: "Coding Screens: A Practical Reality Check",
    groupId: "technical-literacy",
    competencies: ["technical-fluency", "interview-technical", "study-planning"],
    estimatedMinutes: 4,
    idea:
      "Many PM internship paths do not require elite coding — but some include a technical screen where data structures and algorithms show up. Treat that as a bounded skill: enough to pass, not a career rewrite.",
    whyPmsCare:
      "Anxiety about coding can crowd out PM prep. A realistic plan protects both.",
    howToThink:
      "If your target companies screen with DSA: one easy problem a day beats weekend cram sessions. Pair it with explaining solutions out loud. If they don’t: invest that time in product sense and stories.",
    example:
      "You schedule 25 minutes daily on an easy array/hash-map problem, then 35 minutes on a product sense drill — same calendar, balanced risk.",
    watchOut:
      "Doom-scrolling advanced LeetCode while your product sense muscle atrophies.",
    tryIt:
      "Check two target job posts for technical screen hints. Adjust your weekly mix accordingly.",
    keyTakeaways: [
      "Pass-level fluency is the goal for most early PM tracks.",
      "Consistency > intensity for optional coding practice.",
    ],
    relatedPracticeIds: ["pq-tech-frontend-backend", "pq-tech-api-explain"],
    relatedLessonIds: ["lesson-tech-literacy-basics", "lesson-weeks-1-3-roadmap"],
    relatedCreateTemplateIds: ["study-plan"],
    externalResources: [
      { label: "NeetCode", url: "https://neetcode.io/", note: "Optional structured practice." },
    ],
  },
  {
    id: "lesson-interview-closing",
    slug: "interview-closing-questions",
    title: "Strong Questions to Ask at the End of an Interview",
    groupId: "interview",
    competencies: ["interview-closing", "interview-behavioral", "executive-communication"],
    estimatedMinutes: 5,
    idea:
      "Closing questions are a product skill: you gather signal on role, team, and fit — and you leave a professional, curious impression. Prepare a short menu; pick two that fit the conversation.",
    whyPmsCare:
      "“I don’t have any questions” wastes a free discovery cycle and can read as low interest.",
    howToThink:
      "Mix: (1) clarity on success/challenges, (2) culture/team, (3) optional brave feedback questions if rapport is real. Sound natural — not like you’re reading a list.",
    example:
      "After a metrics discussion you ask what success looks like at 90 days, then what the hardest part of the role has been for past hires — specific, forward-looking, respectful.",
    watchOut:
      "Asking only about perks, or asking something already answered an hour ago.",
    tryIt:
      "Say three closing questions out loud until they sound like you. Time yourself under 20 seconds each.",
    keyTakeaways: [
      "Ask about success, challenges, and team truth — not only logistics.",
      "Brave feedback questions require rapport; don’t force them.",
    ],
    relatedPracticeIds: [
      "pq-closing-success",
      "pq-closing-challenge",
      "pq-closing-feedback",
      "pq-closing-culture",
    ],
    relatedLessonIds: ["lesson-non-technical-strengths", "lesson-stakeholders"],
    relatedCreateTemplateIds: ["interview-prep"],
    sourceRefs: [
      {
        title: "Cracking the PM Interview",
        author: "Gayle Laakmann McDowell & Jackie Bavaro",
        topic: "Interview process and candidate questions",
        chapter: null,
      },
    ],
  },
];
