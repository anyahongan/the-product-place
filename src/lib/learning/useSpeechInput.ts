import { useEffect, useRef, useState } from "react";

type RecResult = { 0: { transcript: string }; isFinal: boolean };
type RecEvent = { resultIndex: number; results: ArrayLike<RecResult> & { length: number } };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechInput(onFinalChunk: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const intentionalStop = useRef(false);
  const onChunkRef = useRef(onFinalChunk);
  onChunkRef.current = onFinalChunk;

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
  }, []);

  function stop() {
    intentionalStop.current = true;
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setListening(false);
  }

  function start() {
    setError(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Live speech isn’t supported in this browser. Try Chrome/Edge, or type instead.");
      return;
    }
    intentionalStop.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) chunk += `${result[0]?.transcript ?? ""} `;
      }
      const trimmed = chunk.trim();
      if (trimmed) onChunkRef.current(trimmed);
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Microphone permission denied. Allow mic access to speak your answers.");
      } else if (event.error !== "aborted") {
        setError(`Mic error: ${event.error}`);
      }
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      // Chrome often ends continuous sessions — restart unless user stopped
      if (!intentionalStop.current && recRef.current === rec) {
        try {
          rec.start();
          setListening(true);
        } catch {
          /* ignore */
        }
      }
    };
    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      setError("Could not start the microphone.");
      setListening(false);
    }
  }

  useEffect(() => () => stop(), []);

  return { supported, listening, error, start, stop };
}
