import { useState } from "react";
import type { LessonCheckpoint } from "@/lib/learning/types";
import {
  localGetCheckpointAnswers,
  localSaveCheckpointAnswer,
} from "@/lib/learning/localStore";

export function CheckpointQuiz({
  lessonId,
  checkpoints,
}: {
  lessonId: string;
  checkpoints: LessonCheckpoint[];
}) {
  const [answers, setAnswers] = useState(() => localGetCheckpointAnswers(lessonId));
  const [pending, setPending] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  return (
    <section className="mt-12 space-y-6 border-t-2 border-ink pt-8" aria-label="Reading checkpoints">
      <h2 className="font-display text-lg font-extrabold uppercase text-green">Check your reading</h2>
      <p className="text-sm text-ink-soft">
        Quick multiple-choice checkpoints — submit to see the explanation. Saved on this device.
      </p>
      {checkpoints.map((cp, idx) => {
        const selected = pending[cp.id] ?? answers[cp.id] ?? null;
        const isSubmitted = Boolean(submitted[cp.id] || answers[cp.id] !== undefined);
        const showResult = isSubmitted && selected !== null;
        const correct = selected === cp.correctIndex;

        return (
          <div key={cp.id} className="border-2 border-ink bg-paper p-5 shadow-[var(--shadow-hard-sm)]">
            <p className="tag text-ink-faint">Checkpoint {idx + 1}</p>
            <p className="mt-2 font-display text-base font-extrabold uppercase leading-snug">{cp.prompt}</p>
            <fieldset className="mt-4 space-y-2" disabled={showResult}>
              <legend className="sr-only">Choices</legend>
              {cp.choices.map((choice, i) => {
                const letter = String.fromCharCode(65 + i);
                const picked = selected === i;
                return (
                  <label
                    key={choice}
                    className={`flex cursor-pointer items-start gap-3 border-2 border-ink px-3 py-2 text-sm ${
                      picked ? "bg-green-wash" : "bg-paper hover:bg-paper-2"
                    } ${showResult && i === cp.correctIndex ? "ring-2 ring-green" : ""}`}
                  >
                    <input
                      type="radio"
                      name={cp.id}
                      className="mt-1 accent-ink"
                      checked={picked}
                      onChange={() => setPending((p) => ({ ...p, [cp.id]: i }))}
                    />
                    <span>
                      <span className="font-bold">{letter}.</span> {choice}
                    </span>
                  </label>
                );
              })}
            </fieldset>
            {!showResult ? (
              <button
                type="button"
                disabled={selected === null}
                onClick={() => {
                  if (selected === null) return;
                  localSaveCheckpointAnswer(lessonId, cp.id, selected);
                  setAnswers((a) => ({ ...a, [cp.id]: selected }));
                  setSubmitted((s) => ({ ...s, [cp.id]: true }));
                }}
                className="mt-4 border-2 border-ink bg-ink px-4 py-2 font-display text-xs font-bold uppercase text-paper focus-ink disabled:opacity-40 hover:bg-green hover:text-ink"
              >
                Submit answer
              </button>
            ) : (
              <div
                className={`mt-4 border-2 border-ink px-3 py-3 text-sm ${
                  correct ? "bg-green-wash" : "bg-pink-wash"
                }`}
                role="status"
              >
                <p className="font-display text-xs font-bold uppercase">
                  {correct ? "Correct" : "Not quite"}
                </p>
                <p className="mt-1 text-ink">{cp.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
