/**
 * IndexedDB audio cache — zero-cost replay of generated audio blobs.
 * Keys are formatted `audio_${phraseId}_${voiceType}` (voiceType: GENZ | MYVOICE).
 * Every access is graceful: any failure degrades to null / no-op.
 */

const DB_NAME = "native-slang-audio-cache";
const STORE = "audio-blobs";

export type CachedVoiceType = "GENZ" | "MYVOICE";

/** Binary cache key — see the STRICT CONTRACT `audio_${phraseId}_${voiceType}`. */
export function audioKey(phraseId: string, voiceType: CachedVoiceType): string {
  return `audio_${phraseId}_${voiceType}`;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveAudioBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    /* storage full / corrupted — harmless */
  } finally {
    db.close();
  }
}

export async function getAudioBlob(key: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return null;
  let blob: Blob | null = null;
  try {
    blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    blob = null;
  } finally {
    db.close();
  }
  return blob;
}

/** Tracks object URL per key so we can revoke instead of leaking. */
const urlRegistry = new Map<string, string>();

/** Immediate-playback object URL for a cached blob (or null when absent). */
export async function getAudioObjectUrl(key: string): Promise<string | null> {
  const blob = await getAudioBlob(key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  const previous = urlRegistry.get(key);
  if (previous) URL.revokeObjectURL(previous);
  urlRegistry.set(key, url);
  return url;
}

export function revokeAudioKey(key: string) {
  const url = urlRegistry.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    urlRegistry.delete(key);
  }
}