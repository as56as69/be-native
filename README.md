# Be Native — Cultural Vibe Mapper 🇮🇶⚡

تعلّم اللهجة البغدادية عبر «الحس»: قوالب حسية (Vibe Mapper) تترجم عبارات بغداد إلى سلانغ
جيل Z، مع سيناريوهات تفاعلية على خريطة بغداد، ودفتر آثار (Traces Scrapbook) يحفظ كل
عبارة تكتشفها. PWA دافئة بأسلوب الدفتر الورقي `#FFFDF7`.

A warm notebook-paper PWA that maps Baghdadi phrases → Gen Z English slang through a
3-stage vibe engine, interactive street scenarios, a collectible scrapbook, and a hybrid
audio system (tactile paper SFX + English TTS + voice cloning).

## Monorepo layout

| Path | Role |
| --- | --- |
| `client/` | Vite + React + Tailwind v4 + PWA (manifest + SW + local fonts) |
| `server/` | Express API + Supabase/PostgreSQL (scenario engine + transit gate) |
| `shared/` | Shared types & constants (`@be-native/shared`) |

## Quick start

```bash
npm install            # one-time workspace install (Node ≥ 18)
npm run typecheck      # tsc --noEmit across shared / client / server
npm run build:client   # production PWA build → client/dist
npm run dev            # client (5173) + server (4000) together
```

- App UI: http://localhost:5173
- Server: http://localhost:4000 (local dev DB: `server/.local-db.json`)
- Admin: http://localhost:5173/admin (token `dev-admin-token`, override via `ADMIN_TOKEN`)

Copy `server/.env.example → server/.env` for remote Supabase; see `supabase/migrations/`.
The app also runs fully offline against the local dev DB.

## Architecture

### Hybrid audio system (`client/src/hooks/useVibeAudio.ts` + `useVoiceCloning.ts` + `utils/audioCache.ts`)
- **Paper SFX** via Web Audio API synthesis (`playPaperUnfold`, `playTapeEffect`, `playAuraSound`) — no audio assets needed.
- **Gen Z slang playback**: IndexedDB cache (`audio_${phraseId}_GENZ`) → real TTS provider (ElevenLabs / OpenAI / Cartesia) → seamless `speechSynthesis` Web Speech fallback.
- **Voice cloning**: 5-second mic capture (`MediaRecorder`), daily quota **5/day** (`native_slang_clone_quota`), sample embedded at `audio_voice_sample_MYVOICE`, cloned lines cached at `audio_${phraseId}_MYVOICE`.
- **Provider config** (`client/src/services/apiConfig.ts`): localStorage-backed, three provider selects + mock-mode toggle, surfaced in the admin "إعدادات المزودات" panel.

### Vibe Engine (`useVibeMapper.ts` → `VibeMapperEngine.tsx`)
- 3-stage pipeline: **تفكيك → قالب وسيط → صياغة Gen Z** (DECONSTRUCT → BRIDGE → SYNTHESIS) with live stage reporting.
- Dictionary browser (`Vibe Vault ⚡`): search/index now also covers **scenario node lines, option outcomes** (`DERIVED_SCENARIO_VIBES`) and **map charger texts** (`MAP_CHARGER_TEXTS` — districts, river, board caption, spot labels, recharge) seeded in `client/src/data/seedData.ts`.
- Every card ships audio 🎧 (Gen Z) + 🎤 (cloned) controls and a one-tap save into the scrapbook.

### Admin panel (`client/src/admin/`)
Organized under `/admin`: spots + scenario sandbox, voucher batches, provider switcher,
user balances, system settings, the unified **seed export/reset toolbar**
(`seedData.json`), and the per-provider API key manager.

## Agent constraints (for future AI agents — Hermes & friends)

- **Strict language lock**: Audio/TTS is strictly **American Gen Z English** slang.
  Arabic is the teaching *subject*, never the *voice*. **No Arabic TTS, ever.**
- **Tactile UI theme**: warm paper notebook aesthetic, surfaces `#FFFDF7`, borders
  `#8B5A2B`/amber-900, hand-drawn doodle icons. No dark mode.
- **Fallback strategy**: always default provider config to `MOCK` when API keys are
  absent or mock-mode toggle is on — the app must never crash or block offline.
- All English/Gen Z strings inside the RTL shell must be isolated with
  `dir="ltr"` (see `LtrText` in `ScenarioCanvas.tsx`).
- Vibe category values and localStorage keys are fixed contracts in
  `shared/src/types/index.ts` — don't rename without updating seed hydration +
  admin + engine together.

## Environment (`${ROOT}/.env.example`)

```ini
VITE_LLM_PROVIDER=MOCK
VITE_LLM_API_KEY=
VITE_TTS_PROVIDER=MOCK
VITE_TTS_API_KEY=
VITE_VOICE_CLONE_PROVIDER=MOCK
VITE_VOICE_CLONE_API_KEY=
```

Fallback defaults keep the app fully functional in local MOCK mode; keys are read from
the admin panel at runtime and never committed.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | client + server together (dev) |
| `npm run dev:client` / `dev:server` | run one side only |
| `npm run typecheck` | type-check all three workspaces |
| `npm run build:client` | production PWA build |
| `npm run build` | typecheck + full PWA + server build |
| `npm run preview` | preview the production build (:4173) |
| `npm run start` | production server |
| `npm run db:seed` | seed the five Baghdad spots + scenarios |
| `npm test` | server tests |