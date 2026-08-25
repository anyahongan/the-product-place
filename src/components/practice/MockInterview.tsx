import { Sheet, Tab } from "@/components/paper/Paper";
import {
  PracticeTargetFields,
  loadPracticeTarget,
  savePracticeTarget,
  type PracticeTarget,
} from "@/components/practice/DrillSession";
import { FeedbackSpeechControls } from "@/components/practice/FeedbackSpeechControls";
import { SpeakLiveControls } from "@/components/practice/SpeakLiveControls";
import {
  practiceBtn,
  practiceBtnBlock,
  practiceBtnCard,
  practiceBtnSm,
  practiceHeadingYellow,
  sentenceCase,
} from "@/components/practice/practiceUi";
import {
  BEHAVIORAL_STRENGTHS_GUIDE,
  CLOSING_QUESTION_CARDS,
  MOCK_BEHAVIORAL_PROMPTS,
  MOCK_TECHNICAL_PROMPTS,
} from "@/lib/learning/content/behavioralGuide";
import { gradePracticeFn } from "@/lib/learning/gradePractice.server";
import type { PracticeGradeResult } from "@/lib/learning/practiceGrade";
import { stopSpeaking } from "@/lib/learning/useSpeechOutput";
import { useEffect, useMemo, useState } from "react";

export type MockView = "hub" | "guide" | "technical" | "behavioral" | "session";

export function MockInterviewWorkspace({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<MockView>("hub");
  const [track, setTrack] = useState<"technical" | "behavioral">("behavioral");
  const [promptId, setPromptId] = useState<string | null>(null);
  const [target, setTarget] = useState<PracticeTarget>(() => loadPracticeTarget());

  const prompts = track === "technical" ? MOCK_TECHNICAL_PROMPTS : MOCK_BEHAVIORAL_PROMPTS;
  const active = useMemo(
    () => prompts.find((p) => p.id === promptId) ?? prompts[0]!,
    [prompts, promptId],
  );

  if (view === "guide") {
    return <BehavioralQuickGuide onBack={() => setView("hub")} />;
  }

  if (view === "session" && active) {
    return (
      <MockSession
        track={track}
        title={active.title}
        prompt={active.prompt}
        target={target}
        onBack={() => setView(track === "technical" ? "technical" : "behavioral")}
      />
    );
  }

  if (view === "technical" || view === "behavioral") {
    const list = view === "technical" ? MOCK_TECHNICAL_PROMPTS : MOCK_BEHAVIORAL_PROMPTS;
    return (
      <main className="relative px-5 pb-28 pt-10 sm:px-8">
        <div className="mx-auto max-w-[820px]">
          <button type="button" className={practiceBtnSm} onClick={() => setView("hub")}>
            ← Mock interview
          </button>
          <Tab color="yellow" className="mt-6">
            {view === "technical" ? "Technical" : "Behavioral"}
          </Tab>
          <h1 className={`mt-4 font-display text-4xl font-black uppercase ${practiceHeadingYellow}`}>
            {view === "technical" ? "Technical mock" : "Behavioral mock"}
          </h1>
          <PracticeTargetFields
            value={target}
            onChange={(next) => {
              setTarget(next);
              savePracticeTarget(next);
            }}
          />
          {view === "behavioral" && (
            <button type="button" onClick={() => setView("guide")} className={`mt-4 ${practiceBtn}`}>
              Open behavioral quick guide →
            </button>
          )}
          <ul className="mt-8 space-y-3">
            {list.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setTrack(view);
                    setPromptId(p.id);
                    setView("session");
                  }}
                  className={practiceBtnBlock}
                >
                  <span className="font-display text-base font-extrabold uppercase">{p.title}</span>
                  <span className="mt-2 block text-sm font-sans font-normal normal-case tracking-normal text-ink-soft">
                    {p.prompt}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-14 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <button type="button" className={practiceBtnSm} onClick={onBack}>
          ← Practice home
        </button>
        <Tab color="yellow" className="mt-6">
          Mock interview
        </Tab>
        <h1 className={`mt-4 font-display text-4xl font-black uppercase ${practiceHeadingYellow}`}>
          Mock Interview
        </h1>
        <p className="mt-3 max-w-[48ch] text-ink-soft">
          Split into technical and behavioral tracks. Speak live with your mic — the coach talks
          back — then get thorough graded feedback.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => setView("technical")} className={`${practiceBtnCard} w-full`}>
            <h2 className="font-display text-xl font-extrabold uppercase group-hover:text-paper">
              Technical
            </h2>
            <p className="mt-3 text-sm font-sans font-normal normal-case tracking-normal text-ink-soft group-hover:text-paper/90">
              APIs, metrics instrumentation, tech tradeoffs, diagnosis — fluency over LeetCode flex.
            </p>
          </button>
          <button type="button" onClick={() => setView("behavioral")} className={`${practiceBtnCard} w-full`}>
            <h2 className="font-display text-xl font-extrabold uppercase group-hover:text-paper">
              Behavioral
            </h2>
            <p className="mt-3 text-sm font-sans font-normal normal-case tracking-normal text-ink-soft group-hover:text-paper/90">
              Stories, influence, non-tech strengths, closing questions — with a quick guide.
            </p>
          </button>
        </div>

        <button type="button" onClick={() => setView("guide")} className={`mt-6 ${practiceBtn}`}>
          Behavioral quick guide →
        </button>
      </div>
    </main>
  );
}

