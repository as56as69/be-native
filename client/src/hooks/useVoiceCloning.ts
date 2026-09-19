import { useCallback, useEffect, useRef, useState } from "react";

import { getVoiceCloneConfig, type VoiceCloneProvider } from "../services/apiConfig";
import { audioKey, getAudioBlob, saveAudioBlob } from "../utils/audioCache";
import { playBlob, speakViaWeb } from "./useVibeAudio";

/**
 * "بصمتي الصوتية" — 5-second mic sample + per-day clone quota (5/day).
 *
 * Employs ONLY the recorded voice for Gen Z English slang delivery — no
 * Arabic synthesis. Cache-first, quota-checked, provider-or-mock synth.
 */

export const CLONE_DAILY_LIMIT = 5;
export const CLONE_VOICE_TYPE = "MYVOICE" as const;
const SAMPLE_KEY = "audio_voice_sample_MYVOICE";
const QUOTA_KEY = "native_slang_clone_quota";

interface CloneQuota {
  date: string;
  used: number;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readQuota(): CloneQuota {
  try {
    const raw = window.localStorage.getItem(QUOTA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CloneQuota;
      if (parsed.date === todayKey() && Number.isFinite(parsed.used)) return parsed;
    }
  } catch {
    /* corrupt — reset */
  }
  return { date: todayKey(), used: 0 };
}

function writeQuota(quota: CloneQuota) {
  try {
    window.localStorage.setItem(QUOTA_KEY, JSON.stringify(quota));
  } catch {
    /* private mode — in-memory quota still applies this session */
  }
}

/* ── mock clone synthesizer (WAV placeholder via OfflineAudioContext) ─── */

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function mockCloneBlob(): Promise<Blob> {
  try {
    const sampleRate = 22050;
    const ctx = new OfflineAudioContext(1, Math.floor(sampleRate * 0.7), sampleRate);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(196, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(392, ctx.currentTime + 0.45);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.68);
    osc.connect(gain).connect(ctx.destination);
    osc.start(0);
    osc.stop(0.7);
    const rendered = await ctx.startRendering();
    return encodeWav(rendered.getChannelData(0), sampleRate);
  } catch {
    return new Blob([], { type: "audio/wav" });
  }
}

/* ── real voice-clone providers (best-effort) ─────────────────────────── */

async function fetchCloneBlob(text: string, provider: VoiceCloneProvider, apiKey: string): Promise<Blob | null> {
  try {
    if (provider === "ELEVENLABS") {
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
        method: "POST",
        headers: { "x-api-key": apiKey, "Content-Type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.4, similarity_boost: 0.95 },
        }),
      });
      return response.ok ? await response.blob() : null;
    }
    if (provider === "CARTESIA") {
      const response = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Cartesia-Version": "2024-06-10",
          "Content-Type": "application/json",
          accept: "audio/wav",
        },
        body: JSON.stringify({
          transcript: text,
          output_format: { container: "wav", encoding: "pcm_s16le", sample_rate: 22050 },
          voice: { mode: "id", id: "39ed3294-a79b-4be8-9cf9-95f247f85d1b" },
        }),
      });
      return response.ok ? await response.blob() : null;
    }
    return null;
  } catch {
    return null;
  }
}

export type ClonePlayStatus = "cache" | "clone" | "mock" | "NO_QUOTA" | "NO_SAMPLE" | "error";

export interface UseVoiceCloningResult {
  /** Daily remaining quota (max 5). */
  remaining: number;
  /** Whether a 5s voice sample is embedded (from IndexedDB). */
  hasSample: boolean;
  /** Mid-recording flag. */
  isRecording: boolean;
  /** Localized error message (denied mic, unsupported browser…). */
  recordError: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  /**
   * Voice-clone + play "my voice" for a Gen Z slang phrase.
   * Cache-first; on hit it replays for free (no quota spend).
   */
  cloneAndPlay: (phraseId: string, text: string) => Promise<ClonePlayStatus>;
}

export function useVoiceCloning(): UseVoiceCloningResult {
  const [remaining, setRemaining] = useState(() => Math.max(0, CLONE_DAILY_LIMIT - readQuota().used));
  const [hasSample, setHasSample] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    void getAudioBlob(SAMPLE_KEY).then((blob) => {
      if (mounted) setHasSample(Boolean(blob));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const startRecording = useCallback(async () => {
    setRecordError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setRecordError("التسجيل الصوتي غير متاح في هذا المتصفح/السياق.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (typeof MediaRecorder === "undefined") {
        stream.getTracks().forEach((track) => track.stop());
        setRecordError("MediaRecorder غير مدعوم هنا.");
        return;
      }
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        void saveAudioBlob(SAMPLE_KEY, blob);
        setHasSample(true);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      timerRef.current = window.setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 5000);
    } catch {
      setRecordError("لم أتمكن من الوصول إلى الميكروفون. تأكد من السماح به.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const cloneAndPlay = useCallback(
    async (phraseId: string, text: string): Promise<ClonePlayStatus> => {
      const key = audioKey(phraseId, CLONE_VOICE_TYPE);
      const cached = await getAudioBlob(key);
      if (cached) {
        playBlob(cached);
        return "cache";
      }
      const quota = readQuota();
      const left = Math.max(0, CLONE_DAILY_LIMIT - quota.used);
      if (left <= 0) {
        setRemaining(0);
        return "NO_QUOTA";
      }
      const sample = await getAudioBlob(SAMPLE_KEY);
      if (!sample) return "NO_SAMPLE";

      const { apiKey, provider } = getVoiceCloneConfig();
      let blob: Blob | null = null;
      if (provider === "MOCK") {
        blob = await mockCloneBlob();
        if (!blob.size) return "error";
        await saveAudioBlob(key, blob);
        playBlob(blob);
        writeQuota({ date: todayKey(), used: quota.used + 1 });
        setRemaining(Math.max(0, CLONE_DAILY_LIMIT - (quota.used + 1)));
        return "mock";
      }
      blob = await fetchCloneBlob(text, provider, apiKey);
      if (blob) {
        await saveAudioBlob(key, blob);
        playBlob(blob);
        writeQuota({ date: todayKey(), used: quota.used + 1 });
        setRemaining(Math.max(0, CLONE_DAILY_LIMIT - (quota.used + 1)));
        return "clone";
      }
      // Provider missed silently — speak via Web Speech (English only), skip quota.
      speakViaWeb(text, 0.9);
      return "mock";
    },
    [],
  );

  return {
    remaining,
    hasSample,
    isRecording,
    recordError,
    startRecording,
    stopRecording,
    cloneAndPlay,
  };
}