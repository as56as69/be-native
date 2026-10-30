// ── API response types ────────────────────────────────────────────────

export interface HelloResponse {
  message: string;
  service: string;
  serverTime: string;
}

export interface DbStatusResponse {
  configured: boolean;
  healthy?: boolean;
  projectRef?: string;
  message: string;
}

// ── Domain enums ──────────────────────────────────────────────────────

export type UserTier = "free" | "standard" | "professional";

export const TRIAL_DAYS = 3;
export const ACTIVATION_DAYS = 60;
export const COLLECTION_HOURS = 24;
export const TRIAL_STARTER_ENERGY = 15;

export type SpotCategory =
  | "cafe"
  | "restaurant"
  | "gym"
  | "taxi_delivery"
  | "university"
  | "street_vendor"
  | "bookshop"
  | "govt_office"
  | "airport"
  | "hospital";

// ── Database rows (mirror of server/db/schema.sql) ────────────────────
// NOTE: row types are `type` aliases on purpose — postgrest-js requires
// them to be assignable to `Record<string, unknown>` (implicit index
// signature), which interfaces do not satisfy.

export type User = {
  id: string;
  /** Phone OR auth id — at least one must be present. */
  phone: string | null;
  auth_id: string | null;
  /** Display name (from simple registration). */
  name: string | null;
  credits_balance: number;
  current_tier: UserTier;
  /** Simple free-trial window (3 days). */
  trial_started_at: string | null;
  trial_ends_at: string | null;
  /** Permanent-tier expiry (60 days from activation). */
  tier_expires_at: string | null;
  /** Whether the one-shot trial pack has been bought already. */
  trial_used: boolean;
  created_at: string;
};

// ── Entitlement (trial + tier enforcement) ──────────────────────────────

/** How the system treats a user right now (computed, never stored). */
export type EntitlementStatus =
  | "trial_active" // free tier + 3-day trial still running
  | "trial_expired" // free tier + trial over → paid features locked
  | "paid" // standard/pro tier, tier_expires_at in the future
  | "tier_expired"; // paid tier expired → falls back to free/locked

export interface UserEntitlement {
  status: EntitlementStatus;
  /** Effective tier after any automatic fallback (tier_expired → free). */
  tier: UserTier;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  /** Whole days left in the trial (0 when done). */
  trial_days_left: number;
  tier_expires_at: string | null;
  /** Whole days left in the paid tier (0 when none/expired). */
  tier_days_left: number;
  /** Free users on an active trial may play fixed scenarios without spending. */
  free_fixed_content: boolean;
  /** Paid features (fast/transit taxi, energy burning) allowed. */
  paid_features: boolean;
  /** Trial is over AND no active paid tier → show the reactivation wall. */
  requires_activation: boolean;
}

// ── Registration & sessions ────────────────────────────────────────────

/** POST /api/user/register — simple name+phone registration (no OTP). */
export interface RegisterInput {
  name: string;
  phone: string;
}

export interface RegisterResponse {
  user: User;
  created: boolean;
}

/** POST /api/user/trial-pack/buy — السلاح السري: رزمة تجربة تُباع لمجاني (مرة وحدة). */
export interface TrialPackBuyInput {
  user_id: string;
}

export interface TrialPackBuyResult {
  ok: boolean;
  user: User;
  /** عدد الطاقة المضافة للرصيد. */
  added_energy: number;
  balance: number;
  trial_ends_at: string;
}

// ── Activation codes & institutes (partner layer) ──────────────────────

/** A partner institute/teacher/influencer that sells activation codes. */
export type Institute = {
  id: string;
  name: string;
  contact: string | null;
  share_per_code: number;
  is_active: boolean;
  created_at: string;
};

/** Permanently-tier activation code («أبو الكود») bound to an institute. */
export type ActivationCode = {
  id: string;
  code: string;
  tier: UserTier;
  duration_days: number;
  institute_id: string | null;
  is_redeemed: boolean;
  redeemed_by_user_id: string | null;
  redeemed_at: string | null;
  /** Whether the institute's share for this code has been received (تحصيل). */
  is_settled: boolean;
  settled_at: string | null;
  created_at: string;
};

