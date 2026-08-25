import type { CompetencyGroupId } from "@/lib/learning/competencies";
import type { Lesson, LessonArticleBlock, LessonVisualId } from "@/lib/learning/types";

/** Hand-tuned dense articles for each lesson id. */
export const LESSON_ARTICLES: Record<string, LessonArticleBlock[]> = {
  "lesson-what-pm-does": [
    { type: "p", text: "A PM owns outcomes, not a job-title checklist. You decide what to build next, why it matters, and how you’ll know it worked — then you help a team ship it. That sounds simple until meetings, tickets, and docs start pretending to be progress." },
    { type: "figure", visualId: "pm-loop" },
    { type: "heading", text: "What the job is actually made of" },
    { type: "p", text: "Day to day, strong PMs keep four threads visible: the user problem under focus, the bets currently in flight, the open decisions that need owners, and the metric that would change their mind. Meetings are inputs. Outcomes are the scoreboard." },
    { type: "bullets", items: [
      "Problem clarity — who hurts, when, and how we know",
      "Prioritization — sequenced saying-no with tradeoffs written down",
      "Delivery partnership — unblocking eng/design without becoming a project coordinator only",
      "Learning loop — launch plans, metrics, and post-ship notes",
    ]},
    { type: "callout", tone: "trap", title: "Activity theater", body: "Standing up tickets, writing docs, and attending meetings while the core metric never moves. If you can’t name the outcome you’re moving this week, you’re busy — not necessarily effective." },
    { type: "heading", text: "A weekly operating sentence" },
    { type: "quote", text: "This week I will move ___ for ___ users by shipping or validating ___." },
    { type: "p", text: "If you can’t fill the blanks, you don’t have a PM goal yet — you have a calendar. Recruiters, engineers, and designers all expect different things from “PM.” Framing your work as decisions is how you stay coherent across those audiences." },
    { type: "figure", visualId: "decision-log" },
    { type: "steps", items: [
      { label: "Name the user", detail: "Which segment feels the pain most acutely right now?" },
      { label: "Name the bet", detail: "What change are you making (or testing) this week?" },
      { label: "Name the signal", detail: "What number or qualitative proof would update your belief?" },
      { label: "Name the no", detail: "What did you explicitly defer so this could happen?" },
    ]},
  ],
  "lesson-user-problem": [
    { type: "p", text: "Features are guesses. Problems are the durable unit. A good problem statement names who struggles, when, and what fails today — without sneaking in your solution. Teams argue about solutions when they haven’t agreed on the problem." },
    { type: "figure", visualId: "problem-frame" },
    { type: "heading", text: "How to write one that survives debate" },
    { type: "p", text: "Use: When [situation], [user] wants to [job], but [obstacle], which causes [impact]. Strip adjectives that smuggle features (“easy one-tap sharing”). If a stranger couldn’t invent three different solutions from your statement, sharpen it." },
    { type: "compare", left: { title: "Weak", body: "“Students need a better calendar.”" }, right: { title: "Stronger", body: "“When clubs post across five apps, first-years miss events they’d attend — so they feel disconnected by week three.”" } },
    { type: "callout", tone: "framework", title: "Solution smuggling test", body: "Read the statement aloud. If it already names a UI, a feature, or a vendor, rewrite until the solution is gone and the pain remains." },
    { type: "heading", text: "Where interviews and roadmaps go sideways" },
    { type: "p", text: "Broad slogans (“engagement is low”) let any feature claim victory. Over-narrow statements ignore adjacent users who share the job. Aim for a slice where pain, behavior, and willingness to change are similar enough to design for." },
    { type: "figure", visualId: "discovery-loop" },
    { type: "bullets", items: [
      "Evidence: quotes, support tickets, funnel drops — labeled as known vs assumed",
      "Non-goals: what this problem is not (scope control)",
      "Success sketch: how you’d know the problem got lighter — before picking a feature",
    ]},
  ],
  "lesson-segmentation": [
    { type: "p", text: "“Users” is not a user. Segmentation picks a slice where the pain, behavior, and willingness to change are similar enough to design for. Without a segment, prioritization debates become taste contests." },
    { type: "figure", visualId: "jtbd-lens" },
    { type: "heading", text: "Useful cuts vs vanity cuts" },
    { type: "p", text: "Useful segments share a job, a constraint, or a behavior (first-years on campus in weeks 1–4; admins who renew annually). Vanity segments are demographics that don’t change the product decision (“people aged 18–34 who like apps”)." },
    { type: "callout", tone: "note", title: "Start with one primary", body: "Name a primary segment and a secondary. Designing for everyone in v1 usually designs for no one. Expansion segments come after the core loop works." },
    { type: "heading", text: "How segments show up in interviews" },
    { type: "p", text: "When you critique a product, say who it’s optimized for and who it leaves behind. When you propose a feature, say which segment you’re designing for and what you’d measure for them specifically." },
    { type: "bullets", items: [
      "Behavior: what they do today to cope",
      "Motivation: progress they’re trying to make",
      "Constraint: time, money, permissions, risk",
      "Channel: where you’d reach them",
    ]},
  ],
  "lesson-prioritize": [
    { type: "p", text: "Prioritization is sequenced saying-no with visible tradeoffs. Order implies refusal — the craft is making that refusal legible and fair so stakeholders don’t invent a shadow roadmap." },
    { type: "figure", visualId: "tradeoff-scale" },
    { type: "heading", text: "Make the comparison visible" },
    { type: "p", text: "Name the goal you’re optimizing this cycle. Show 2–4 candidates side by side. Attach a tradeoff sentence: what you gain and what you defer. Fake precision (Confidence 93%) is worse than an honest “medium.”" },
    { type: "figure", visualId: "rice" },
    { type: "callout", tone: "framework", title: "Saying no without burning trust", body: "Offer a partial or time-boxed alternative when honest, write the decision down, and invite a revisit condition. Silence creates politics; clarity creates disagreement you can manage." },
    { type: "figure", visualId: "decision-log" },
    { type: "steps", items: [
      { label: "Goal", detail: "What outcome are we optimizing this sprint/quarter?" },
      { label: "Candidates", detail: "What are we choosing among — not infinite backlog folklore?" },
      { label: "Compare", detail: "Reach, impact, confidence, effort — or MoSCoW cut line" },
      { label: "Record", detail: "Decision + alternatives + revisit trigger" },
    ]},
  ],
  "lesson-product-sense": [
    { type: "p", text: "Product sense is structured judgment under ambiguity: who the user is, what job they’re hiring the product for, what tradeoffs the current design made, and what you’d change first — with a metric." },
    { type: "figure", visualId: "discovery-loop" },
    { type: "heading", text: "A repeatable critique spine" },
    { type: "steps", items: [
      { label: "User & job", detail: "Who is this for, and what progress are they seeking?" },
      { label: "Current approach", detail: "How does the product solve it today — screens and flows, not slogans?" },
      { label: "Strengths", detail: "What works specifically?" },
      { label: "Friction", detail: "Where does the job break?" },
      { label: "Bet", detail: "What would you change first, and how would you know it worked?" },
    ]},
    { type: "callout", tone: "trap", title: "Hot takes without a spine", body: "“I hate the color” isn’t product sense. Neither is listing ten features. Sense is a coherent story from user → friction → bet → metric." },
    { type: "figure", visualId: "problem-frame" },
    { type: "p", text: "Practice on products you use. Time-box a teardown. Then Practice drills and Create a teardown project so the judgment leaves your head and becomes an artifact." },
  ],
  "lesson-choose-metrics": [
    { type: "p", text: "A metric is a decision aid, not a decoration. Choose a primary that moves when the user problem gets better, plus guardrails that catch collateral damage (spam, latency, opt-outs, trust)." },
    { type: "figure", visualId: "metric-tree" },
    { type: "heading", text: "Primary vs vanity" },
    { type: "compare", left: { title: "Often weak", body: "Page views, downloads, “engagement” without a definition, raw feature usage with no quality bar." }, right: { title: "Often stronger", body: "Activation to first value, retained weekly active in the target segment, successful task completion, expansion that doesn’t hurt NPS." } },
    { type: "callout", tone: "note", title: "Guardrails matter", body: "A primary that rises while trust or reliability collapses is not a win. Pre-commit what must not get worse." },
    { type: "figure", visualId: "funnel" },
    { type: "bullets", items: [
      "Name the user segment the metric is about",
      "Define the event in plain language",
      "State the window (day 1, week 1, month 1)",
      "List 1–2 guardrails",
    ]},
  ],
  "lesson-metric-tree": [
    { type: "p", text: "A metric tree connects a north-star outcome to drivers you can influence and inputs you can ship against. It stops teams from arguing about disconnected KPIs." },
    { type: "figure", visualId: "metric-tree" },
    { type: "heading", text: "How to build one without fake science" },
    { type: "p", text: "Start from the outcome that represents user value (not revenue alone unless that’s truly the product). Ask “what must be true?” twice — those become drivers. Inputs are levers (onboarding steps completed, time-to-value, invite sent)." },
    { type: "callout", tone: "trap", title: "Too many “north stars”", body: "If everything is a north star, nothing is. One primary outcome per product surface; drivers can be many, but ranked." },
    { type: "steps", items: [
      { label: "Outcome", detail: "The star — retained value for a defined user" },
      { label: "Drivers", detail: "2–4 intermediate truths that move the star" },
      { label: "Inputs", detail: "Shipable levers owned by the team" },
      { label: "Diagnostics", detail: "Where you’d look first when the star dips" },
    ]},
  ],
  "lesson-diagnose-drop": [
    { type: "p", text: "When a metric drops, resist the first narrative. Diagnosis is a tree search: which segment, which step, which change landed, which external shock — before you prescribe a feature." },
    { type: "figure", visualId: "funnel" },
    { type: "heading", text: "A calm diagnostic order" },
    { type: "steps", items: [
      { label: "Confirm", detail: "Is the drop real (definition change, logging bug, seasonality)?" },
      { label: "Slice", detail: "Which segment / platform / geography moved?" },
      { label: "Locate", detail: "Which funnel step broke?" },
      { label: "Correlate", detail: "What shipped or changed in the window?" },
      { label: "Hypothesize", detail: "2–3 causes ranked by likelihood × severity" },
      { label: "Test", detail: "Cheapest validation before a big build" },
    ]},
    { type: "callout", tone: "framework", title: "Write the story you refuse", body: "Explicitly list the explanations you’re not buying yet — it keeps you honest when a stakeholder arrives with a pet theory." },
  ],
  "lesson-eng-design": [
    { type: "p", text: "Great PM–eng–design collaboration is a shared problem, clear constraints, and honest open questions — not a telepathy contest or a ticket dump." },
    { type: "figure", visualId: "eng-collab" },
    { type: "heading", text: "What to bring into the room" },
    { type: "bullets", items: [
      "Problem statement + non-goals",
      "Success metric and guardrails",
      "Constraints: deadline, platforms, dependencies",
      "Known edge cases and unknowns labeled as unknowns",
      "Decision rights: who picks if we disagree",
    ]},
    { type: "callout", tone: "trap", title: "Solution-first briefs", body: "Handing eng a pixel-perfect “build this” without the problem teaches them to ignore your docs. Bring the why; co-own the how." },
    { type: "figure", visualId: "decision-log" },
    { type: "p", text: "Design partners need the same spine plus emotional tone, empty states, and failure UX. Treat both crafts as co-owners of the user journey, not service desks." },
  ],
  "lesson-stakeholders": [
    { type: "p", text: "Stakeholder management is mapping influence and interest, then matching communication cadence — not endless meetings or political theater." },
    { type: "figure", visualId: "stakeholder-map" },
    { type: "heading", text: "Cadence that scales" },
    { type: "p", text: "High influence / high interest: short written updates with decisions and asks. High influence / low interest: outcomes only, fewer words. High interest / low influence: invite into research synthesis, not every tradeoff." },
    { type: "callout", tone: "note", title: "Write it before you say it", body: "A three-bullet decision note beats a thirty-minute status meeting. Bring the meeting when you need judgment, not attendance." },
    { type: "figure", visualId: "decision-log" },
    { type: "bullets", items: [
      "What changed since last update",
      "What we decided / still open",
      "What we need from them (deadline)",
    ]},
  ],
  "lesson-strategy-tradeoffs": [
    { type: "p", text: "Strategy is choosing where to play and how to win — which means naming what you will not do. Tradeoffs are the product of strategy, not a footnote." },
    { type: "figure", visualId: "tradeoff-scale" },
    { type: "heading", text: "Make the tradeoff sentence first-class" },
    { type: "quote", text: "We optimize for ___ this quarter, accepting ___ as the cost, revisiting if ___." },
    { type: "p", text: "Without that sentence, every stakeholder re-litigates every week. With it, disagreements get sharper — and more useful." },
    { type: "compare", left: { title: "Diffuse strategy", body: "“Be the best product for everyone.” No cut line; roadmap becomes a wishlist." }, right: { title: "Sharp strategy", body: "“Win campus organizers first with ops reliability; defer consumer viral loops until retention holds.”" } },
    { type: "figure", visualId: "decision-log" },
  ],
  "lesson-experimentation": [
    { type: "p", text: "Experiments are pre-committed learning: hypothesis, primary metric, guardrails, design, and decision rule — written before you peek at results." },
    { type: "figure", visualId: "experiment-flow" },
    { type: "heading", text: "Anatomy of a clean experiment" },
    { type: "steps", items: [
      { label: "Hypothesis", detail: "If we… then… because…" },
      { label: "Primary", detail: "One number that decides" },
      { label: "Guardrails", detail: "What must not get worse" },
      { label: "Design", detail: "Who’s exposed, how long, assignment" },
      { label: "Decision rule", detail: "Ship / iterate / kill thresholds" },
    ]},
    { type: "callout", tone: "trap", title: "Peeking and “calling it early”", body: "Without a pre-written rule, you’ll stop when the chart flatters your ego. Leave Results blank until the window closes." },
    { type: "figure", visualId: "funnel" },
  ],
  "lesson-weeks-1-3-roadmap": [
    { type: "p", text: "Weeks 1–3 are a balance problem: technical literacy, PM cores, and non-technical strengths should move in parallel — not “code until ready, then maybe product.”" },
    { type: "figure", visualId: "roadmap-weeks" },
    { type: "heading", text: "A realistic week shape" },
    { type: "bullets", items: [
      "Tue · 25 min technical skim (one API or system concept)",
      "Thu · 40 min RICE / product sense drill",
      "Sun · 20 min rewriting one past experience as a PM story",
    ]},
    { type: "callout", tone: "note", title: "Miss a day?", body: "Skip shame. Resume the next block. Consistency beats heroic weekends that burn you out before interviews start." },
    { type: "heading", text: "What “done” looks like after 3 weeks" },
    { type: "p", text: "You can explain frontend/backend/API in plain language, run a RICE comparison without freezing, tell one strength story with a decision, and ask two closing questions that sound like you." },
    { type: "figure", visualId: "pm-loop" },
  ],
  "lesson-tech-literacy-basics": [
    { type: "p", text: "For most early PM paths, the goal is fluency — not a second CS degree. Fluency means you can follow a design review, ask about edge cases, and tell a UI tweak from a multi-service project." },
    { type: "figure", visualId: "api-stack" },
    { type: "heading", text: "Fluency vs mastery" },
    { type: "compare", left: { title: "Fluency", body: "Explain tradeoffs, estimate rough cost, ask good questions, read a PRD/tech design without panic." }, right: { title: "Mastery", body: "Implement the system yourself. Rarely the internship bar — don’t confuse the two." } },
    { type: "callout", tone: "framework", title: "Weekly technical skim", body: "Pick one concept (API auth, queues, caching, mobile offline). Read one short doc. Explain it out loud in 60 seconds. That’s the habit." },
    { type: "figure", visualId: "eng-collab" },
  ],
  "lesson-product-lifecycle": [
    { type: "p", text: "Products move through discover → define → build → launch → learn — as a loop, not a waterfall you graduate from." },
    { type: "figure", visualId: "lifecycle" },
    { type: "heading", text: "Artifacts by stage" },
    { type: "steps", items: [
      { label: "Discover", detail: "Interview notes, problem statements, opportunity briefs" },
      { label: "Define", detail: "PRD / one-pager with non-goals and success metrics" },
      { label: "Build", detail: "Tickets, acceptance criteria, design specs" },
      { label: "Launch", detail: "Rollout plan, messaging, monitoring" },
      { label: "Learn", detail: "Experiment results, postmortems, next bets" },
    ]},
    { type: "callout", tone: "trap", title: "Build without Learn", body: "Shipping a toggle with no success metric usually means Define and Learn were skipped — even if Build “finished.”" },
    { type: "figure", visualId: "discovery-loop" },
  ],
  "lesson-b2b-b2c-ai": [
    { type: "p", text: "Business model shapes prioritization. Buyer ≠ user in classic B2B. B2C weights retention and distribution. B2B2C juggles partner brand risk and end-user delight. AI-native adds eval quality, latency, and cost-per-call as product constraints." },
    { type: "figure", visualId: "b2b-models" },
    { type: "heading", text: "What changes in your roadmap" },
    { type: "bullets", items: [
      "B2B: admin controls, security, workflow adoption, procurement cycles",
      "B2C: habit loops, viral/organic channels, emotional UX",
      "AI-native: eval sets, failure modes, cost ceilings, human-in-the-loop",
    ]},
    { type: "callout", tone: "note", title: "Interview tell", body: "When you critique a product, name the model and who pays. It immediately upgrades the sophistication of your answer." },
  ],
  "lesson-apis-frontend-backend": [
    { type: "p", text: "Frontend is what users see and tap. Backend holds rules, data, and jobs. APIs are the contracts that let systems talk — integrations and reliability inherit those contracts." },
    { type: "figure", visualId: "api-stack" },
    { type: "heading", text: "PM question checklist" },
    { type: "bullets", items: [
      "What does the user see?",
      "What data must persist?",
      "Which services talk?",
      "What’s the failure UX if the API is down?",
      "What’s the latency budget?",
      "Who owns the contract?",
    ]},
    { type: "callout", tone: "trap", title: "“Just a button”", body: "Many “small” UI asks are multi-service projects in disguise. The checklist prevents surprise scope." },
  ],
  "lesson-reading-tech-docs": [
    { type: "p", text: "Reading technical docs is a PM skill: skim for interfaces, constraints, and failure modes — not for becoming the on-call engineer." },
    { type: "figure", visualId: "api-stack" },
    { type: "heading", text: "A skim protocol" },
    { type: "steps", items: [
      { label: "Purpose", detail: "What problem does this system claim to solve?" },
      { label: "Inputs/outputs", detail: "What goes in, what comes out, who calls whom?" },
      { label: "Limits", detail: "Rate limits, size caps, auth, regions" },
      { label: "Failure", detail: "Timeouts, retries, partial success" },
      { label: "Questions", detail: "Write 3 questions for eng — proof you read it" },
    ]},
    { type: "callout", tone: "note", title: "Explain it out loud", body: "If you can’t teach the concept in 60 seconds without jargon, skim again. Fluency is teach-back, not highlighting." },
  ],
  "lesson-rice-moscow": [
    { type: "p", text: "RICE compares candidates with reach, impact, confidence, and effort. MoSCoW locks a release cut line: Must / Should / Could / Won’t (this time)." },
    { type: "figure", visualId: "rice" },
    { type: "heading", text: "When to use which" },
    { type: "compare", left: { title: "RICE", body: "Comparing a list of bets. Forces relative honesty about cost and confidence." }, right: { title: "MoSCoW", body: "Locking a release. Won’t is a commitment device against silent scope creep." } },
    { type: "callout", tone: "framework", title: "Worked micro-example", body: "Campus app: event push (high reach) vs dark mode (loud ask, lower reach) vs admin CSV export (low reach, high org impact). If first-year retention is the goal, push likely wins — unless enterprise renewal depends on export this quarter." },
    { type: "figure", visualId: "tradeoff-scale" },
  ],
  "lesson-okrs-jtbd": [
    { type: "p", text: "OKRs align teams with a qualitative objective and measurable key results. JTBD keeps you honest about the progress users hire your product to make — not the feature list you wish they’d love." },
    { type: "figure", visualId: "okr-cascade" },
    { type: "figure", visualId: "jtbd-lens" },
    { type: "heading", text: "Using them together" },
    { type: "p", text: "Write the job in user language. Set an objective that advances that job. Attach KRs that prove progress without becoming vanity counters. If a KR doesn’t connect to a job, question it." },
    { type: "callout", tone: "trap", title: "OKRs as task lists", body: "“Ship 12 features” is not a KR. “Increase week-1 RSVP rate among first-years by 15%” is closer — still imperfect, but outcome-shaped." },
  ],
  "lesson-user-research-stakeholders": [
    { type: "p", text: "Research without stakeholder alignment becomes a slide deck nobody believes. Align on the decision the research will inform before you schedule the first interview." },
    { type: "figure", visualId: "discovery-loop" },
    { type: "figure", visualId: "stakeholder-map" },
    { type: "heading", text: "A tight research loop" },
    { type: "steps", items: [
      { label: "Decision", detail: "What will we choose differently after this?" },
      { label: "Questions", detail: "What must we learn to decide?" },
      { label: "Methods", detail: "Interviews, diary, funnel data — matched to the question" },
      { label: "Synthesis", detail: "Patterns, not highlight reels" },
      { label: "Implication", detail: "What we will do / not do next" },
    ]},
    { type: "callout", tone: "note", title: "Invite critics into synthesis", body: "Stakeholders who only see polished decks invent their own data. Bring them into raw patterns early." },
  ],
  "lesson-non-technical-strengths": [
    { type: "p", text: "Non-technical backgrounds are differentiators when translated into PM language with proof — domain expertise, customer-facing judgment, ops under constraint, cross-functional mediation." },
    { type: "figure", visualId: "pm-loop" },
    { type: "heading", text: "Translate, don’t apologize" },
    { type: "compare", left: { title: "Résumé slogan", body: "“Hard worker and people person.”" }, right: { title: "PM proof", body: "“Cut club event no-shows by adding day-of SMS — chose ops reliability over a vanity redesign.”" } },
    { type: "callout", tone: "framework", title: "Story spine", body: "Situation → constraint → decision you owned → outcome → what you’d repeat. Decisions beat vibes." },
    { type: "bullets", items: [
      "Customer pain spotting from frontline work",
      "Prioritization under scarce resources",
      "Stakeholder mediation with written non-goals",
      "Domain expertise competitors must learn",
    ]},
  ],
  "lesson-coding-interview-reality": [
    { type: "p", text: "Some PM internship tracks include technical screens; many don’t. The honest bar is usually collaboration fluency plus whatever that company actually tests — not LeetCode as an identity." },
    { type: "figure", visualId: "api-stack" },
    { type: "heading", text: "Allocate effort like a PM" },
    { type: "p", text: "If your target companies publish process, believe them. Pair light DSA practice (if required) with systems intuition and product drills. Don’t sacrifice product sense for algorithmic prestige you won’t use on the job." },
    { type: "callout", tone: "note", title: "Optional NeetCode cadence", body: "A few easy/medium problems per week beats a binge. Explain solutions out loud — interviews are communication under pressure." },
    { type: "figure", visualId: "roadmap-weeks" },
  ],
  "lesson-interview-closing": [
    { type: "p", text: "Closing questions are still product discovery — on the role. You’re learning how success is scored, where new PMs stumble, and whether the team’s standards match how you want to work." },
    { type: "figure", visualId: "closing-menu" },
    { type: "heading", text: "Say them in your voice" },
    { type: "bullets", items: [
      "What would someone need to nail in the first 90 days?",
      "Where do new PMs usually stumble on this team?",
      "What do your strongest PMs do differently week to week?",
      "What keeps you here?",
    ]},
    { type: "callout", tone: "trap", title: "Brave feedback too early", body: "“Anything that would raise your confidence / give you pause?” only works if rapport is real. Otherwise it sounds scripted or needy." },
    { type: "quote", text: "Rewrite the menu until it sounds like you — awkward on paper is fine if it sounds human aloud." },
  ],
};

