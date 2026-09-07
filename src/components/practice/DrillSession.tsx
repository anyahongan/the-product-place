import { Link } from "@tanstack/react-router";
import { Sheet, Tab } from "@/components/paper/Paper";
import { FeedbackSpeechControls } from "@/components/practice/FeedbackSpeechControls";
import { SpeakLiveControls } from "@/components/practice/SpeakLiveControls";
import {
  practiceBtn,
  practiceBtnSm,
  practiceTitleYellow,
  sentenceCase,
} from "@/components/practice/practiceUi";
import { SaveStatus, type SaveState } from "@/components/profile/SaveStatus";
import { getCompetency, type CompetencyId } from "@/lib/learning/competencies";
import { getCreateTemplate, getLesson, questionFormat } from "@/lib/learning/content";
import { gradePracticeFn } from "@/lib/learning/gradePractice.server";
import {
  gradeChoiceQuestion,
  type PracticeGradeResult,
} from "@/lib/learning/practiceGrade";
import {
  createPracticeAttempt,
  updatePracticeAttempt,
} from "@/lib/learning/repositories/practiceAttemptRepository";
import type { PracticeAttemptRecord, PracticeQuestion } from "@/lib/learning/types";
import {
  DIFFICULTY_LABELS,
  PRACTICE_CATEGORY_LABELS,
  PRACTICE_FORMAT_LABELS,
} from "@/lib/learning/types";
import { stopSpeaking } from "@/lib/learning/useSpeechOutput";
import { readPageDraft, writePageDraft } from "@/lib/navigation/pageSession";
import { useEffect, useState } from "react";

const TARGET_KEY = "tpp:practice-target:v1";
const OTHER = "__other__";

const COMPANY_OPTIONS = [
  "Stripe",
  "Figma",
  "Notion",
  "Airbnb",
  "Linear",
  "Google",
  "Meta",
  "Apple",
  "Amazon",
  "Microsoft",
  "OpenAI",
  "Anthropic",
  "Uber",
  "Lyft",
  "DoorDash",
  "Instacart",
  "Spotify",
  "Netflix",
  "LinkedIn",
  "Salesforce",
  "Adobe",
  "Atlassian",
  "Shopify",
  "Square / Block",
  "Robinhood",
  "Coinbase",
  "Duolingo",
  "Canva",
  "Slack",
  "Dropbox",
] as const;

const ROLE_OPTIONS = [
  "APM / Associate PM",
  "PM Intern",
  "Product Management Intern",
  "Product Manager",
  "Senior Product Manager",
  "Product Operations",
  "Product Analyst",
  "Growth PM",
  "Platform PM",
  "Consumer PM",
  "B2B / Enterprise PM",
  "Technical PM",
  "Design-adjacent PM",
] as const;

const INTERVIEW_TYPE_OPTIONS = [
  { value: "product-sense", label: "Product sense" },
  { value: "execution", label: "Execution / metrics" },
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical / analytical" },
  { value: "mixed", label: "Mixed loop" },
  { value: "hiring-manager", label: "Hiring manager" },
  { value: "recruiter-screen", label: "Recruiter screen" },
] as const;

export type PracticeTarget = {
  company: string;
  role: string;
  interviewType: string;
};

type DrillDraft = {
  phase: "prompt" | "write";
  response: string;
  selectedIds: string[];
};

function drillDraftKey(questionId: string): string {
  return `practice:drill:${questionId}`;
}

function loadDrillDraft(questionId: string): DrillDraft | null {
  return readPageDraft<DrillDraft>(drillDraftKey(questionId));
}

export function loadPracticeTarget(): PracticeTarget {
  if (typeof localStorage === "undefined") return { company: "", role: "", interviewType: "" };
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    if (!raw) return { company: "", role: "", interviewType: "" };
    const parsed = JSON.parse(raw) as PracticeTarget;
    return {
      company: parsed.company ?? "",
      role: parsed.role ?? "",
      interviewType: parsed.interviewType ?? "",
    };
  } catch {
    return { company: "", role: "", interviewType: "" };
  }
}

export function savePracticeTarget(t: PracticeTarget) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TARGET_KEY, JSON.stringify(t));
}