/** GET /api/entitlement/:id — computed account status (trial/paid/expired). */
export interface EntitlementResponse {
  user_id: string;
  status: EntitlementStatus;
  tier: UserTier;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_days_left: number;
  tier_expires_at: string | null;
  tier_days_left: number;
  free_fixed_content: boolean;
  paid_features: boolean;
  requires_activation: boolean;
  /**
   * Phase 5 — true when the user's paid tier was granted by an activation
   * code whose institute hasn't settled within COLLECTION_HOURS of the
   * redemption. The account is auto-blocked (treated as free) until the
   * institute settles.
   */
  collection_blocked: boolean;
  /**
   * Phase 6 — whether the one-shot trial pack (السلاح السري) has been bought.
   * Mirrors users.trial_used so the client can hide the buy button once used.
   */
  trial_used: boolean;
}

/** POST /api/admin/activation-codes/batch request body. */
export interface ActivationBatchInput {
  count: number;
  institute_id: string;
  tier?: UserTier;
  duration_days?: number;
}

/** POST /api/activation/redeem — a student redeems their institute code. */
export interface ActivationRedeemInput {
  user_id: string;
  code: string;
}

export interface ActivationRedeemResult {
  code: string;
  tier: UserTier;
  duration_days: number;
  expires_at: string;
}

/** GET /api/admin/activation-codes response row (joined with institute). */
export type ActivationCodeWithInstitute = ActivationCode & {
  institute_name: string | null;
};

// ── Collection ledger (سجل تحصيل المعاهد — phase 5) ────────────────────

/** One redeemed activation code inside the institute ledger, with settlement state. */
export interface InstituteLedgerCode {
  id: string;
  code: string;
  redeemed_by_user_id: string | null;
  redeemed_at: string | null;
  is_settled: boolean;
  settled_at: string | null;
  /** Past the COLLECTION_HOURS window and still unsettled → student blocked. */
  overdue: boolean;
  /** Whole hours left to settle before the account auto-blocks (0 when overdue/settled). */
  hours_left: number;
}

/** Aggregated collection stats for one institute (شريك). */
export interface InstituteLedgerRow {
  institute: Institute;
  /** Total codes generated for this institute. */
  generated: number;
  /** Codes actually redeemed by students. */
  redeemed: number;
  /** Redeemed AND settled (المستحقات وصلت). */
  settled: number;
  /** Redeemed but not settled yet. */
  unsettled: number;
  /** Redeemed, unsettled, past the 24h window → student accounts blocked. */
  overdue: number;
  /** Total dues = redeemed × share_per_code (د.ع). */
  dues: number;
  /** Distinct students currently auto-blocked because of overdue codes. */
  blocked_students: number;
  /** The redeemed codes of this institute (for per-code settle). */
  codes: InstituteLedgerCode[];
}

/** GET /api/admin/collection/ledger response. */
export interface CollectionLedgerResponse {
  institutes: InstituteLedgerRow[];
  totals: {
    generated: number;
    redeemed: number;
    settled: number;
    unsettled: number;
    overdue: number;
    dues: number;
  };
}

/** POST /api/admin/collection/institutes/:id/settle response. */
export interface CollectionSettleResult {
  ok: true;
  settled: number;
}

export type Spot = {
  id: string;
  title_ar: string;
  title_en: string;
  category: SpotCategory;
  vibe_description: string | null;
  /** 2D Doodle Map coordinates. */
  position_x: number;
  position_y: number;
  is_locked: boolean;
  created_at: string;
};

/** Loose JSON value used for jsonb columns. */
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

/** Semantic shape for `scenarios.graph_rules` (multi-NPC, order errors, interrupts). */
export interface ScenarioOrderError {
  nodeId: string;
  message_ar: string;
}

export interface ScenarioInterrupt {
  fromNodeId: string;
  toNodeId: string;
  trigger_ar?: string;
  allowed?: boolean;
}

export interface ScenarioGraphRules {
  nodes: Array<{ id: string; npcId: string; order: number; label_ar?: string }>;
  orderErrors: ScenarioOrderError[];
  interrupts: ScenarioInterrupt[];
}

