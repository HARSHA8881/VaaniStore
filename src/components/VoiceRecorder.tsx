"use client";

import { CircleAlert, LoaderCircle, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MessageKey } from "@/lib/i18n";
import { input } from "./ui/styles";
import { useUi } from "./UiLang";

/**
 * Mic → text. Two paths:
 *  1. Web Speech API (Chrome/Edge/Android Chrome): free, live transcript while speaking.
 *  2. Fallback: MediaRecorder → /api/transcribe (Groq Whisper) for browsers without it.
 * The transcript is a normal controlled textarea, so the owner can fix mistakes by typing.
 */

const MAX_MS = 2 * 60 * 1000;

type SpeechLang = "en-IN" | "hi-IN";
type Status = "idle" | "listening" | "recording" | "uploading";

// Minimal typings: SpeechRecognition isn't in TypeScript's DOM lib yet.
type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: RecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, RecognitionCtor | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickMimeType(): string {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return options.find((m) => MediaRecorder.isTypeSupported?.(m)) ?? "";
}

function joinText(a: string, b: string) {
  return [a.trim(), b.trim()].filter(Boolean).join(" ");
}

export function VoiceRecorder({
  value,
  onChange,
  compact = false,
  placeholder,
  label,
}: {
  value: string;
  onChange: (text: string) => void;
  /** Smaller layout for voice edits / answering a single missing field. */
  compact?: boolean;
  placeholder?: string;
  label?: string;
}) {
  const { t } = useUi();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<MessageKey | null>(null);
  const [speechLang, setSpeechLang] = useState<SpeechLang>("hi-IN");
  const [interim, setInterim] = useState("");
  // Brave/some WebViews expose SpeechRecognition but it always fails with "network";
  // after that happens once we switch to the recorder path for this session.
  const [forceRecorder, setForceRecorder] = useState(false);

  const recognitionRef = useRef<Recognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseTextRef = useRef("");

  // Stop everything if the component unmounts mid-recording.
  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function startTimer(stop: () => void) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(stop, MAX_MS);
  }

  function startSpeech(Ctor: RecognitionCtor) {
    const rec = new Ctor();
    rec.lang = speechLang;
    rec.continuous = true;
    rec.interimResults = true;
    baseTextRef.current = value;

    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + " ";
        else interimText += r[0].transcript;
      }
      onChange(joinText(baseTextRef.current, finalText));
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("errMicDenied");
      else if (e.error === "no-speech") setError("errNoSpeech");
      else if (e.error === "network") {
        setError("errNetwork");
        setForceRecorder(true);
      } else if (e.error !== "aborted") setError("errGeneric");
    };
    rec.onend = () => {
      setStatus("idle");
      setInterim("");
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    recognitionRef.current = rec;
    rec.start();
    setStatus("listening");
    startTimer(() => rec.stop());
  }

  async function startRecorder() {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("errNoMic");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("errMicDenied");
      return;
    }

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearTimeout(timerRef.current);
      const type = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type });
      if (blob.size === 0) {
        setStatus("idle");
        setError("errNoSpeech");
        return;
      }
      await upload(blob, type);
    };

    recorderRef.current = recorder;
    recorder.start();
    setStatus("recording");
    startTimer(() => recorder.state === "recording" && recorder.stop());
  }

  async function upload(blob: Blob, type: string) {
    setStatus("uploading");
    const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
    const form = new FormData();
    form.set("file", new File([blob], `voice.${ext}`, { type: type.split(";")[0] }));
    form.set("language", speechLang === "hi-IN" ? "hi" : "en");
    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; error?: string };
      if (res.status === 413) setError("errTooLong");
      else if (res.status === 422) setError("errNoSpeech");
      else if (!res.ok || !data.text) setError("errGeneric");
      else onChange(joinText(value, data.text));
    } catch {
      setError("errNetwork");
    } finally {
      setStatus("idle");
    }
  }

  function toggle() {
    setError(null);
    if (status === "listening") return recognitionRef.current?.stop();
    if (status === "recording") return recorderRef.current?.stop();
    if (status === "uploading") return;

    const Ctor = forceRecorder ? null : getRecognitionCtor();
    if (Ctor) startSpeech(Ctor);
    else void startRecorder();
  }

  const active = status === "listening" || status === "recording";
  const buttonText =
    status === "uploading" ? t("uploading") : active ? t("listening") : t("tapToSpeak");

  const langToggle = (
    <div
      className="bg-paper-2 inline-flex rounded-full p-1 text-sm"
      role="group"
      aria-label={t("speakLanguage")}
    >
      {(["hi-IN", "en-IN"] as SpeechLang[]).map((l) => (
        <button
          key={l}
          type="button"
          disabled={active}
          onClick={() => setSpeechLang(l)}
          aria-pressed={speechLang === l}
          className="text-ink-soft aria-pressed:bg-surface aria-pressed:text-ink min-h-8 rounded-full px-3 font-medium whitespace-nowrap transition disabled:opacity-60 aria-pressed:shadow-sm"
        >
          {l === "hi-IN" ? t("langHindi") : t("langEnglish")}
        </button>
      ))}
    </div>
  );

  const statusLine = (
    <p
      className={`flex items-center gap-2 font-semibold ${active ? "text-kesar-600" : "text-ink"}`}
      aria-live="polite"
    >
      {active && <Bars />}
      {status === "uploading" && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
      {buttonText}
    </p>
  );

  const micButton = (
    <button
      type="button"
      onClick={toggle}
      disabled={status === "uploading"}
      aria-pressed={active}
      className={`relative z-10 flex shrink-0 items-center justify-center rounded-full text-white transition-[transform,background-color] duration-200 active:scale-95 disabled:opacity-60 ${
        compact ? "h-14 w-14" : "h-28 w-28"
      } ${
        active
          ? "bg-ink shadow-lift"
          : "from-kesar-400 to-kesar-600 bg-gradient-to-b shadow-[0_14px_30px_-10px_rgb(228_98_31/0.75)] hover:scale-[1.03]"
      }`}
    >
      {active ? (
        <Square className={compact ? "h-5 w-5" : "h-8 w-8"} fill="currentColor" aria-hidden />
      ) : (
        <Mic className={compact ? "h-6 w-6" : "h-11 w-11"} strokeWidth={1.75} aria-hidden />
      )}
      <span className="sr-only">{buttonText}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      {compact ? (
        <div className="flex items-center gap-4">
          <div className="relative">
            {active && <Rings />}
            {micButton}
          </div>
          <div className="flex min-w-0 flex-col items-start gap-2">
            {statusLine}
            {langToggle}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <span className="bg-kesar-50 absolute inset-3 rounded-full" aria-hidden />
            {active && <Rings />}
            {micButton}
          </div>
          {statusLine}
          {langToggle}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="bg-danger-50 text-danger flex items-start gap-2 rounded-2xl px-4 py-3 text-sm"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t(error)}
        </p>
      )}

      <label className="block">
        <span className="text-ink-soft mb-1.5 block text-sm font-medium">
          {label ?? t("transcriptLabel")}
        </span>
        <textarea
          value={interim ? joinText(value, interim) : value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={status === "listening"}
          rows={compact ? 2 : 4}
          placeholder={placeholder ?? t("transcriptPlaceholder")}
          className={`${input} resize-none py-3 leading-relaxed ${interim ? "text-ink-soft" : ""}`}
        />
      </label>
    </div>
  );
}

/** Expanding rings behind the mic while recording. */
function Rings() {
  return (
    <>
      <span className="animate-ring bg-kesar-400/40 absolute inset-0 rounded-full" aria-hidden />
      <span
        className="animate-ring bg-kesar-400/30 absolute inset-0 rounded-full [animation-delay:0.8s]"
        aria-hidden
      />
    </>
  );
}

/** Small live "sound bars" next to the listening label. */
function Bars() {
  return (
    <span className="flex h-4 items-center gap-[3px]" aria-hidden>
      {[0, 0.15, 0.3, 0.45].map((d) => (
        <span
          key={d}
          className="animate-bar h-full w-[3px] rounded-full bg-current"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </span>
  );
}
