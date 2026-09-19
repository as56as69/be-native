import { useState } from "react";

import type { VibeMapEntry } from "@be-native/shared";

import { useVibeAudio } from "../hooks/useVibeAudio";
import { CLONE_DAILY_LIMIT, useVoiceCloning } from "../hooks/useVoiceCloning";
import { UI_GENZ_COPY } from "../data/seedData";
import { TraceNotificationToast } from "./TraceNotificationToast";

/**
 * "Vibe Engine Card" — the generated cultural-vibe snippet card.
 *
 * Warm notebook paper snippet with a scotch-tape corner, Baghdadi phrase →
 * Gen Z slang mapping, dual audio buttons (standard 🎧 + cloned 🎤),
 * recording modal, and a direct "Locked In 📌" action that pushes the
 * mapping into the global أثر scrapbook as an unlocked CollectibleItem.
 */

export interface VibeEngineCardProps {
  entry: VibeMapEntry;
  onSaveToTraces?: (entry: VibeMapEntry) => void;
}

export function VibeEngineCard({ entry, onSaveToTraces }: VibeEngineCardProps) {
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const { playTapeEffect, playAuraSound, playGenZSlang } = useVibeAudio();
  const {
    remaining,
    hasSample,
    isRecording,
    recordError,
    startRecording,
    stopRecording,
    cloneAndPlay,
  } = useVoiceCloning();
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [cloneNote, setCloneNote] = useState<string | null>(null);

  const handleSave = () => {
    if (saved) return;
    if (onSaveToTraces) onSaveToTraces(entry);
    setSaved(true);
    setShowToast(true);
    playTapeEffect();
    if (entry.auraImpact) playAuraSound();
  };

  const handleGenZPlay = () => void playGenZSlang(entry.genZSlang, entry.id);

  const handleMyVoice = () => {
    if (!hasSample) {
      setRecordingOpen(true);
      return;
    }
    void cloneAndPlay(entry.id, entry.genZSlang).then((status) => {
      const labels: Record<string, string> = {
        cache: "تم التشغيل من الكاش ✓",
        clone: "تم التشغيل بصوتك المُستنسخ ✓",
        mock: "تم التشغيل عبر المحاكي (Mock) ✓",
        NO_QUOTA: "انتهى العدد اليومي! حاولًا غدًا 🎤",
        NO_SAMPLE: "سجّل بصمتك الصوتية أولًا (بضع ثوانٍ).",
        error: "حدث خطأ في المحاكي.",
      };
      setCloneNote(labels[status] ?? null);
      if (status !== "NO_QUOTA" && status !== "NO_SAMPLE" && status !== "error") {
        window.setTimeout(() => setCloneNote(null), 2200);
      }
    });
  };

  const handleRecordingDone = () => {
    stopRecording();
    setRecordingOpen(false);
    setCloneNote("تم تسجيل البصمة ✓ — جرب التشغيل الآن.");
    window.setTimeout(() => setCloneNote(null), 2200);
  };

  return (
    <>
      <article className="relative rounded-sm border border-amber-900/20 bg-[#FFFDF7] p-5 shadow-md animate-card-in">
        {/* scotch tape, top-right corner */}
        <span
          className="absolute -top-1 right-4 h-3 w-10 rotate-2 border border-amber-300/40 bg-amber-200/60"
          aria-hidden
        />

        {/* Baghdadi phrase */}
        <h4 className="pr-4 text-xl font-bold leading-snug text-amber-950">{entry.baghdadiPhrase}</h4>

        {/* context tag pill */}
        <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
          {entry.contextTag}
        </span>

        {/* cultural vibe */}
        <p className="mt-2 text-sm italic leading-relaxed text-stone-700">{entry.culturalVibe}</p>
        {entry.literalMeaning && (
          <p className="mt-1 text-xs text-stone-500">({entry.literalMeaning})</p>
        )}

        {/* Gen Z slang — explicit LTR isolation + highlighter-marked keyword */}
        <span dir="ltr" className="mt-3 block font-mono text-lg font-bold text-amber-900">
          →{" "}
          <mark className="slash-highlight rounded-[0.18em] px-0.5 py-px">
            {entry.genZSlang}
          </mark>
        </span>

        {/* dual audio buttons */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenZPlay}
            dir="ltr"
            className="inline-flex items-center gap-1 rounded-full border border-amber-900/30 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
          >
            نطق Gen Z 🎧
          </button>
          <button
            type="button"
            onClick={handleMyVoice}
            dir="ltr"
            className="inline-flex items-center gap-1 rounded-full border border-[#5C3A21]/30 bg-[#FFFDF7] px-2.5 py-1 text-xs font-semibold text-[#5C3A21] transition-colors hover:bg-[#F5E7CE]"
          >
            بصمتي الصوتية 🎤
            <span className="rounded-full border border-[#5C3A21]/30 bg-[#FFFDF7] px-1.5 py-0.5 font-mono text-[10px] text-[#5C3A21]">
              {remaining}/{CLONE_DAILY_LIMIT}
            </span>
          </button>
        </div>
        {cloneNote && (
          <p className="font-arabic mt-1 text-[11px] text-[#5C3A21]">{cloneNote}</p>
        )}

        {/* usage example */}
        {entry.usageExample && (
          <blockquote
            dir="ltr"
            className="mt-3 rounded-sm bg-[#F5EFE6] px-3 py-2 font-mono text-xs italic leading-relaxed text-stone-600"
          >
            “{entry.usageExample}”
          </blockquote>
        )}

        {/* aura impact badge */}
        {entry.auraImpact && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-900/30 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            <span dir="ltr" className="inline-block">
              ⚡ {entry.auraImpact}
            </span>
          </span>
        )}

        {/* actions */}
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-dashed border-amber-900/20 pt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            aria-label="حفظ في أثر"
            className="font-arabic rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-4 py-1.5 text-sm font-semibold text-[#5C3A21] transition-colors hover:bg-[#EFDDBF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span dir="ltr" className="inline-block">
              {saved ? UI_GENZ_COPY.saveDone : UI_GENZ_COPY.save}
            </span>
          </button>
        </div>
      </article>

      {/* warm paper toast confirming the scrapbook save */}
      {showToast && (
        <TraceNotificationToast
          phrase={entry.baghdadiPhrase}
          onDismiss={() => setShowToast(false)}
        />
      )}

      {/* 5-second voice sample recording modal */}
      {recordingOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              stopRecording();
              setRecordingOpen(false);
            }}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="تسجيل بصمة صوتية"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-card-in"
          >
            <div className="relative w-full max-w-xs rounded-sm border-2 border-[#8B5A2B] bg-[#F5EFE6] p-5 shadow-2xl">
              <header className="mb-3 flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-bold leading-tight text-amber-950">
                  بصمتك الصوتية 🎤
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    stopRecording();
                    setRecordingOpen(false);
                  }}
                  aria-label="إغلاق"
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-[#8B5A2B]/40 bg-[#FFFDF7] text-sm text-amber-950 transition-colors hover:bg-[#F5E7CE]"
                >
                  ✕
                </button>
              </header>
              <p className="font-arabic mb-4 text-xs leading-relaxed text-amber-900/70">
                قل أي جملة قصيرة بالإنجليزية خلال 5 ثوانٍ (مثلاً: "What's up man!" أو "That's clean.")
                ليتم حفظ البصمة وتُستخدم لرواية سلانغ Gen Z القادم.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    className="font-arabic rounded-full border border-red-700/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                  >
                    ابدأ التسجيل (5 ثوانٍ)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRecordingDone}
                    className="font-arabic rounded-full border border-[#5C3A21]/50 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#5C3A21] transition-colors hover:bg-[#EFDDBF]"
                  >
                    ⏹ إيقاف وحفظ البصمة
                  </button>
                )}
                {hasSample && (
                  <span className="font-arabic rounded-full border border-green-800/40 bg-green-50 px-2 py-0.5 text-[10px] text-green-800">
                    البصمة محفوظة ✓
                  </span>
                )}
              </div>
              {isRecording && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-700">
                  <span className="inline-block size-2 animate-pulse rounded-full bg-red-500" aria-hidden />
                  يسجّل… (حد أقصى 5 ثوانٍ)
                </div>
              )}
              {recordError && (
                <p className="font-arabic mt-2 text-xs text-red-700">{recordError}</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}