/** Map application / OA company names onto preset dropdown values when possible. */
export function normalizeTargetCompany(company: string): string {
  const key = company.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  for (const preset of COMPANY_OPTIONS) {
    const presetKey = preset.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (key.includes(presetKey) || presetKey.includes(key)) return preset;
  }
  return company.trim();
}

export function roleFromJobTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("intern")) return "PM Intern";
  if (t.includes("associate") || t.includes("apm")) return "APM / Associate PM";
  if (t.includes("senior")) return "Senior Product Manager";
  if (t.includes("product manager") || t.includes("product management")) return "Product Manager";
  return "";
}

function mergePracticeTarget(
  base: PracticeTarget,
  override?: Partial<PracticeTarget>,
): PracticeTarget {
  if (!override) return base;
  return {
    company: override.company ? normalizeTargetCompany(override.company) : base.company,
    role: override.role?.trim() ? override.role : base.role,
    interviewType: override.interviewType?.trim() ? override.interviewType : base.interviewType,
  };
}

function selectMode(
  stored: string,
  presets: readonly string[],
): { mode: string; custom: string } {
  if (!stored) return { mode: "", custom: "" };
  if (presets.includes(stored)) return { mode: stored, custom: "" };
  return { mode: OTHER, custom: stored };
}

function SelectWithOther({
  label,
  stored,
  presets,
  presetLabels,
  otherPlaceholder,
  onCommit,
}: {
  label: string;
  stored: string;
  presets: readonly string[];
  /** If set, presets are value keys and labels come from here (same order). */
  presetLabels?: readonly string[];
  otherPlaceholder: string;
  onCommit: (next: string) => void;
}) {
  const inferred = selectMode(stored, presets);
  const [pickingOther, setPickingOther] = useState(inferred.mode === OTHER);
  const [otherDraft, setOtherDraft] = useState(inferred.mode === OTHER ? inferred.custom : "");

  useEffect(() => {
    if (presets.includes(stored)) {
      setPickingOther(false);
      setOtherDraft("");
    } else if (stored) {
      setPickingOther(true);
      setOtherDraft(stored);
    }
  }, [stored, presets]);

  const selectValue = pickingOther ? OTHER : inferred.mode;

  return (
    <label className="block text-xs">
      <span className={`font-bold uppercase ${practiceTitleYellow}`}>{label}</span>
      <select
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === OTHER) {
            setPickingOther(true);
            if (presets.includes(stored)) {
              setOtherDraft("");
              onCommit("");
            }
            return;
          }
          setPickingOther(false);
          setOtherDraft("");
          onCommit(next);
        }}
        className="mt-1 w-full border-2 border-ink bg-paper px-2 py-1.5 text-sm focus-ink"
      >
        <option value="">Select…</option>
        {presets.map((p, i) => (
          <option key={p} value={p}>
            {presetLabels?.[i] ?? p}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </select>
      {pickingOther && (
        <input
          value={otherDraft}
          onChange={(e) => {
            setOtherDraft(e.target.value);
            onCommit(e.target.value);
          }}
          placeholder={otherPlaceholder}
          className="mt-2 w-full border-2 border-ink bg-paper px-2 py-1.5 text-sm focus-ink"
          aria-label={`${label} (other)`}
        />
      )}
    </label>
  );
}

export function PracticeTargetFields({
  value,
  onChange,
}: {
  value: PracticeTarget;
  onChange: (next: PracticeTarget) => void;
}) {
  const interviewValues = INTERVIEW_TYPE_OPTIONS.map((o) => o.value);
  const interviewLabels = INTERVIEW_TYPE_OPTIONS.map((o) => o.label);

  return (
    <div className="mt-6 border-2 border-ink bg-paper px-4 py-4">
      <p className="font-display text-xs font-extrabold uppercase tracking-wide text-ink">
        Interview you’re prepping for
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        Optional — pick from the list, or choose Other and type your own.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <SelectWithOther
          label="Company"
          stored={value.company}
          presets={COMPANY_OPTIONS}
          otherPlaceholder="Company name"
          onCommit={(company) => onChange({ ...value, company })}
        />
        <SelectWithOther
          label="Role"
          stored={value.role}
          presets={ROLE_OPTIONS}
          otherPlaceholder="e.g. APM / PM intern"
          onCommit={(role) => onChange({ ...value, role })}
        />
        <SelectWithOther
          label="Interview type"
          stored={value.interviewType}
          presets={interviewValues}
          presetLabels={interviewLabels}
          otherPlaceholder="e.g. Case / presentation"
          onCommit={(interviewType) => onChange({ ...value, interviewType })}
        />
      </div>
    </div>
  );
}

export function DrillSession({
  question,
  userId,
  authReady,
  onBack,
  onSaved,
  initialTarget,
}: {
  question: PracticeQuestion;
  userId: string | null;
  authReady: boolean;
  onBack: () => void;
  onSaved: (row: PracticeAttemptRecord) => void;
  /** When set (e.g. OA prep), pre-fills interview target fields. */
  initialTarget?: Partial<PracticeTarget>;
}) {
  const savedDraft = loadDrillDraft(question.id);
  const [phase, setPhase] = useState<"prompt" | "write" | "review">(
    savedDraft?.phase ?? "prompt",
  );
  const [response, setResponse] = useState(savedDraft?.response ?? "");
  const [rubric, setRubric] = useState<Record<string, boolean>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [target, setTarget] = useState<PracticeTarget>(() =>
    mergePracticeTarget(loadPracticeTarget(), initialTarget),
  );
  const [grade, setGrade] = useState<PracticeGradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(savedDraft?.selectedIds ?? []);

  const format = questionFormat(question);
  const isChoice = format === "multiple-choice" || format === "checkbox";

  useEffect(() => {
    if (!initialTarget?.company && !initialTarget?.role && !initialTarget?.interviewType) return;
    setTarget((prev) => {
      const next = mergePracticeTarget(prev, initialTarget);
      savePracticeTarget(next);
      return next;
    });
  }, [initialTarget?.company, initialTarget?.role, initialTarget?.interviewType, question.id]);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (phase === "review") return;
    writePageDraft(drillDraftKey(question.id), {
      phase: phase === "prompt" ? "prompt" : "write",
      response,
      selectedIds,
    } satisfies DrillDraft);
  }, [question.id, phase, response, selectedIds]);

  function updateTarget(next: PracticeTarget) {
    setTarget(next);
    savePracticeTarget(next);
  }

  function appendTranscript(chunk: string) {
    setResponse((prev) => (prev.trim() ? `${prev.trim()} ${chunk}` : chunk));
  }

  function toggleChoice(id: string) {
    if (format === "multiple-choice") {
      setSelectedIds([id]);
      return;
    }
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function startDrill() {
    setPhase("write");
    setGrade(null);
    setGradeError(null);
    setSelectedIds([]);
    if (!userId) return;
    try {
      const row = await createPracticeAttempt(userId, question.id);
      setAttemptId(row.id);
      onSaved(row);
    } catch {
      /* browse ok without save */
    }
  }

  async function persistGrade(result: PracticeGradeResult, responseText: string) {
    setGrade(result);
    const nextRubric: Record<string, boolean> = {};
    for (const d of result.dimensions) {
      nextRubric[d.label] = d.score >= 2;
    }
    setRubric(nextRubric);
    // Feedback audio handled by FeedbackSpeechControls (autoPlay)

    if (userId && attemptId) {
      setSaveState("saving");
      try {
        const row = await updatePracticeAttempt(userId, attemptId, {
          responseText,
          rubricState: nextRubric,
          notes: JSON.stringify({
            gradeSource: result.source,
            overallScore: result.overallScore,
            target,
            format,
            selectedIds,
          }),
          completedAt: new Date().toISOString(),
        });
        onSaved(row);
        setSaveState("saved");
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Error saving");
        setSaveState("error");
      }
    } else if (!userId) {
      setSaveError("Sign in to save this attempt");
      setSaveState("error");
    }
  }

  async function submitForGrade() {
    stopSpeaking();
    setGrading(true);
    setGradeError(null);
    setPhase("review");
    try {
      if (isChoice) {
        const result = gradeChoiceQuestion({
          question,
          selectedIds,
          targetCompany: target.company,
          targetRole: target.role,
          interviewType: target.interviewType,
        });
        const labels =
          question.choices
            ?.filter((c) => selectedIds.includes(c.id))
            .map((c) => c.label)
            .join(" | ") ?? "";
        setResponse(labels);
        await persistGrade(result, labels);
      } else {
        const result = await gradePracticeFn({
          data: {
            questionTitle: question.title,
            questionPrompt: question.prompt,
            category: question.category,
            rubric: question.rubric,
            responseText: response,
            targetCompany: target.company,
            targetRole: target.role,
            interviewType: target.interviewType,
          },
        });
        await persistGrade(result, response);
      }
    } catch (e) {
      setGradeError(e instanceof Error ? e.message : "Grading failed");
    } finally {
      setGrading(false);
    }
  }

  const canSubmitChoice = selectedIds.length > 0;
  const canSubmitOpen = response.trim().length >= 8;

  return (
    <main className="relative px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <button type="button" className={practiceBtnSm} onClick={onBack}>
          ← Back
        </button>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Tab color="yellow">{PRACTICE_CATEGORY_LABELS[question.category]}</Tab>
          <span className="tag">{PRACTICE_FORMAT_LABELS[format]}</span>
          <span className="tag">{DIFFICULTY_LABELS[question.difficulty]}</span>
          <span className="tag">{question.estimatedMinutes} min</span>
          <SaveStatus state={saveState} error={saveError} />
        </div>
        <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight">
          {question.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink">{question.prompt}</p>
        <p className="mt-4 flex flex-wrap gap-2">
          {question.competencies.map((id) => (
            <span
              key={id}
              className="border border-ink/30 px-2 py-0.5 text-xs uppercase text-ink-soft"
            >
              {getCompetency(id as CompetencyId).label}
            </span>
          ))}
        </p>

        <PracticeTargetFields value={target} onChange={updateTarget} />

        {phase === "prompt" && (
          <button
            type="button"
            onClick={startDrill}
            disabled={!authReady && Boolean(userId)}
            className={`mt-8 ${practiceBtn}`}
          >
            Start drill
          </button>
        )}

        {phase === "write" && isChoice && (
          <div className="mt-8">
            <p className="font-display text-sm font-bold uppercase">
              {format === "checkbox" ? "Select all that apply" : "Pick one"}
            </p>
            <ul className="mt-4 space-y-3">
              {(question.choices ?? []).map((c) => {
                const on = selectedIds.includes(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 border-2 border-ink px-4 py-3 transition ${
                        on ? "bg-yellow" : "bg-paper hover:bg-yellow-wash"
                      }`}
                    >
                      <input
                        type={format === "checkbox" ? "checkbox" : "radio"}
                        name={`choice-${question.id}`}
                        className="mt-1 h-4 w-4 accent-ink"
                        checked={on}
                        onChange={() => toggleChoice(c.id)}
                      />
                      <span className="text-[1.02rem] leading-snug text-ink normal-case">
                        {sentenceCase(c.label)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {question.hints && question.hints.length > 0 && (
              <details className="mt-4 border border-ink/40 p-3">
                <summary className="cursor-pointer font-display text-xs font-bold uppercase">
                  Hints
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                  {question.hints.map((h) => (
                    <li key={h}>{sentenceCase(h)}</li>
                  ))}
                </ul>
              </details>
            )}
            <button
              type="button"
              onClick={() => void submitForGrade()}
              disabled={!canSubmitChoice || grading}
              className={`mt-6 ${practiceBtn}`}
            >
              {grading ? "Checking…" : "Check answer"}
            </button>
          </div>
        )}

        {phase === "write" && !isChoice && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="practice-response" className="font-display text-sm font-bold uppercase">
                Your response
              </label>
              <SpeakLiveControls prompt={question.prompt} onTranscript={appendTranscript} />
            </div>
            <textarea
              id="practice-response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={12}
              className="mt-2 w-full border-2 border-ink bg-paper p-4 font-sans text-base leading-relaxed focus-ink"
              placeholder="Type or speak your answer. Submit for thorough AI / coach grading."
            />
            {question.hints && question.hints.length > 0 && (
              <details className="mt-4 border border-ink/40 p-3">
                <summary className="cursor-pointer font-display text-xs font-bold uppercase">
                  Hints
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                  {question.hints.map((h) => (
                    <li key={h}>{sentenceCase(h)}</li>
                  ))}
                </ul>
              </details>
            )}
            <button
              type="button"
              onClick={() => void submitForGrade()}
              disabled={!canSubmitOpen || grading}
              className={`mt-6 ${practiceBtn}`}
            >
              {grading ? "Grading…" : "Submit for AI grade"}
            </button>
          </div>
        )}

        {phase === "review" && (
          <div className="mt-8 space-y-8">
            {grading && <p className="tag">Grading your answer…</p>}
            {gradeError && <p className="tag text-pink">{gradeError}</p>}

            {grade && (
              <Sheet tone="yellow" soft shadow="hard-sm" className="px-6 py-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="tag text-ink">
                      {grade.source === "ai" ? "AI grade" : "Coach grade"}
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-black uppercase">
                      {grade.overallScore}
                      <span className="text-lg"> / 100</span>
                    </h2>
                  </div>
                  {grade.targetNote && (
                    <p className="max-w-[36ch] text-xs italic text-ink-soft">{grade.targetNote}</p>
                  )}
                </div>
                <FeedbackSpeechControls grade={grade} autoPlay />
                <p className="mt-4 text-[1.05rem] leading-relaxed text-ink">{grade.summary}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-display text-xs font-extrabold uppercase text-green">
                      Strengths
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {grade.strengths.length === 0 ? (
                        <li className="text-ink-soft">Keep building — strengths will show up.</li>
                      ) : (
                        grade.strengths.map((s) => <li key={s}>{sentenceCase(s)}</li>)
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="font-display text-xs font-extrabold uppercase text-pink">Gaps</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {grade.gaps.length === 0 ? (
                        <li className="text-ink-soft">No major gaps flagged.</li>
                      ) : (
                        grade.gaps.map((s) => <li key={s}>{sentenceCase(s)}</li>)
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="font-display text-xs font-extrabold uppercase">Rubric breakdown</p>
                  {grade.dimensions.map((d) => (
                    <div key={d.label} className="border-2 border-ink bg-paper px-3 py-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-bold normal-case">{sentenceCase(d.label)}</p>
                        <p className="font-display text-xs font-black uppercase">
                          {d.score}/{d.max}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{sentenceCase(d.feedback)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-2 border-ink bg-paper px-4 py-4">
                  <p className="font-display text-xs font-extrabold uppercase">Rewrite suggestion</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{grade.rewriteSuggestion}</p>
                </div>
                <p className="mt-4 text-sm italic text-ink-soft">{grade.nextDrillTip}</p>
              </Sheet>
            )}

            <Sheet tone="paper" soft pattern="grid" shadow="hard-sm" className="px-6 py-6">
              <p className="tag text-ink">Self-check (optional)</p>
              <ul className="mt-4 space-y-2">
                {question.rubric.map((item) => (
                  <li key={item}>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-ink"
                        checked={Boolean(rubric[item])}
                        onChange={(e) =>
                          setRubric((prev) => ({ ...prev, [item]: e.target.checked }))
                        }
                      />
                      <span className="normal-case">{sentenceCase(item)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Sheet>

            {question.relatedLessonIds[0] && (
              <section>
                <h2 className="font-display text-sm font-extrabold uppercase">Recommended lesson</h2>
                {question.relatedLessonIds.slice(0, 2).map((id) => {
                  const l = getLesson(id);
                  if (!l) return null;
                  return (
                    <Link
                      key={id}
                      to="/learn"
                      search={{ lesson: id }}
                      className="mt-2 block font-display text-sm font-bold uppercase text-green underline decoration-2 underline-offset-2 focus-ink"
                    >
                      {l.title} →
                    </Link>
                  );
                })}
              </section>
            )}

            {question.relatedCreateTemplateIds[0] && (
              <section>
                <h2 className="font-display text-sm font-extrabold uppercase">Keep going</h2>
                {question.relatedCreateTemplateIds.map((id) => {
                  const t = getCreateTemplate(id);
                  if (!t) return null;
                  return (
                    <Link
                      key={id}
                      to="/create"
                      search={{ template: t.id, fromPractice: question.id }}
                      className="mt-2 block font-display text-sm font-bold uppercase text-purple underline decoration-2 underline-offset-2 focus-ink"
                    >
                      Turn this into a {t.title} →
                    </Link>
                  );
                })}
              </section>
            )}

            <button
              type="button"
              className={practiceBtn}
              onClick={() => {
                stopSpeaking();
                setPhase("prompt");
                setResponse("");
                setSelectedIds([]);
                setRubric({});
                setAttemptId(null);
                setGrade(null);
                setGradeError(null);
              }}
            >
              Practice another
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
