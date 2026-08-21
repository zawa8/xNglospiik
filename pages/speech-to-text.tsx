import React, { useState, useRef, useCallback } from "react";
import { hindiSentenceToXi38 } from "../lib/devanagariToXi38";
import { XNgloTextTokenizer, IndianPhonemeTranslator, HumanVoiceEngine } from "./index";

// Minimal ambient types for the Web Speech API -- not in default TS lib.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: Event) => void) | null;
}

export default function SpeechToXi38() {
  const [lang, setLang] = useState<string>("hi-IN");
  const [isListening, setIsListening] = useState(false);
  const [rawTranscript, setRawTranscript] = useState("");
  const [xi38Text, setXi38Text] = useState("");
  const [supportError, setSupportError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getRecognitionCtor = (): (new () => SpeechRecognitionLike) | null => {
    const w = window as unknown as Record<string, unknown>;
    return (w.SpeechRecognition || w.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionLike)
      | undefined
      | null
      ?? null;
  };

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupportError(
        "This browser doesn't support the Web Speech API. Try Chrome on Android/desktop."
      );
      return;
    }
    setSupportError("");
    setRawTranscript("");
    setXi38Text("");

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (ev: SpeechRecognitionEventLike) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) finalChunk += res[0].transcript;
        else interimChunk += res[0].transcript;
      }
      setRawTranscript((prev) => {
        const combined = (prev + " " + finalChunk).trim();
        const preview = (combined + " " + interimChunk).trim();
        setXi38Text(hindiSentenceToXi38(preview));
        return finalChunk ? combined : prev;
      });
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speakXi38Back = () => {
    if (!xi38Text.trim() || isSpeaking) return;
    setIsSpeaking(true);
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    HumanVoiceEngine.primeCacheForAllPhonemes(ctx).then(() => {
      const units = XNgloTextTokenizer.processInputIntoClusters(xi38Text);
      const speechCount = units.filter(
        (u) => u !== " " && ![".", ",", "!", "?"].includes(u)
      ).length;
      const speedMs = 170;
      let clock = ctx.currentTime;
      let idx = 0;
      units.forEach((c) => {
        if (c === " ") {
          clock += speedMs / 1000;
          return;
        }
        if ([".", ",", "!", "?"].includes(c)) {
          clock += (speedMs / 1000) * 1.8;
          return;
        }
        const targetPhonemes = IndianPhonemeTranslator.translateCluster(c);
        clock = HumanVoiceEngine.playSequence(
          ctx,
          targetPhonemes,
          speedMs / 1000 / Math.max(1, targetPhonemes.length),
          clock,
          135,
          0.5,
          5,
          5.5,
          "steady",
          idx,
          speechCount
        );
        idx++;
      });
      setTimeout(
        () => setIsSpeaking(false),
        Math.max(0, (clock - ctx.currentTime) * 1000)
      );
    });
  };

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#0b0f19",
        color: "#e2e8f0",
        minHeight: "100vh",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <main
        style={{
          backgroundColor: "#111827",
          padding: "1.75rem",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
        }}
      >
        <h2 style={{ color: "#38bdf8", marginTop: 0, marginBottom: "0.25rem" }}>
          Speech → xi38 (direct)
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 0, marginBottom: "1.25rem" }}>
          Mic straight to xi38 -- no e52, no Devanagari shown. Reverse of{" "}
          <a href="/reverse" style={{ color: "#38bdf8" }}>
            xi38 → Speech
          </a>
          .
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", alignItems: "center" }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={isListening}
            style={{
              backgroundColor: "#030712",
              color: "#fff",
              border: "1px solid #374151",
              padding: "0.4rem",
              borderRadius: "4px",
              fontSize: "0.85rem",
            }}
          >
            <option value="hi-IN">Hindi (hi-IN)</option>
            <option value="en-IN">English India (en-IN)</option>
            <option value="en-US">English US (en-US)</option>
          </select>

          <button
            onClick={isListening ? stopListening : startListening}
            style={{
              backgroundColor: isListening ? "#f43f5e" : "#0ea5e9",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            {isListening ? "⏹ Stop" : "🎙 Start Listening"}
          </button>
        </div>

        {supportError && (
          <div style={{ color: "#f43f5e", fontSize: "0.8rem", marginBottom: "1rem" }}>
            {supportError}
          </div>
        )}

        <div
          style={{
            margin: "0 0 1.5rem 0",
            backgroundColor: "#030712",
            padding: "0.75rem",
            borderRadius: "6px",
            borderLeft: "4px solid #f43f5e",
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "bold" }}>
            XI38 TEXT:
          </div>
          <div style={{ fontFamily: "monospace", color: "#f43f5e", fontSize: "1.2rem", fontWeight: "bold", marginTop: "0.2rem", minHeight: "1.5rem" }}>
            {xi38Text || (isListening ? "listening..." : "—")}
          </div>
        </div>

        <button
          onClick={speakXi38Back}
          disabled={!xi38Text.trim() || isSpeaking}
          style={{
            width: "100%",
            padding: "0.9rem",
            backgroundColor: isSpeaking ? "#334155" : "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "1.05rem",
            cursor: "pointer",
          }}
        >
          {isSpeaking ? "Speaking..." : "🔊 Speak xi38 text back (verify)"}
        </button>
      </main>
    </div>
  );
}
