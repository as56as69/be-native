import { useCallback } from "react";

import { getTtsConfig, type TtsProvider } from "../services/apiConfig";
import { audioKey, getAudioBlob, saveAudioBlob } from "../utils/audioCache";

/**
 * "أصوات الحس" — tactile paper SFX (Web Audio synthesis) + Gen Z slang audio.
 *
 * Audio is STRICTLY for English/Gen Z slang delivery and UI paper SFX.
 * NO Arabic TTS anywhere. Cache-first (IndexedDB) → real provider → seamless
 * Web Speech fallback. Never throws.
 */

let ctx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

/* ── shared playback ──────────────────────────────────────────────────── */

let activePlayback: { audio: HTMLAudioElement; url: string } | null = null;

/** Plays a Blob via a temporary object URL; revokes on end/error. */
export function playBlob(blob: Blob) {
  try {
    if (!blob.size) return;
    const url = URL.createObjectURL(blob);
    if (activePlayback) {
      activePlayback.audio.pause();
      URL.revokeObjectURL(activePlayback.url);
    }
    const audio = new Audio(url);
    activePlayback = { audio, url };
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (activePlayback?.url === url) activePlayback = null;
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (activePlayback?.url === url) activePlayback = null;
    };
    void audio.play().catch(() => {
      /* autoplay policy / unsupported codec — silent */
    });
  } catch {
    /* unplayable — silent */
  }
}

/** Web Speech synthesis — en-US English only, no Arabic. */
export function speakViaWeb(text: string, pitch = 1) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.1;
    utterance.pitch = pitch;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* no speech engine — silent */
  }
}

/* ── tactile paper SFX (Web Audio synthesis) ──────────────────────────── */

function noiseBuffer(c: AudioContext, duration: number): AudioBuffer {
  const buffer = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * duration)), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function playPaperUnfold() {
  const c = audioCtx();
  if (!c) return;
  try {
    const now = c.currentTime;
    const duration = 0.3;
    const source = c.createBufferSource();
    source.buffer = noiseBuffer(c, duration);
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + duration);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(c.destination);
    source.start(now);
    source.stop(now + duration + 0.02);
  } catch {
    /* silent */
  }
}

export function playTapeEffect() {
  const c = audioCtx();
  if (!c) return;
  try {
    const now = c.currentTime;
    // short scrape + a light thump
    const scrape = c.createBufferSource();
    scrape.buffer = noiseBuffer(c, 0.14);
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.setValueAtTime(1900, now);
    const sGain = c.createGain();
    sGain.gain.setValueAtTime(0.0001, now);
    sGain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    scrape.connect(band).connect(sGain).connect(c.destination);
    scrape.start(now);
    scrape.stop(now + 0.16);
  } catch {
    /* silent */
  }
}

export function playAuraSound() {
  const c = audioCtx();
  if (!c) return;
  try {
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((freq, i) => {
      const t = c.currentTime + i * 0.09;
      const osc = c.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  } catch {
    /* silent */
  }
}

/* ── Gen Z slang delivery ─────────────────────────────────────────────── */

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(36);
}

/** Best-effort remote TTS per provider; returns a Blob or null. */
async function fetchTtsBlob(text: string, provider: TtsProvider, apiKey: string): Promise<Blob | null> {
  try {
    if (provider === "ELEVENLABS") {
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
        method: "POST",
        headers: { "x-api-key": apiKey, "Content-Type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        }),
      });
      return response.ok ? await response.blob() : null;
    }
    if (provider === "OPENAI") {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "tts-1", voice: "onyx", input: text, response_format: "mp3" }),
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

export type SlangPlayMode = "cache" | "mock" | "api";

/**
 * Cache-first, then provider, then seamless Web Speech fallback. Never throws.
 * `phraseId` keys the IndexedDB cache: `audio_${phraseId}_GENZ`.
 */
async function playGenZSlang(text: string, phraseId?: string): Promise<SlangPlayMode> {
  const key = audioKey(phraseId || `text_${hashText(text)}`, "GENZ");
  const cached = await getAudioBlob(key);
  if (cached) {
    playBlob(cached);
    return "cache";
  }
  const { apiKey, provider } = getTtsConfig();
  if (provider !== "MOCK") {
    const blob = await fetchTtsBlob(text, provider, apiKey);
    if (blob) {
      await saveAudioBlob(key, blob);
      playBlob(blob);
      return "api";
    }
  }
  speakViaWeb(text);
  return "mock";
}

export interface UseVibeAudioResult {
  playPaperUnfold: () => void;
  playTapeEffect: () => void;
  playAuraSound: () => void;
  playGenZSlang: (text: string, phraseId?: string) => Promise<SlangPlayMode>;
}

/** Tactile SFX + Gen Z slang audio player (English-only). */
export function useVibeAudio(): UseVibeAudioResult {
  const playPaperUnfoldFn = useCallback(() => playPaperUnfold(), []);
  const playTapeEffectFn = useCallback(() => playTapeEffect(), []);
  const playAuraSoundFn = useCallback(() => playAuraSound(), []);
  const playGenZSlangFn = useCallback((text: string, phraseId?: string) => playGenZSlang(text, phraseId), []);
  return {
    playPaperUnfold: playPaperUnfoldFn,
    playTapeEffect: playTapeEffectFn,
    playAuraSound: playAuraSoundFn,
    playGenZSlang: playGenZSlangFn,
  };
}