/** Semantic shape for `scenarios.provider_config` (primary/fallback LLM + TTS). */
export interface ProviderSwitcherConfig {
  primary: { provider: string; model?: string };
  fallback?: { provider: string; model?: string };
  tts?: { provider: string; voice?: string };
  temperature?: number;
  maxTokens?: number;
}

export type Scenario = {
  id: string;
  spot_id: string;
  title: string;
  system_prompt: string;
  graph_rules: Json;
  provider_config: Json;
  created_at: string;
};

export type Voucher = {
  id: string;
  code: string;
  credit_amount: number;
  is_redeemed: boolean;
  redeemed_by_user_id: string | null;
  redeemed_at: string | null;
  created_at: string;
};

export type ApiProvider = {
  id: string;
  name: string;
  api_key_encrypted: string | null;
  is_active: boolean;
  priority: number;
  cost_per_token: number;
  created_at: string;
};

/** Administratively-managed opening-story quote (Arabic + English). */
export type OpeningQuote = {
  id: string;
  text_ar: string;
  text_en: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

// ── Interactive scenario graphs (production engine) ───────────────────

/** A named character inside a scenario graph (locale-aware). */
export type ScenarioCharacter = {
  id: string;
  name_ar: string;
  name_en: string;
};

/** One answer option inside a scenario node. */
export type ScenarioOption = {
  id: string;
  /** PRIMARY — the learner's candidate reply, in natural American slang. */
  text_en_slang: string;
  /** Secondary helper only — the Iraqi-Arabic equivalent (small, subtle). */
  text_ar_equivalent: string;
  is_correct: boolean;
  xp_reward: number;
  /** id of the node to advance to, or null for a terminal step. */
  next_node_id: string | null;
};

/** A dialogue step with branching options. `character` = ScenarioCharacter.id. */
export type ScenarioNode = {
  id: string;
  character: string;
  /** PRIMARY — the NPC line, delivered in native American slang. */
  text_en_slang: string;
  /** Minimal context hint ("المقصود بالموقف") — never the main narrative. */
  text_ar_hint: string;
  options: ScenarioOption[];
};

/**
 * Strict JSON graph served by GET /api/scenarios.
 * Each spot owns exactly one active graph (unique spot_id).
 * NOTE: `type` alias on purpose — row types must satisfy Record<string, unknown>.
 */
export type ScenarioGraph = {
  id: string;
  spot_id: string;
  title: string;
  /** Human neighbourhood/region label, e.g. "الكرخ — شارع المنصور". */
  location: string;
  characters: ScenarioCharacter[];
  nodes: ScenarioNode[];
  /** Order-mistake feedback: node the learner hit out of sequence → message. */
  orderErrors?: ScenarioOrderError[];
  /** Allowed/blocked detours between nodes (jump rules with trigger hints). */
  interrupts?: ScenarioInterrupt[];
  is_active: boolean;
  created_at: string;
};

/** POST /api/scenarios/evaluate body — free-text learner response. */
export interface ScenarioEvaluateInput {
  scenario_id: string;
  node_id: string;
  text: string;
}

/**
 * Structured LLM/DB evaluation result — the hand-drawn feedback card data.
 * Always a strict JSON envelope; never prose.
 */
export interface ScenarioEvaluateResult {
  node_id: string;
  /** Tightest American slang for the learner's line (primary). */
  text_en_slang: string;
  /** Iraqi-Arabic equivalent helper (secondary, subtle). */
  text_ar_equivalent: string;
  is_correct: boolean;
  xp_reward: number;
  next_node_id: string | null;
  /** Whether the free text matched a pre-computed graph option. */
  matched: boolean;
  /** "llm" when the provider answered, "graph" on the DB fallback. */
  source: "llm" | "graph";
}

// ── Scenario engine / transit ─────────────────────────────────────────

export type ScenarioRenderMode = "TIKTOK_REELS" | "COMIC_MEME" | "CARD_MODE";

/** One dialogue line — Native-American voice, rendered line-by-line. */
export interface DialogueLine {
  speaker?: string;
  line: string;
}

export interface HintCard {
  id: string;
  title: string;
  text: string;
}

/** Structured output contract produced by `generateScenarioPayload`. */
export interface ScenarioPayload {
  dialogue: DialogueLine[];
  /** Matching Iraqi-slang equivalent, e.g. "Stop capping!" -> "لا تطير فيالة!". */
  cultural_bridge: string;
  render_mode: ScenarioRenderMode;
  /** 2–3 quick retrieval hint cards. */
  hints: HintCard[];
}

export type ScenarioPayloadSource = "llm" | "synthesis";

export interface ScenarioPayloadResult {
  payload: ScenarioPayload;
  source: ScenarioPayloadSource;
}

// ── Transit API ────────────────────────────────────────────────────────

export type TransitMode = "slow" | "transit" | "fast";

export interface TransitStartInput {
  user_id: string;
  from_spot_id: string;
  to_spot_id: string;
  mode: TransitMode;
}

export interface TransitLockedResponse {
  status: "locked";
  mode: TransitMode;
  cost: number;
  unlock_at: string;
  retry_after_seconds: number;
}

export interface TransitUnlockedResponse {
  status: "unlocked";
  mode: TransitMode;
  cost: number;
  balance?: number;
  payload: ScenarioPayload;
  generation: ScenarioPayloadSource;
}

export type TransitStartResponse = TransitLockedResponse | TransitUnlockedResponse;

export interface VoucherRedeemInput {
  user_id: string;
  code: string;
}

// ── Supabase Database type (drives typed queries in server/src/db.ts) ──

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
        Relationships: [];
      };
      institutes: {
        Row: Institute;
        Insert: Partial<Institute>;
        Update: Partial<Institute>;
        Relationships: [];
      };
      activation_codes: {
        Row: ActivationCode;
        Insert: Partial<ActivationCode>;
        Update: Partial<ActivationCode>;
        Relationships: [];
      };
      spots: {
        Row: Spot;
        Insert: Partial<Spot>;
        Update: Partial<Spot>;
        Relationships: [];
      };
      scenarios: {
        Row: Scenario;
        Insert: Partial<Scenario>;
        Update: Partial<Scenario>;
        Relationships: [];
      };
      scenario_graphs: {
        Row: ScenarioGraph;
        Insert: Partial<ScenarioGraph>;
        Update: Partial<ScenarioGraph>;
        Relationships: [];
      };
      vouchers: {
        Row: Voucher;
        Insert: Partial<Voucher>;
        Update: Partial<Voucher>;
        Relationships: [];
      };
      api_providers: {
        Row: ApiProvider;
        Insert: Partial<ApiProvider>;
        Update: Partial<ApiProvider>;
        Relationships: [];
      };
      settings: {
        Row: SettingsRow;
        Insert: Partial<SettingsRow>;
        Update: Partial<SettingsRow>;
        Relationships: [];
      };
      opening_quotes: {
        Row: OpeningQuote;
        Insert: Partial<OpeningQuote>;
        Update: Partial<OpeningQuote>;
        Relationships: [];
      };
      jweysim_scraps: {
        Row: JweysimScrap;
        Insert: Partial<JweysimScrap>;
        Update: Partial<JweysimScrap>;
        Relationships: [];
      };
      jweysim_phrases: {
        Row: JweysimPhrase;
        Insert: Partial<JweysimPhrase>;
        Update: Partial<JweysimPhrase>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      spend_credits: {
        Args: { p_user_id: string; p_amount: number };
        Returns: number;
      };
      redeem_voucher: {
        Args: { p_user_id: string; p_code: string };
        Returns: number;
      };
      adjust_credits: {
        Args: { p_user_id: string; p_delta: number };
        Returns: number;
      };
      redeem_activation_code: {
        Args: { p_user_id: string; p_code: string };
        Returns: { tier: UserTier; expires_at: string };
      };
    };
    Enums: {
      user_tier: UserTier;
      spot_category: SpotCategory;
    };
  };
}

