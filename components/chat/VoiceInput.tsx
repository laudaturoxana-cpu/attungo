"use client";

import { useState, useRef } from "react";

// Web Speech API types (not in lib.dom.d.ts by default in all configs)
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface ISpeechRecognitionCtor {
  new (): ISpeechRecognition;
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  lang?: "ro" | "en";
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, lang = "ro", disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  function startRecording() {
    const w = window as unknown as {
      webkitSpeechRecognition?: ISpeechRecognitionCtor;
      SpeechRecognition?: ISpeechRecognitionCtor;
    };

    const SpeechRecognitionAPI = w.webkitSpeechRecognition ?? w.SpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert(lang === "ro" ? "Browserul tău nu suportă recunoaștere vocală." : "Your browser does not support voice input.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang === "ro" ? "ro-RO" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setRecording(false);
    };

    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  return (
    <button
      type="button"
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      disabled={disabled}
      aria-label={lang === "ro" ? "Vorbește cu Atto" : "Speak to Atto"}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        recording
          ? "bg-red-400 scale-110 shadow-lg shadow-red-400/30"
          : "bg-[#F0FDF8] border border-[#3ECDA0]/40 text-[#1D9E75] hover:bg-[#3ECDA0]/20"
      } disabled:opacity-50`}
    >
      {recording ? (
        // Mic — pulsing
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
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="1" width="6" height="9" rx="3" fill="currentColor" />
          <path d="M2 8a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <line x1="8" y1="14" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
