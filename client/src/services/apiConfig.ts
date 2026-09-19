/**
 * "إعدادات الربط والخدمات الصوتية" — localStorage-backed API configuration
 * manager. Keys stay in the browser; nothing is shipped to the server.
 *
 * Every provider defaults to 'MOCK' until a real key is stored AND mock mode
 * is switched off, so the app never makes network calls by surprise.
 */

export type LlmProvider = "GEMINI" | "OPENAI" | "MOCK";
export type TtsProvider = "CARTESIA" | "OPENAI" | "ELEVENLABS" | "MOCK";
export type VoiceCloneProvider = "CARTESIA" | "ELEVENLABS" | "MOCK";

export interface LlmConfig {
  apiKey: string;
  provider: LlmProvider;
}
export interface TtsConfig {
  apiKey: string;
  provider: TtsProvider;
}
export interface VoiceCloneConfig {
  apiKey: string;
  provider: VoiceCloneProvider;
}
export interface ApiConfig {
  llm: LlmConfig;
  tts: TtsConfig;
  voiceClone: VoiceCloneConfig;
  mockMode: boolean;
}

export const LLM_PROVIDERS: readonly LlmProvider[] = ["GEMINI", "OPENAI", "MOCK"];
export const TTS_PROVIDERS: readonly TtsProvider[] = ["CARTESIA", "OPENAI", "ELEVENLABS", "MOCK"];
export const VOICE_CLONE_PROVIDERS: readonly VoiceCloneProvider[] = ["CARTESIA", "ELEVENLABS", "MOCK"];

const KEYS = {
  llmKey: "native_slang_api_llm_key",
  llmProvider: "native_slang_api_llm_provider",
  ttsKey: "native_slang_api_tts_key",
  ttsProvider: "native_slang_api_tts_provider",
  voiceKey: "native_slang_api_voice_key",
  voiceProvider: "native_slang_api_voice_provider",
  mockMode: "native_slang_api_mock_mode",
};

function read(key: string, fallback = ""): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — in-memory config still works */
  }
}

export function getMockMode(): boolean {
  return read(KEYS.mockMode, "true") !== "false";
}

export function setMockMode(mock: boolean) {
  write(KEYS.mockMode, String(mock));
}

export function getLlmConfig(): LlmConfig {
  const apiKey = read(KEYS.llmKey);
  const wanted = read(KEYS.llmProvider, "MOCK") as LlmProvider;
  const provider = LLM_PROVIDERS.includes(wanted) ? wanted : "MOCK";
  return {
    apiKey,
    provider: provider !== "MOCK" && apiKey && !getMockMode() ? provider : "MOCK",
  };
}

export function getTtsConfig(): TtsConfig {
  const apiKey = read(KEYS.ttsKey);
  const wanted = read(KEYS.ttsProvider, "MOCK") as TtsProvider;
  const provider = TTS_PROVIDERS.includes(wanted) ? wanted : "MOCK";
  return {
    apiKey,
    provider: provider !== "MOCK" && apiKey && !getMockMode() ? provider : "MOCK",
  };
}

export function getVoiceCloneConfig(): VoiceCloneConfig {
  const apiKey = read(KEYS.voiceKey);
  const wanted = read(KEYS.voiceProvider, "MOCK") as VoiceCloneProvider;
  const provider = VOICE_CLONE_PROVIDERS.includes(wanted) ? wanted : "MOCK";
  return {
    apiKey,
    provider: provider !== "MOCK" && apiKey && !getMockMode() ? provider : "MOCK",
  };
}

export function setLlmConfig(config: LlmConfig) {
  write(KEYS.llmKey, config.apiKey);
  write(KEYS.llmProvider, config.provider);
}

export function setTtsConfig(config: TtsConfig) {
  write(KEYS.ttsKey, config.apiKey);
  write(KEYS.ttsProvider, config.provider);
}

export function setVoiceCloneConfig(config: VoiceCloneConfig) {
  write(KEYS.voiceKey, config.apiKey);
  write(KEYS.voiceProvider, config.provider);
}

export function getApiConfig(): ApiConfig {
  return {
    llm: getLlmConfig(),
    tts: getTtsConfig(),
    voiceClone: getVoiceCloneConfig(),
    mockMode: getMockMode(),
  };
}

export function setApiConfig(config: ApiConfig) {
  setLlmConfig(config.llm);
  setTtsConfig(config.tts);
  setVoiceCloneConfig(config.voiceClone);
  setMockMode(config.mockMode);
}