// ── Admin / dashboard types ────────────────────────────────────────────

/** Key-value row in the `settings` table (e.g. slow_gate_ms). */
export type SettingsRow = {
  key: string;
  value: Json;
  updated_at: string;
};

/** Spot enriched with its first Scenario (for the admin SpotStudio list). */
export type SpotWithScenario = Spot & {
  scenario: Scenario | null;
};

/** GET /api/admin/users response shape. */
export interface AdminUsersResponse {
  open_spots_global: number;
  users: User[];
}

/** POST /api/admin/vouchers/batch response shape. */
export type VoucherBatchItem = {
  code: string;
  credit_amount: number;
  is_redeemed: boolean;
};

/** POST /api/admin/sandbox response shape. */
export interface SandboxResponse extends ScenarioPayloadResult {
  spot_id: string;
}

// ── Dynamic content editor (/admin/content) ───────────────────────────

/**
 * Entity kinds whose text fields are searchable/editable from the admin
 * content editor. `scenario_graph` covers the JSONB graph (nested node /
 * option / character text) via a dotted `fieldName` path.
 */
export type ContentEntityType =
  | "spot"
  | "scenario"
  | "opening_quote"
  | "scenario_graph";

/** One editable text occurrence returned by GET /api/admin/content/search. */
export interface ContentHit {
  /** Row id (spot / scenario / quote / graph). */
  id: string;
  entityType: ContentEntityType;
  /**
   * Column name, or a dotted path into the graph JSONB
   * (e.g. `nodes.0.text_en_slang`, `nodes.0.options.1.text_ar_equivalent`).
   */
  fieldName: string;
  currentText: string;
  /** Human label for the row, e.g. "نقطة · مقهى المنصور · title_ar". */
  label: string;
}

