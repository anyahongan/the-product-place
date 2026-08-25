import { Sheet } from "@/components/paper/Paper";
import { practiceBtnSm, practiceBtnListening, practiceTitleYellow } from "@/components/practice/practiceUi";
import { useSpeechInput } from "@/lib/learning/useSpeechInput";
import { useSpeechOutput } from "@/lib/learning/useSpeechOutput";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "speaking" | "listening" | "paused";

export function LiveCoachPanel({
  prompt,
  open,
  onClose,
  onTranscript,
}: {
  prompt: string;
  open: boolean;
  onClose: () => void;
  onTranscript: (chunk: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [caption, setCaption] = useState("");
  const startedRef = useRef(false);
  const scriptPausedRef = useRef(false);
  const tts = useSpeechOutput();
  const speech = useSpeechInput((chunk) => {
    onTranscript(chunk);
  });

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      scriptPausedRef.current = false;
      tts.stop();
      speech.stop();
      setPhase("idle");
      setCaption("");
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    beginInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once when opened
  }, [open]);

  function beginInterview() {
    speech.stop();
    scriptPausedRef.current = false;
    const intro =
      "Alright — here's your interview question. Take a breath, then answer when I finish.";
    setPhase("speaking");
    setCaption(intro);
    tts.speak(intro, () => {
      if (scriptPausedRef.current) return;
      setCaption(prompt);
      tts.speak(prompt, () => {
        if (scriptPausedRef.current) return;
        const go = "Whenever you're ready — I'm listening.";
        setCaption(go);
        tts.speak(go, () => {
          if (scriptPausedRef.current) return;
          setPhase("listening");
          setCaption("Listening to your answer…");
          speech.start();
        });
      });
    });
  }

  /** Pause the AI reader mid-utterance (keeps place when possible). */
  function pauseReader() {
    tts.pause();
    setCaption((c) => (c.endsWith("(paused)") ? c : `${c} (paused)`));
  }

  function resumeReader() {
    tts.resume();
    setCaption((c) => c.replace(/\s*\(paused\)$/, ""));
  }

  function stopAll() {
    scriptPausedRef.current = true;
    tts.stop();
    speech.stop();
    setPhase("paused");
    setCaption("Paused. Replay the question, keep listening, or adjust the reader below.");
  }

  function resumeSpeak() {
    beginInterview();
  }

  function keepListening() {
    scriptPausedRef.current = false;
    setPhase("listening");
    setCaption("Listening to your answer…");
    speech.start();
  }

  function endLive() {
    scriptPausedRef.current = true;
    tts.stop();
    speech.stop();
    startedRef.current = false;
    setPhase("idle");
    onClose();
  }

  if (!open) return null;

  const statusLabel =
    phase === "speaking" && tts.paused
      ? "Reader paused"
      : phase === "speaking"
        ? "Interviewer speaking"
        : phase === "listening" || speech.listening
          ? "Your turn — mic on"
          : phase === "paused"
            ? "Paused"
            : "Live coach";

  const volPct = Math.round(tts.prefs.volume * 100);

  return (
    <div role="region" aria-live="polite" aria-label="Live interview coach">
      <Sheet
        tone="paper"
        soft
        shadow="hard-sm"
        className="mt-6 border-l-4 border-l-yellow px-5 py-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wide text-ink">
              Live coach
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink-soft">
              {statusLabel}
              {tts.prefs.muted ? " · muted" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {phase === "speaking" && tts.speaking && !tts.paused && (
              <button type="button" className={practiceBtnSm} onClick={pauseReader}>
                Pause reader
              </button>
            )}
            {phase === "speaking" && tts.paused && (
              <button type="button" className={practiceBtnSm} onClick={resumeReader}>
                Resume reader
              </button>
            )}
            {(phase === "speaking" || phase === "listening" || speech.listening) && (
              <button type="button" className={practiceBtnSm} onClick={stopAll}>
                Pause session
              </button>
            )}
            {phase === "paused" && (
              <>
                <button type="button" className={practiceBtnSm} onClick={resumeSpeak}>
                  Replay question
                </button>
                <button type="button" className={practiceBtnSm} onClick={keepListening}>
                  Keep listening
                </button>
              </>
            )}
            <button
              type="button"
              className={speech.listening ? practiceBtnListening : practiceBtnSm}
              onClick={endLive}
            >
              End live
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center border-2 border-ink font-display text-lg font-black uppercase ${
              phase === "speaking" && !tts.paused
                ? "animate-pulse bg-ink text-yellow"
                : speech.listening
                  ? "bg-yellow text-ink"
                  : "bg-paper-2 text-ink"
            }`}
            aria-hidden
          >
            {phase === "speaking" ? "AI" : "You"}
          </div>
          <p className="min-h-[3.5rem] text-[1.05rem] leading-relaxed text-ink">{caption}</p>
        </div>

        {/* Reader controls */}
        <div className="mt-5 border-t-2 border-ink/15 pt-4">
          <p className={`font-display text-xs font-extrabold uppercase tracking-wide ${practiceTitleYellow}`}>
            AI reader
          </p>
          {tts.voiceName && (
            <p className="mt-1 text-xs text-ink-soft">Voice: {tts.voiceName}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={tts.prefs.muted ? practiceBtnListening : practiceBtnSm}
              onClick={() => tts.toggleMute()}
            >
              {tts.prefs.muted ? "Unmute" : "Mute"}
            </button>
            <label className="flex min-w-[12rem] flex-1 items-center gap-2 text-xs">
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
                aria-label="AI reader volume"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Mute skips the voice but still shows the script. Volume is saved on this device.
          </p>
        </div>

        {!tts.supported && (
          <p className="mt-3 text-xs text-ink-soft">
            Voice playback isn’t available in this browser — still listening via mic when supported.
          </p>
        )}
        {speech.error && <p className="mt-2 text-sm text-pink">{speech.error}</p>}
        {!speech.supported && (
          <p className="mt-2 text-xs text-ink-soft">
            Mic speech isn’t supported here (try Chrome/Edge). You can still type your answer.
          </p>
        )}
      </Sheet>
    </div>
  );
}

/** Speak live control + live coach that talks back, then listens. */
export function SpeakLiveControls({
  prompt,
  onTranscript,
}: {
  prompt: string;
  onTranscript: (chunk: string) => void;
}) {
  const [liveOpen, setLiveOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        className={liveOpen ? practiceBtnListening : practiceBtnSm}
        onClick={() => setLiveOpen((v) => !v)}
      >
        {liveOpen ? "Hide live coach" : "Speak live"}
      </button>
      <LiveCoachPanel
        prompt={prompt}
        open={liveOpen}
        onClose={() => setLiveOpen(false)}
        onTranscript={onTranscript}
      />
    </div>
  );
}