function defaultVisualForGroup(groupId: CompetencyGroupId): LessonVisualId {
  switch (groupId) {
    case "technical-literacy":
      return "api-stack";
    case "product-sense":
      return "problem-frame";
    case "execution-metrics":
      return "metric-tree";
    case "strategy":
      return "tradeoff-scale";
    case "pm-in-practice":
      return "stakeholder-map";
    case "interview":
      return "closing-menu";
    default:
      return "pm-loop";
  }
}

/** Fallback article when a lesson has no hand-tuned article. */
export function buildFallbackArticle(lesson: Lesson): LessonArticleBlock[] {
  const visual = lesson.visualId ?? defaultVisualForGroup(lesson.groupId);
  const blocks: LessonArticleBlock[] = [
    { type: "p", text: lesson.idea },
    { type: "figure", visualId: visual },
    { type: "heading", text: "Why PMs care" },
    { type: "p", text: lesson.whyPmsCare },
    { type: "heading", text: "How to think about it" },
    { type: "p", text: lesson.howToThink },
    { type: "callout", tone: "framework", title: "Worked example", body: lesson.example },
    { type: "callout", tone: "trap", title: "Watch out", body: lesson.watchOut },
  ];
  for (const s of lesson.depthSections ?? []) {
    blocks.push({ type: "heading", text: s.heading });
    blocks.push({ type: "p", text: s.body });
  }
  if (lesson.keyTakeaways && lesson.keyTakeaways.length > 0) {
    blocks.push({ type: "heading", text: "Key takeaways" });
    blocks.push({ type: "bullets", items: lesson.keyTakeaways });
  }
  blocks.push({ type: "heading", text: "Try it" });
  blocks.push({ type: "p", text: lesson.tryIt });
  return blocks;
}

export function articleForLesson(lesson: Lesson): LessonArticleBlock[] {
  return LESSON_ARTICLES[lesson.id] ?? buildFallbackArticle(lesson);
}
