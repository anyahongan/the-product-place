import { useCallback, useEffect, useRef, useState } from "react";

const PREFS_KEY = "tpp:speech-output:v1";

export type SpeechOutputPrefs = {
  volume: number; // 0–1
  muted: boolean;
};

const DEFAULT_PREFS: SpeechOutputPrefs = { volume: 0.85, muted: false };

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function loadSpeechPrefs(): SpeechOutputPrefs {
  if (typeof localStorage === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<SpeechOutputPrefs>;
    const volume = Math.max(0, Math.min(1, Number(parsed.volume) || DEFAULT_PREFS.volume));
    return { volume, muted: Boolean(parsed.muted) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveSpeechPrefs(prefs: SpeechOutputPrefs) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Prefer natural en voices; Chrome’s “Google US English” / macOS Samantha beat robotic defaults. */
export function pickNaturalVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = en.length > 0 ? en : voices;

  const rank = (v: SpeechSynthesisVoice): number => {
    const n = `${v.name} ${v.lang}`.toLowerCase();
    let score = 0;
    if (n.includes("google") && n.includes("us")) score += 100;
    if (n.includes("google") && n.includes("uk")) score += 90;
    if (n.includes("samantha")) score += 95;
    if (n.includes("aria")) score += 88;
    if (n.includes("jenny")) score += 86;
    if (n.includes("natural")) score += 80;
    if (n.includes("neural")) score += 80;
    if (n.includes("enhanced")) score += 70;
    if (n.includes("premium")) score += 70;
    if (n.includes("microsoft")) score += 55;
    if (v.localService) score += 15;
    if (n.includes("en-us") || n.includes("en_us")) score += 10;
    // Penalize obviously robotic / novelty voices
    if (n.includes("whisper") || n.includes("zarvox") || n.includes("bad news")) score -= 40;
    if (n.includes("compact")) score -= 20;
    return score;
  };

  return [...pool].sort((a, b) => rank(b) - rank(a))[0] ?? null;
}

function getVoicesSafe(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  return window.speechSynthesis.getVoices();
}

export type SpeakOpts = {
  rate?: number;
  pitch?: number;
  volume?: number;
  muted?: boolean;
  onEnd?: () => void;
  onError?: () => void;
};

let voicesWarm = false;

function ensureVoicesLoaded(cb: () => void) {
  if (!canSpeak()) {
    cb();
    return;
  }
  const existing = getVoicesSafe();
  if (existing.length > 0 || voicesWarm) {
    voicesWarm = true;
    cb();
    return;
  }
  const onVoices = () => {
    voicesWarm = true;
    window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
    cb();
  };
  window.speechSynthesis.addEventListener("voiceschanged", onVoices);
  // Some browsers never fire voiceschanged if already cached empty — timeout fallback
  window.setTimeout(() => {
    voicesWarm = true;
    window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
    cb();
  }, 250);
}

/** Speak text aloud with the best available natural voice. */
export function speakText(text: string, opts?: SpeakOpts): void {
  const prefs = loadSpeechPrefs();
  const muted = opts?.muted ?? prefs.muted;
  const volume = opts?.volume ?? prefs.volume;

  if (!canSpeak() || muted || volume <= 0.01) {
    // Keep flow moving when muted — short beat so captions can register
    window.setTimeout(() => opts?.onEnd?.(), muted || volume <= 0.01 ? 280 : 0);
    if (!canSpeak()) opts?.onError?.();
    return;
  }

  ensureVoicesLoaded(() => {
    window.speechSynthesis.cancel();
    // Chrome sometimes needs a tiny delay after cancel before speak
    window.setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickNaturalVoice(getVoicesSafe());
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang || "en-US";
      } else {
        u.lang = "en-US";
      }
      // Slightly slower + neutral pitch reads more conversational than the default robot pace
      u.rate = opts?.rate ?? 0.92;
      u.pitch = opts?.pitch ?? 1.02;
      u.volume = Math.max(0, Math.min(1, volume));
      u.onend = () => opts?.onEnd?.();
      u.onerror = () => opts?.onError?.();
      window.speechSynthesis.speak(u);
    }, 40);
  });
}

export function stopSpeaking(): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
}

export function pauseSpeaking(): void {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.pause();
  } catch {
    /* ignore */
  }
}

export function resumeSpeaking(): void {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.resume();
  } catch {
    /* ignore */
  }
}

export function isSpeechPaused(): boolean {
  return canSpeak() && window.speechSynthesis.paused;
}

export function useSpeechOutput() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [prefs, setPrefs] = useState<SpeechOutputPrefs>(() => loadSpeechPrefs());
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const endRef = useRef<(() => void) | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    setSupported(canSpeak());
    if (!canSpeak()) return;

    const refreshVoice = () => {
      const v = pickNaturalVoice(getVoicesSafe());
      setVoiceName(v?.name ?? null);
    };
    refreshVoice();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoice);

    // Poll pause state — no native event
    const id = window.setInterval(() => {
      setPaused(window.speechSynthesis.speaking && window.speechSynthesis.paused);
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        setSpeaking(false);
      }
    }, 200);

    return () => {
      window.clearInterval(id);
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoice);
      stopSpeaking();
    };
  }, []);

  const updatePrefs = useCallback((patch: Partial<SpeechOutputPrefs>) => {
    setPrefs((prev) => {
      const next = {
        volume: patch.volume !== undefined ? Math.max(0, Math.min(1, patch.volume)) : prev.volume,
        muted: patch.muted !== undefined ? patch.muted : prev.muted,
      };
      saveSpeechPrefs(next);
      prefsRef.current = next;
      return next;
    });
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    endRef.current = onEnd ?? null;
    const p = prefsRef.current;
    if (!canSpeak()) {
      onEnd?.();
      return;
    }
    setPaused(false);
    setSpeaking(true);
    speakText(text, {
      muted: p.muted,
      volume: p.volume,
      onEnd: () => {
        setSpeaking(false);
        setPaused(false);
        endRef.current?.();
        endRef.current = null;
      },
      onError: () => {
        setSpeaking(false);
        setPaused(false);
        endRef.current?.();
        endRef.current = null;
      },
    });
  }, []);

  const stop = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
    setPaused(false);
    endRef.current = null;
  }, []);

  const pause = useCallback(() => {
    pauseSpeaking();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    resumeSpeaking();
    setPaused(false);
    setSpeaking(true);
  }, []);

  const toggleMute = useCallback(() => {
    const willMute = !prefsRef.current.muted;
    updatePrefs({ muted: willMute });
    if (willMute) {
      stopSpeaking();
      setSpeaking(false);
      setPaused(false);
    }
  }, [updatePrefs]);

  return {
    supported,
    speaking,
    paused,
    prefs,
    voiceName,
    speak,
    stop,
    pause,
    resume,
    toggleMute,
    setVolume: (volume: number) => updatePrefs({ volume }),
    setMuted: (muted: boolean) => {
      updatePrefs({ muted });
      if (muted) {
        stopSpeaking();
        setSpeaking(false);
        setPaused(false);
      }
    },
  };
}
