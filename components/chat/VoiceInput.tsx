"use client";

import { useState, useRef, useEffect } from "react";

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognitionCtor {
  new (): ISpeechRecognition;
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  lang?: "ro" | "en";
  disabled?: boolean;
  bigMode?: boolean;
}

function getSpeechRecognition(): ISpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    webkitSpeechRecognition?: ISpeechRecognitionCtor;
    SpeechRecognition?: ISpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceInput({ onTranscript, lang = "ro", disabled, bigMode = false }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const resultReceivedRef = useRef(false);

  // Auto-clear error after 4 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  function showError(msg: string) {
    setError(msg);
    setRecording(false);
  }

  function startRecording() {
    setError(null);
    const SpeechRecognitionAPI = getSpeechRecognition();

    if (!SpeechRecognitionAPI) {
      showError(lang === "ro"
        ? "Microfonul nu e disponibil. Folosește Chrome sau Safari."
        : "Microphone not available. Use Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    // Try ro-RO first, iOS Safari sometimes needs just "ro"
    recognition.lang = lang === "ro" ? "ro-RO" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    resultReceivedRef.current = false;

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      resultReceivedRef.current = true;
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
      setRecording(false);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      const code = event.error;
      if (code === "not-allowed" || code === "permission-denied") {
        showError(lang === "ro"
          ? "Permisiunea pentru microfon e blocată. Permite accesul în setările browserului."
          : "Microphone permission is blocked. Allow it in browser settings.");
      } else if (code === "no-speech") {
        showError(lang === "ro"
          ? "Nu te-am auzit. Vorbește mai tare și încearcă din nou."
          : "I didn't hear you. Speak louder and try again.");
      } else if (code === "network") {
        showError(lang === "ro"
          ? "Eroare de rețea. Verifică conexiunea."
          : "Network error. Check your connection.");
      } else if (code === "audio-capture") {
        showError(lang === "ro"
          ? "Microfonul nu e disponibil pe acest dispozitiv."
          : "Microphone not available on this device.");
      } else {
        showError(lang === "ro"
          ? "Eroare microfon. Încearcă din nou."
          : "Microphone error. Try again.");
      }
    };

    recognition.onend = () => {
      setRecording(false);
      // No result and no error = silence / too short
      if (!resultReceivedRef.current && !error) {
        showError(lang === "ro"
          ? "Nu te-am auzit. Apasă și vorbește clar."
          : "I didn't hear you. Tap and speak clearly.");
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
    } catch {
      showError(lang === "ro"
        ? "Nu pot porni microfonul. Încearcă din nou."
        : "Can't start microphone. Try again.");
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  // ── BIG MODE (grades 1-2) ──────────────────────────────────────────
  if (bigMode) {
    return (
      <div className="w-full flex flex-col gap-1.5">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={disabled}
          aria-label={recording
            ? (lang === "ro" ? "Oprește înregistrarea" : "Stop recording")
            : (lang === "ro" ? "Vorbește cu Atto" : "Speak to Atto")}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-semibold text-base transition-all active:scale-95 disabled:opacity-50 ${
            recording
              ? "bg-red-100 border-2 border-red-300 text-red-600 shadow-lg shadow-red-100"
              : "bg-[#F0FDF8] border-2 border-[#3ECDA0]/50 text-[#1D9E75] hover:bg-[#3ECDA0]/20 hover:border-[#3ECDA0]"
          }`}
        >
          {recording ? (
            <>
              <span className="flex items-end gap-1 h-6">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-red-400"
                    style={{
                      height: i % 2 === 0 ? "20px" : "14px",
                      animation: `typing-dot 0.8s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </span>
              <span>{lang === "ro" ? "Ascult... apasă când termini" : "Listening... tap when done"}</span>
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="1" width="6" height="9" rx="3" fill="currentColor" />
                <path d="M2 8a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <line x1="8" y1="14" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{lang === "ro" ? "Vorbește cu Atto" : "Speak to Atto"}</span>
            </>
          )}
        </button>
        {error && (
          <p className="text-xs text-red-500 text-center px-2">{error}</p>
        )}
      </div>
    );
  }

  // ── COMPACT MODE (grades 3+) ───────────────────────────────────────
  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        aria-label={recording
          ? (lang === "ro" ? "Oprește înregistrarea" : "Stop recording")
          : (lang === "ro" ? "Vorbește cu Atto" : "Speak to Atto")}
        className={`flex items-center gap-1.5 px-3 h-10 rounded-full transition-all active:scale-95 ${
          recording
            ? "bg-red-400 text-white shadow-lg shadow-red-400/30"
            : error
              ? "bg-red-50 border border-red-300 text-red-500"
              : "bg-[#F0FDF8] border border-[#3ECDA0]/40 text-[#1D9E75] hover:bg-[#3ECDA0]/20"
        } disabled:opacity-50`}
      >
        {recording ? (
          <>
            <span className="flex gap-0.5 items-end">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-0.5 bg-white rounded-full"
                  style={{
                    height: "8px",
                    animation: `typing-dot 1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </span>
            <span className="text-xs font-medium text-white">
              {lang === "ro" ? "Ascult..." : "Listening..."}
            </span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="1" width="6" height="9" rx="3" fill="currentColor" />
              <path d="M2 8a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <line x1="8" y1="14" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-medium">
              {lang === "ro" ? "Vorbește" : "Speak"}
            </span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500 leading-tight max-w-[200px]">{error}</p>
      )}
    </div>
  );
}
