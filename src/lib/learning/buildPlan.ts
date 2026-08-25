import type { CreateTemplate, CreateTemplateType } from "@/lib/learning/types";

export type BuildTool = {
  name: string;
  why: string;
  url?: string;
};

export type BuildPlanStep = {
  title: string;
  detail: string;
  tools?: BuildTool[];
};

export type BuildPlanPhase = {
  id: string;
  title: string;
  intro: string;
  steps: BuildPlanStep[];
};

export type BuildPlan = {
  headline: string;
  summary: string;
  readinessNote: string;
  filledCount: number;
  totalSections: number;
  missingLabels: string[];
  phases: BuildPlanPhase[];
  portfolioTip: string;
};

function clip(s: string, n = 160): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).trim()}…`;
}

function filledEntries(
  template: CreateTemplate,
  content: Record<string, string>,
): { filled: Array<{ id: string; label: string; text: string }>; missing: string[] } {
  const filled: Array<{ id: string; label: string; text: string }> = [];
  const missing: string[] = [];
  for (const s of template.sections) {
    const text = (content[s.id] ?? "").trim();
    if (text) filled.push({ id: s.id, label: s.label, text });
    else missing.push(s.label);
  }
  return { filled, missing };
}

function pick(content: Record<string, string>, ...ids: string[]): string | null {
  for (const id of ids) {
    const t = (content[id] ?? "").trim();
    if (t) return t;
  }
  return null;
}

const TOOLS = {
  figma: {
    name: "Figma",
    why: "Fast clickable wireframes and a portfolio-ready visual artifact.",
    url: "https://www.figma.com",
  },
  excalidraw: {
    name: "Excalidraw",
    why: "Ugly-first flows in minutes — perfect before you polish UI.",
    url: "https://excalidraw.com",
  },
  cursor: {
    name: "Cursor",
    why: "Vibecode a real web app from your PRD sections with tight iteration.",
    url: "https://cursor.com",
  },
  lovable: {
    name: "Lovable",
    why: "Prompt-to-app when you want a shareable demo fast.",
    url: "https://lovable.dev",
  },
  v0: {
    name: "v0",
    why: "Generate polished UI components from short prompts, then stitch in code.",
    url: "https://v0.dev",
  },
  supabase: {
    name: "Supabase",
    why: "Auth + Postgres without standing up your own backend.",
    url: "https://supabase.com",
  },
  vercel: {
    name: "Vercel",
    why: "Ship a public URL you can put on a résumé in an afternoon.",
    url: "https://vercel.com",
  },
  bubble: {
    name: "Bubble",
    why: "No-code path when the product is workflow-heavy and you need logic without a full eng stack.",
    url: "https://bubble.io",
  },
  glide: {
    name: "Glide",
    why: "Spreadsheet-backed mobile/web apps for ops or campus tools.",
    url: "https://www.glideapps.com",
  },
  typeform: {
    name: "Typeform / Tally",
    why: "Validate demand before you build — waitlist, interviews, smoke tests.",
    url: "https://tally.so",
  },
  notion: {
    name: "Notion",
    why: "Case-study writeup + decision log that sits next to the live demo.",
    url: "https://www.notion.so",
  },
} as const;

function wireframePhase(productNoun: string, flowHint: string | null): BuildPlanPhase {
  return {
    id: "wireframe",
    title: "1 · Wireframe the core loop",
    intro:
      "Don’t open a code editor yet. Draw the smallest path from “user has the problem” → “user gets value.” Portfolio reviewers care that you can simplify.",
    steps: [
      {
        title: "Sketch 4–6 screens max",
        detail: flowHint
          ? `Based on what you wrote, prioritize this flow: ${clip(flowHint, 220)}. Keep empty states and one failure state.`
          : `For ${productNoun}, sketch: entry → core action → confirmation → return. Add one empty state and one error state.`,
        tools: [TOOLS.excalidraw, TOOLS.figma],
      },
      {
        title: "Name the happy path in one sentence",
        detail:
          "Write: “When [user] does [action], they get [outcome] in under [time].” If you can’t, your MVP is still blurry.",
      },
      {
        title: "Cut until it’s embarrassing",
        detail:
          "Anything that isn’t required for that sentence is v1.1. Portfolio projects die from scope, not from looking unfinished.",
      },
    ],
  };
}

function vibecodePhase(stackHint: string): BuildPlanPhase {
  return {
    id: "vibecode",
    title: "2 · Vibecode a thin slice",
    intro:
      "Use AI-assisted builders to stand up a real interactive demo — then harden only what the story needs.",
    steps: [
      {
        title: "Prompt from your own sections",
        detail: `Paste your problem, users, and requirements into the tool. Ask for: “One happy-path UI, mobile-friendly, no auth unless required, stub data OK.” ${stackHint}`,
        tools: [TOOLS.cursor, TOOLS.lovable, TOOLS.v0],
      },
      {
        title: "Add persistence only if the story needs it",
        detail:
          "If users must return to saved work, add Supabase (or the tool’s built-in DB). If it’s a one-session demo, local state is fine for V1.",
        tools: [TOOLS.supabase],
      },
      {
        title: "Deploy a public link",
        detail:
          "A live URL beats screenshots. Host the demo and put the link at the top of your case study.",
        tools: [TOOLS.vercel],
      },
    ],
  };
}

function validatePhase(hypothesis: string | null): BuildPlanPhase {
  return {
    id: "validate",
    title: "3 · Validate before you polish",
    intro: "A portfolio piece is stronger when you show learning, not just pixels.",
    steps: [
      {
        title: "Run 5 cheap conversations or a waitlist",
        detail: hypothesis
          ? `Test the claim: ${clip(hypothesis, 200)}. Ask what they do today instead — and whether they’d switch.`
          : "Show the wireframe or demo to 5 people in the target segment. Capture quotes and objections.",
        tools: [TOOLS.typeform],
      },
      {
        title: "Log decisions",
        detail:
          "Keep a short decision log: what you cut, what surprised you, what you’d change next. That becomes the “Learning” slide interviewers love.",
        tools: [TOOLS.notion],
      },
    ],
  };
}

function portfolioPhase(title: string): BuildPlanPhase {
  return {
    id: "portfolio",
    title: "4 · Package it for interviews",
    intro: "The artifact isn’t only the app — it’s the story of judgment.",
    steps: [
      {
        title: "Write a one-page case study",
        detail: `Structure: problem → users → options → what you built (${title || "your demo"}) → metric you’d watch → what you’d do next. Link the live demo.`,
        tools: [TOOLS.notion, TOOLS.figma],
      },
      {
        title: "Prepare a 90-second walkthrough",
        detail:
          "Screen-share the happy path only. Narrate the tradeoff you made. Stop before feature tourism.",
      },
    ],
  };
}

function planForType(
  type: CreateTemplateType,
  title: string,
  content: Record<string, string>,
): { headline: string; summary: string; phases: BuildPlanPhase[]; portfolioTip: string } {
  const problem = pick(content, "problem", "problemSpace", "jtbd", "overview", "hypothesis", "goal");
  const user = pick(content, "user", "targetUser", "users", "segment");
  const mvp = pick(content, "mvp", "proposal", "core", "change", "requirements");
  const flow = pick(content, "flow", "core", "stories");
  const metric = pick(content, "metric", "metrics", "primary");

  switch (type) {
    case "product-teardown":
      return {
        headline: "Build a redesign spike from your teardown",
        summary: problem
          ? `You diagnosed friction around: ${clip(problem)}. Turn the #1 opportunity into a clickable before/after — that’s a portfolio piece, not a book report.`
          : "Pick one opportunity from your teardown and ship a clickable redesign of that moment only.",
        phases: [
          wireframePhase("the improved flow", pick(content, "opportunity", "friction")),
          {
            id: "compare",
            title: "2 · Before / after demo",
            intro: "Interviewers love a crisp contrast.",
            steps: [
              {
                title: "Clone the current flow (rough is fine)",
                detail: "Screenshot or recreate 2–3 screens of the status quo, then your improved path beside them.",
                tools: [TOOLS.figma, TOOLS.excalidraw],
              },
              {
                title: "Prototype only the opportunity",
                detail: pick(content, "opportunity")
                  ? `Focus on: ${clip(pick(content, "opportunity")!, 200)}`
                  : "One interaction improvement end-to-end — not a full rebrand.",
                tools: [TOOLS.figma, TOOLS.lovable, TOOLS.v0],
              },
            ],
          },
          validatePhase(metric),
          portfolioPhase(title),
        ],
        portfolioTip:
          "Lead with the user moment that breaks today, then show your fix. Metric second. Brand polish last.",
      };

    case "feature-proposal":
      return {
        headline: "Build the feature as a portfolio demo",
        summary: mvp
          ? `Your proposal centers on: ${clip(mvp)}. Ship a thin interactive slice of that feature — enough to click through the value.`
          : "Turn the proposed feature into a clickable prototype of the happy path only.",
        phases: [
          wireframePhase("the feature", flow ?? mvp),
          vibecodePhase(
            user
              ? `Keep the UI copy speaking to: ${clip(user, 100)}.`
              : "Keep copy segment-specific — no generic “user” labels.",
          ),
          validatePhase(problem),
          portfolioPhase(title),
        ],
        portfolioTip:
          "Show alternatives you rejected (even as crossed-out sketches). That’s product judgment on display.",
      };

    case "zero-to-one":
      return {
        headline: "Build the 0→1 MVP as a real demo",
        summary: mvp
          ? `Your MVP: ${clip(mvp)}. Build only that — explicitly leave out everything you marked as out of v1.`
          : "Define the smallest shippable experience that tests your insight, then build only that.",
        phases: [
          {
            id: "cut",
            title: "1 · Lock the killable MVP",
            intro: "0→1 portfolios fail when the MVP is still a wishlist.",
            steps: [
              {
                title: "Write the out-of-scope list on the prototype home screen",
                detail: pick(content, "prioritization")
                  ? `You already said: ${clip(pick(content, "prioritization")!, 200)}. Surface that honesty in the case study.`
                  : "List 5 things you will not build. Stick it at the top of your Notion writeup.",
              },
              {
                title: "Wireframe the one magical moment",
                detail: pick(content, "core", "insight")
                  ? `Center the prototype on: ${clip(pick(content, "core", "insight")!, 200)}`
                  : "One core experience that must feel magical — everything else is scaffolding.",
                tools: [TOOLS.excalidraw, TOOLS.figma],
              },
            ],
          },
          vibecodePhase("Prefer a single web surface. Skip payments and multi-tenant admin for V1."),
          {
            id: "nocode-alt",
            title: "2b · Or go no-code if the bet is ops/workflow",
            intro: "If your insight is a workflow spine, Bubble/Glide can beat a custom app for speed.",
            steps: [
              {
                title: "Map tables → screens",
                detail: "Users, events/jobs, status. Build create → list → detail → done.",
                tools: [TOOLS.bubble, TOOLS.glide],
              },
            ],
          },
          validatePhase(pick(content, "insight", "hypothesis")),
          portfolioPhase(title),
        ],
        portfolioTip:
          "Include kill criteria. Showing when you’d stop is as impressive as showing what you shipped.",
      };

    case "prd":
      return {
        headline: "Build from the PRD — eng-ready demo",
        summary: problem
          ? `PRD problem: ${clip(problem)}. Implement Must-have requirements only; leave open questions visible in the UI or README.`
          : "Treat Must-haves as the build ticket. Non-goals stay non-goals.",
        phases: [
          {
            id: "tickets",
            title: "1 · Turn requirements into a build board",
            intro: "Your PRD is the prompt and the acceptance test.",
            steps: [
              {
                title: "Checklist from Requirements + Stories",
                detail: pick(content, "requirements", "stories")
                  ? `Start here: ${clip(pick(content, "requirements", "stories")!, 220)}`
                  : "Make a checklist of Must-haves. Each item should be demoable.",
              },
              {
                title: "Wireframe edge cases you already named",
                detail: pick(content, "edgeCases")
                  ? `Include at least one: ${clip(pick(content, "edgeCases")!, 180)}`
                  : "Empty, error, and permission-denied states — interviewers notice.",
                tools: [TOOLS.figma, TOOLS.excalidraw],
              },
            ],
          },
          vibecodePhase("Generate UI from user stories, then manually fix acceptance criteria."),
          validatePhase(metric),
          portfolioPhase(title),
        ],
        portfolioTip:
          "Link the live demo + a short “open questions still open” note. Honesty reads as seniority.",
      };

    case "experiment-plan":
      return {
        headline: "Build the experiment instrumentation",
        summary: pick(content, "hypothesis")
          ? `Hypothesis: ${clip(pick(content, "hypothesis")!, 200)}. Build the smallest change + a way to measure the primary metric.`
          : "Build the treatment UI and a simple logging path for your primary metric.",
        phases: [
          {
            id: "treatment",
            title: "1 · Build only the change",
            intro: "The portfolio artifact is the experiment, not a full product rewrite.",
            steps: [
              {
                title: "Prototype control vs treatment",
                detail: pick(content, "change")
                  ? `Treatment: ${clip(pick(content, "change")!, 200)}. Keep control boring.`
                  : "Two variants of one screen. Label them clearly in the demo.",
                tools: [TOOLS.figma, TOOLS.lovable, TOOLS.cursor],
              },
              {
                title: "Fake the assignment if needed",
                detail:
                  "A toggle “You’re in treatment” is fine for a portfolio demo. Explain how you’d assign for real.",
              },
            ],
          },
          {
            id: "measure",
            title: "2 · Make the metric visible",
            intro: "Show you know what you’d count.",
            steps: [
              {
                title: "Dashboard stub",
                detail: pick(content, "primary")
                  ? `Primary metric: ${clip(pick(content, "primary")!, 160)}. One chart or counter is enough.`
                  : "One number on a results screen — even with sample data — plus guardrails listed.",
                tools: [TOOLS.cursor, TOOLS.supabase],
              },
            ],
          },
          validatePhase(pick(content, "hypothesis")),
          portfolioPhase(title),
        ],
        portfolioTip:
          "Leave Results blank until you have them — or clearly mark sample data. Process integrity is the flex.",
      };

    case "study-plan":
      return {
        headline: "Build your recruiting operating system",
        summary: "Turn the study plan into a living tracker and portfolio of practice artifacts.",
        phases: [
          {
            id: "system",
            title: "1 · Make the plan clickable",
            intro: "A Notion/Glide tracker beats a static doc you’ll ignore.",
            steps: [
              {
                title: "Weekly board",
                detail: pick(content, "week1", "goal")
                  ? `Seed it with: ${clip(pick(content, "week1", "goal")!, 200)}`
                  : "Columns: Technical · PM drill · Strengths story · Done?",
                tools: [TOOLS.notion, TOOLS.glide],
              },
            ],
          },
          {
            id: "artifacts",
            title: "2 · Attach Create outputs",
            intro: "Each week should produce one portfolio-shaped artifact.",
            steps: [
              {
                title: "Link teardowns / proposals you finish",
                detail: "Your study plan is the spine; Create projects are the proof.",
              },
            ],
          },
          portfolioPhase(title),
        ],
        portfolioTip: "Show the system + 2 finished artifacts. Process without proof is just a calendar.",
      };

    case "interview-prep":
      return {
        headline: "Build a rehearsal kit you can actually use",
        summary: "Package stories and closing questions into a run-of-show you practice aloud.",
        phases: [
          {
            id: "kit",
            title: "1 · One-pager rehearsal deck",
            intro: "Keep it glanceable during mocks — not a novel.",
            steps: [
              {
                title: "Story cards + closing menu",
                detail: pick(content, "stories", "closing")
                  ? `Pull from: ${clip(pick(content, "stories", "closing")!, 200)}`
                  : "2–3 STAR stories and 4 closing questions in your voice.",
                tools: [TOOLS.notion, TOOLS.figma],
              },
              {
                title: "Record one mock",
                detail: "Phone video, 10 minutes. Watch at 1.5× and fix filler + structure.",
              },
            ],
          },
          portfolioPhase(title),
        ],
        portfolioTip:
          "Interview prep isn’t a product demo — but polished stories about products you built belong next to Create artifacts.",
      };

    default:
      return {
        headline: "Build a thin demo from this project",
        summary: "Wireframe the core loop, vibecode a slice, ship a link, write the case study.",
        phases: [
          wireframePhase("your product", problem),
          vibecodePhase(""),
          validatePhase(null),
          portfolioPhase(title),
        ],
        portfolioTip: "Specificity wins. Vague apps don’t get callbacks.",
      };
  }
}

/** Deterministic build guide from a Create project — no AI. */
export function buildPlanFromProject(input: {
  title: string;
  template: CreateTemplate;
  content: Record<string, string>;
}): BuildPlan {
  const { filled, missing } = filledEntries(input.template, input.content);
  const core = planForType(input.template.id, input.title, input.content);

  const readinessNote =
    filled.length === 0
      ? "Your sections are still empty — fill the problem/user/MVP fields first, then hit Build it again for a tighter plan. Meanwhile here’s the default path."
      : missing.length === 0
        ? "Nice — core sections look filled. Use them as the prompt pack for wireframing and vibecoding."
        : `Using ${filled.length}/${input.template.sections.length} filled sections. Still empty: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "…" : ""}. The plan still works; denser notes = sharper prompts.`;

  return {
    headline: core.headline,
    summary: core.summary,
    readinessNote,
    filledCount: filled.length,
    totalSections: input.template.sections.length,
    missingLabels: missing,
    phases: core.phases,
    portfolioTip: core.portfolioTip,
  };
}