/** PATCH /api/admin/content/update body. */
export interface ContentUpdateInput {
  id: string;
  entityType: ContentEntityType;
  fieldName: string;
  newText: string;
}

/** PATCH /api/admin/content/update response. */
export interface ContentUpdateResult {
  success: true;
}

/* ── "Traces / أثر" collectibles (dual-sourced: scenario + admin) ────── */

/** Visual template that produced the collectible (matches scene layoutType). */
export type CollectibleCategory =
  | "RECEIPT_MENU"
  | "CHALKBOARD"
  | "MANILA_FOLDER"
  | "STREET_POSTER"
  | "GLOBAL";

/** Where a trace came from: a scenario node or the Admin panel. */
export type CollectibleSource = "SCENARIO" | "ADMIN";

/**
 * A learned street-Baghdadi trace. English slang is never used in the
 * text nodes, it always has an American slang equivalent + cultural note.
 */
export interface CollectibleItem {
  id: string;
  /** E.g. "طابكة عنده" (Baghdadi). */
  phrase: string;
  /** E.g. "He's trippin'" (American Slang). */
  targetSlang: string;
  /** Cultural usage note (عربي أو إنجليزي). */
  contextNote: string;
  /** E.g. "RECEIPT_MENU" | "CHALKBOARD" | "MANILA_FOLDER" | "STREET_POSTER". */
  category: CollectibleCategory;
  source: CollectibleSource;
  isUnlocked: boolean;
  unlockedAt?: string;
  /** ISO creation timestamp (used to sort the admin traces list). */
  createdAt?: string;
}

/** Payload for creating an admin-managed collectible (id + source are derived). */
export type AdminCollectibleInput = Omit<CollectibleItem, "id" | "source">;

/** A scenario-observed collectible candidate, before it becomes an item. */
export type ScenarioCollectibleSeed = Omit<CollectibleItem, "id" | "source" | "isUnlocked" | "unlockedAt">;

/** localStorage envelopes for the traces feature. */
export const COLLECTIBLES_UNLOCKED_KEY = "native_slang_unlocked_traces";
export const COLLECTIBLES_ADMIN_KEY = "native_slang_admin_traces";
export const COLLECTIBLES_SCENARIO_KEY = "native_slang_scenario_traces";

/* ── "Vibe Mapper" dictionary (Gen Z ↔ Baghdadi cultural vibe) ────────── */

/** Emotional/cultural register served by a vibe entry (no UI gates). */
export type VibeCategory =
  | "BANTER"
  | "RESPECT"
  | "CONFLICT"
  | "MASTERY"
  | "DRAMA"
  | "AURA";

