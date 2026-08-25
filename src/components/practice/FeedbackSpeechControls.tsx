import {
  practiceBtnOnWash,
  practiceTitleYellow,
} from "@/components/practice/practiceUi";
import type { PracticeGradeResult } from "@/lib/learning/practiceGrade";
import { useSpeechOutput } from "@/lib/learning/useSpeechOutput";
import { useEffect } from "react";

export function buildFeedbackScript(result: PracticeGradeResult): string {
  const strengths =
    result.strengths.length > 0
      ? `Strengths: ${result.strengths.slice(0, 2).join(". ")}.`
      : "";
  const gaps =
    result.gaps.length > 0 ? `Gaps: ${result.gaps.slice(0, 2).join(". ")}.` : "";
  return `Score ${result.overallScore} out of 100. ${result.summary} ${strengths} ${gaps} ${result.rewriteSuggestion}`;
}

/** Hear / pause / resume / mute controls for spoken grade feedback. */
export function FeedbackSpeechControls({
  grade,
  autoPlay = false,
}: {
  grade: PracticeGradeResult;
  /** Speak once when grade first appears. */
  autoPlay?: boolean;
}) {
  const tts = useSpeechOutput();
  const script = buildFeedbackScript(grade);
  const autoKey = `${grade.overallScore}:${grade.summary.slice(0, 48)}`;

  useEffect(() => {
    if (!autoPlay) return;
    tts.speak(script);
    return () => {
      tts.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replay only when this grade changes
  }, [autoKey, autoPlay]);

  const volPct = Math.round(tts.prefs.volume * 100);
  const playing = tts.speaking && !tts.paused;
  const paused = tts.paused;

  return (
    <div className="mt-3 border-2 border-ink bg-paper px-3 py-3">
      <p className={`font-display text-xs font-extrabold uppercase tracking-wide ${practiceTitleYellow}`}>
        Feedback audio
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {!playing && !paused && (
          <button
            type="button"
            className={practiceBtnOnWash}
            onClick={() => tts.speak(script)}
            disabled={!tts.supported || tts.prefs.muted}
          >
            Hear feedback
          </button>
        )}
        {playing && (
          <button type="button" className={practiceBtnOnWash} onClick={() => tts.pause()}>
            Pause feedback
          </button>
        )}
        {paused && (
          <button type="button" className={practiceBtnOnWash} onClick={() => tts.resume()}>
            Resume feedback
          </button>
        )}
        {(playing || paused) && (
          <button type="button" className={practiceBtnOnWash} onClick={() => tts.stop()}>
            Stop
          </button>
        )}
        <button
          type="button"
          className={practiceBtnOnWash}
          onClick={() => {
            const willMute = !tts.prefs.muted;
            tts.setMuted(willMute);
            if (willMute) tts.stop();
          }}
        >
          {tts.prefs.muted ? "Unmute feedback" : "Mute feedback"}
        </button>
      </div>
      <label className="mt-3 flex max-w-sm items-center gap-2 text-xs">
        <span className="shrink-0 font-bold uppercase text-ink-soft">Vol {volPct}%</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={volPct}
          disabled={tts.prefs.muted}
          onChange={(e) => tts.setVolume(Number(e.target.value) / 100)}
          className="w-full accent-ink disabled:opacity-40"
          aria-label="Feedback volume"
        />
      </label>
      {tts.prefs.muted && (
        <p className="mt-2 text-xs text-ink-soft">Feedback voice is muted. Unmute to hear grades aloud.</p>
      )}
      {!tts.supported && (
        <p className="mt-2 text-xs text-ink-soft">Voice playback isn’t available in this browser.</p>
      )}
    </div>
  );
}