function BehavioralQuickGuide({ onBack }: { onBack: () => void }) {
  return (
    <main className="relative px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <button type="button" className={practiceBtnSm} onClick={onBack}>
          ← Back
        </button>
        <Tab color="yellow" className="mt-6">
          Quick guide
        </Tab>
        <h1 className={`mt-4 font-display text-4xl font-black uppercase ${practiceHeadingYellow}`}>
          Behavioral prep
        </h1>

        <Sheet tone="paper" soft shadow="hard-sm" className="mt-8 border-l-4 border-l-yellow px-6 py-7">
          <p
            className={`font-display text-xs font-extrabold uppercase tracking-wide ${practiceHeadingYellow}`}
          >
            3 · {BEHAVIORAL_STRENGTHS_GUIDE.title}
          </p>
          <p className="mt-4 text-[1.08rem] leading-[1.75] text-ink">
            {BEHAVIORAL_STRENGTHS_GUIDE.body}
          </p>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-ink-soft">
            {BEHAVIORAL_STRENGTHS_GUIDE.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Sheet>

        <h2 className="mt-12 font-display text-xl font-extrabold uppercase">
          Closing question menu
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          End-of-interview questions that signal curiosity and judgment. Rewrite in your voice.
        </p>
        <ul className="mt-6 space-y-4">
          {CLOSING_QUESTION_CARDS.map((card, i) => (
            <li
              key={card.id}
              className="border-2 border-ink bg-paper px-5 py-4 shadow-[var(--shadow-hard-sm)]"
            >
              <p className="tag text-ink-faint">Closer {i + 1}</p>
              <p className="mt-2 font-display text-base font-bold leading-snug">
                “{card.question}”
              </p>
              <p className="mt-2 text-sm italic text-ink-soft">{card.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function MockSession({
  track,
  title,
  prompt,
  target,
  onBack,
}: {
  track: "technical" | "behavioral";
  title: string;
  prompt: string;
  target: PracticeTarget;
  onBack: () => void;
}) {
  const [response, setResponse] = useState("");
  const [grade, setGrade] = useState<PracticeGradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => stopSpeaking(), []);

  const rubric =
    track === "technical"
      ? [
          "Explained concepts in plain language.",
          "Named a metric or diagnostic step.",
          "Called an explicit tradeoff.",
          "Stated assumptions / risks.",
        ]
      : [
          "Clear situation and constraint.",
          "Owned a decision (not just activity).",
          "Showed stakeholder / influence awareness.",
          "Outcome + what you’d repeat.",
        ];

  function appendTranscript(chunk: string) {
    setResponse((prev) => (prev.trim() ? `${prev.trim()} ${chunk}` : chunk));
  }

  async function submit() {
    stopSpeaking();
    setGrading(true);
    setError(null);
    try {
      const result = await gradePracticeFn({
        data: {
          questionTitle: title,
          questionPrompt: prompt,
          category: track,
          rubric,
          responseText: response,
          targetCompany: target.company,
          targetRole: target.role,
          interviewType: target.interviewType || track,
        },
      });
      setGrade(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed");
    } finally {
      setGrading(false);
    }
  }

  return (
    <main className="relative px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <button type="button" className={practiceBtnSm} onClick={onBack}>
          ← Prompts
        </button>
        <Tab color="yellow" className="mt-6">
          {track === "technical" ? "Technical mock" : "Behavioral mock"}
        </Tab>
        <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink">{prompt}</p>

        <div className="mt-8">
          <SpeakLiveControls prompt={prompt} onTranscript={appendTranscript} />
        </div>

        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={12}
          className="mt-4 w-full border-2 border-ink bg-paper p-4 text-base leading-relaxed focus-ink"
          placeholder="Answer as if you’re in the room — type or speak."
        />

        <button
          type="button"
          disabled={response.trim().length < 8 || grading}
          onClick={() => void submit()}
          className={`mt-6 ${practiceBtn}`}
        >
          {grading ? "Grading…" : "Get graded feedback"}
        </button>
        {error && <p className="mt-3 tag text-pink">{error}</p>}

        {grade && (
          <Sheet tone="yellow" soft shadow="hard-sm" className="mt-10 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="tag">{grade.source === "ai" ? "AI grade" : "Coach grade"}</p>
            </div>
            <FeedbackSpeechControls grade={grade} autoPlay />
            <h2 className="mt-2 font-display text-3xl font-black uppercase">
              {grade.overallScore}
              <span className="text-lg"> / 100</span>
            </h2>
            <p className="mt-4 leading-relaxed text-ink">{grade.summary}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-display text-xs font-extrabold uppercase text-green">Strengths</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {grade.strengths.map((s) => (
                    <li key={s}>{sentenceCase(s)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-display text-xs font-extrabold uppercase text-pink">Gaps</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {grade.gaps.map((s) => (
                    <li key={s}>{sentenceCase(s)}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {grade.dimensions.map((d) => (
                <div key={d.label} className="border-2 border-ink bg-paper px-3 py-3 text-sm">
                  <div className="flex justify-between gap-2 font-bold">
                    <span className="normal-case">{sentenceCase(d.label)}</span>
                    <span>
                      {d.score}/{d.max}
                    </span>
                  </div>
                  <p className="mt-1 text-ink-soft normal-case">{sentenceCase(d.feedback)}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-ink">{grade.rewriteSuggestion}</p>
            <p className="mt-3 text-sm italic text-ink-soft">{grade.nextDrillTip}</p>
          </Sheet>
        )}
      </div>
    </main>
  );
}