/** The 6 vibe registers, ordered for stable admin selects. */
export const VIBE_CATEGORIES: readonly VibeCategory[] = [
  "BANTER",
  "RESPECT",
  "CONFLICT",
  "MASTERY",
  "DRAMA",
  "AURA",
];

/** Where a vibe entry came from: the AI pipeline or the Admin panel. */
export type VibeSource = "AI_GENERATED" | "ADMIN_MANUAL";

/**
 * A single cultural vibe mapping: Baghdadi phrase → vibe context → Gen Z slang.
 * Dual-sourced (AI_GENERATED via the engine, ADMIN_MANUAL via the panel).
 */
export interface VibeMapEntry {
  id: string;
  /** E.g. "انطي الخبز لخبازه". */
  baghdadiPhrase: string;
  /** E.g. "عمل وبروفيشينال" / "مدح مهارة". */
  contextTag: string;
  /** E.g. "إعطاء الخبز للخباز المختص". */
  literalMeaning: string;
  /** E.g. "تسليم المهام المعقدة لأهل الاختصاص وعدم التطفل". */
  culturalVibe: string;
  /** E.g. "Let him cook / Pure masterclass". */
  genZSlang: string;
  /** E.g. "+500 Aura". */
  auraImpact: string;
  /** E.g. "Don't tell him how to edit, bro. Let him cook." */
  usageExample: string;
  category: VibeCategory;
  source: VibeSource;
  /** ISO creation timestamp (used to sort the admin list, newest first). */
  createdAt: string;
}

/** Payload for a manual admin entry (id, source & timestamp are derived). */
export type AdminVibeInput = Omit<VibeMapEntry, "id" | "source" | "createdAt">;

/** localStorage envelope for the vibe dictionary. */
export const VIBE_DICTIONARY_KEY = "native_slang_vibe_dictionary";

// ── Alerts / Toast (modern) ──────────────────────────────────────────

export interface AlertMessage {
  id: string;
  severity: "info" | "success" | "warning" | "error";
  title: string;
  body?: string;
}

export interface AlertResponse {
  messages: AlertMessage[];
}

// ── Jweysim scraps (قصاصات جويسم) ────────────────────────────────────

export type JweysimScrapLocationType = "pin" | "free";

/** A tear-off notebook scrap pinned around the Doodle Map.
 *  - location_type "pin"  → rendered beside the spot (spot_id)
 *  - location_type "free" → rendered at the exact % coordinates (pos_x/pos_y)
 */
export type JweysimScrap = {
  id: string;
  /** Spot UUID when the scrap is pinned to a location (may be null for free). */
  spot_id: string | null;
  title: string;
  text: string;
  location_type: JweysimScrapLocationType;
  pos_x: number;
  pos_y: number;
  reward_id: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Payload for creating/updating a scrap from the admin "جويسم" tab. */
export type JweysimScrapInput = {
  id?: string;
  spot_id: string | null;
  title: string;
  text: string;
  location_type: JweysimScrapLocationType;
  pos_x: number;
  pos_y: number;
  reward_id: string | null;
  is_visible: boolean;
  sort_order: number;
};

export const JWEYSIM_SCRAPS_KEY = "native_slang_jweysim_scraps";

// ── Jweysim phrases (عبارات جويسم) ─────────────────────────────────

/** A single mascot phrase — the Arabic line + optional English sticker. */
export type JweysimPhrase = {
  id: string;
  /** Which mascot state this phrase belongs to. */
  state: "idle" | "bored" | "sleeping" | "wake" | "loading" | "error" | "victory" | "click" | "walk";
  /** Arabic phrase (primary). */
  ar: string;
  /** Optional English slang sticker shown under the Arabic. */
  en_sticker: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload for creating/updating a phrase from the admin "جويسم" tab. */
export type JweysimPhraseInput = {
  id?: string;
  state: JweysimPhrase["state"];
  ar: string;
  en_sticker: string | null;
  sort_order: number;
  is_visible: boolean;
};

export const JWEYSIM_PHRASES_KEY = "native_slang_jweysim_phrases";
