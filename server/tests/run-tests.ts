// Be Native backend test harness — no external framework, plain tsx + node:assert.
// Requires SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in env
// (same export block used for db:seed). Serial runner keeps DB assertions stable.

import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

import type { ScenarioPayload, TransitStartResponse } from "@be-native/shared";

import { createApp } from "../src/app.js";
import { TransitGate } from "../src/core/throttle.js";
import { getDb } from "../src/db.js";
import {
  callLLMWithFallback,
  type ActiveLlmProvider,
} from "../src/services/providerService.js";
import {
  buildScenarioPrompt,
  generateScenarioPayload,
  parseScenarioPayload,
  synthesizeScenarioPayload,
} from "../src/services/scenarioEngine.js";

// ------------------------------------------------------------ assertions

const results: Array<{ name: string; ok: boolean; error?: string }> = [];
const tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];

function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

async function runAll() {
  for (const t of tests) {
    try {
      await t.fn();
      results.push({ name: t.name, ok: true });
      console.log(`  \u2713 ${t.name}`);
    } catch (err) {
      results.push({ name: t.name, ok: false, error: err instanceof Error ? err.message : String(err) });
      console.error(`  \u2717 ${t.name}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

// ------------------------------------------------------------ fixtures

const SPOT_CAFE = "00000000-0000-4000-8000-000000000001"; // has seeded scenario
const SPOT_LOCKED = "00000000-0000-4000-8000-000000000002";
const TEST_USER = "00000000-0000-4000-8000-0000000000b1";

const PROV_FAIL: ActiveLlmProvider = {
  id: "00000000-0000-4000-8000-0000000000c1",
  name: "MOCK",
  api_key_encrypted: "MOCK-FAIL",
  is_active: true,
  priority: 10,
  cost_per_token: 0,
  created_at: new Date().toISOString(),
};
const PROV_OK: ActiveLlmProvider = {
  id: "00000000-0000-4000-8000-0000000000c2",
  name: "MOCK",
  api_key_encrypted: "",
  is_active: true,
  priority: 20,
  cost_per_token: 0,
  created_at: new Date().toISOString(),
};
const PROV_SLOW: ActiveLlmProvider = {
  id: "00000000-0000-4000-8000-0000000000c3",
  name: "MOCK",
  api_key_encrypted: "MOCK-SLOW",
  is_active: false,
  priority: 30,
  cost_per_token: 0,
  created_at: new Date().toISOString(),
};

function assertPayload(payload: ScenarioPayload) {
  assert.ok(Array.isArray(payload.dialogue) && payload.dialogue.length >= 1, "dialogue non-empty");
  assert.equal(typeof payload.cultural_bridge, "string");
  assert.ok(["TIKTOK_REELS", "COMIC_MEME", "CARD_MODE"].includes(payload.render_mode));
  assert.ok(payload.hints.length >= 1 && payload.hints.length <= 3, "hints 1..3");
}

// --------------------------------------------------------------- tests

test("TransitGate: lock → wait → unsubscribe-once", () => {
  let now = 1_000;
  const gate = new TransitGate(() => now);

  const first = gate.request("u1", SPOT_CAFE, 60_000);
  assert.equal(first.phase, "locked");
  assert.equal(first.isNew, true);
  assert.equal(first.unlockAtMs, 61_000);

  const waiting = gate.request("u1", SPOT_CAFE, 60_000);
  assert.equal(waiting.phase, "locked");
  assert.equal(waiting.isNew, false);

  now = 61_001;
  const opened = gate.request("u1", SPOT_CAFE, 60_000);
  assert.equal(opened.phase, "unlocked");

  now = 62_000;
  const afterDeliver = gate.request("u1", SPOT_CAFE, 60_000);
  assert.equal(afterDeliver.isNew, true, "delivered trip opens a new one");
});

test("callLLMWithFallback: primary fails → clears with the fallback", async () => {
  const result = await callLLMWithFallback("give me a travel line", "You are a helper.", {
    providers: [PROV_FAIL, PROV_OK],
    timeoutMs: 2_000,
  });
  assert.equal(result.provider.id, PROV_OK.id);
  assert.equal(result.attempts, 2);
  assert.ok(result.failures.some((f) => f.includes("MOCK_DELIBERATE_FAILURE")));
  const payload = parseScenarioPayload(result.content);
  assert.ok(payload, "mock output parses");
  assertPayload(payload);
});

test("callLLMWithFallback: timeout trip-wires to the next provider", async () => {
  const result = await callLLMWithFallback("give me a slow provider line", "You are a helper.", {
    providers: [PROV_SLOW, PROV_OK],
    timeoutMs: 300,
  });
  assert.equal(result.provider.id, PROV_OK.id);
  assert.equal(result.attempts, 2);
  assert.ok(result.failures.some((f) => f.includes("PROVIDER_TIMEOUT")));
});

test("callLLMWithFallback: all providers dead → rejects with the audit trail", async () => {
  await assert.rejects(
    () =>
      callLLMWithFallback("nowhere to go", "nope", {
        providers: [PROV_FAIL],
        timeoutMs: 2_000,
      }),
    /All providers failed/
  );
});

test("llm tooling: parseScenarioPayload & synthesizeScenarioPayload guard the contract", () => {
  const good = parseScenarioPayload(
    '{"dialogue":[{"speaker":"Local","line":"Salam!"}],' +
      '"cultural_bridge":"x -> y","render_mode":"CARD_MODE",' +
      '"hints":[{"id":"h1","title":"T","text":"D"}]}'
  );
  assert.ok(good);
  assertPayload(good!);
  assert.equal(parseScenarioPayload("{nope}"), null);
  assert.equal(parseScenarioPayload("```json\n{}```"), null, "empty object rejected");
});

test("scenario engine: DB-driven generation lands on llm (via seeded MOCK fallback)", async () => {
  const result = await generateScenarioPayload(SPOT_CAFE);
  assert.equal(result.source, "llm", "primary MOCK-FAIL fell back to MOCK ok");
  assertPayload(result.payload);
  assert.ok(buildScenarioPrompt.length > 0);
});

test("scenario synthesis: deterministic shape when providers are gone", () => {
  const base = synthesizeScenarioPayload(
    {
      id: SPOT_CAFE,
      title_ar: "مقهى المنصور",
      title_en: "Al-Mansour Cafe",
      category: "cafe",
      vibe_description: "cozy",
      position_x: 0,
      position_y: 0,
      is_locked: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "x",
      spot_id: SPOT_CAFE,
      title: "t",
      system_prompt: "p",
      graph_rules: {
        nodes: [
          { id: "n1", npcId: "amir", order: 1, label_ar: "أ" },
          { id: "n2", npcId: "amir", order: 2, label_ar: "ب" },
        ],
      },
      provider_config: {},
      created_at: new Date().toISOString(),
    }
  );
  assertPayload(base);
});

// ── HTTP route tests (real Supabase for the DB-backed paths) ──────────

test("POST /api/transit/start: slow → 202 → 429 → 200 (gate timing)", async () => {
  const app = createApp({ transitGate: new TransitGate(() => gateNow) });
  const server: Server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const base = `http://127.0.0.1:${port}`;
  let gateNow = 10_000;

  try {
    const post = (body: object) =>
      fetch(`${base}/api/transit/start`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

    const first = await post({
      user_id: TEST_USER,
      from_spot_id: SPOT_LOCKED,
      to_spot_id: SPOT_CAFE,
      mode: "slow",
    });
    assert.equal(first.status, 202);
    const firstBody = (await first.json()) as TransitStartResponse;
    assert.equal(firstBody.status, "locked");
    assert.equal(firstBody.retry_after_seconds, 60);

    const waiting = await post({
      user_id: TEST_USER,
      from_spot_id: SPOT_LOCKED,
      to_spot_id: SPOT_CAFE,
      mode: "slow",
    });
    assert.equal(waiting.status, 429);

    gateNow = 10_000 + 60_001;
    const delivered = await post({
      user_id: TEST_USER,
      from_spot_id: SPOT_LOCKED,
      to_spot_id: SPOT_CAFE,
      mode: "slow",
    });
    assert.equal(delivered.status, 200);
    const deliveredBody = (await delivered.json()) as TransitStartResponse;
    assert.equal(deliveredBody.status, "unlocked");
    assert.equal(deliveredBody.generation, "llm");
    assertPayload((deliveredBody as Extract<TransitStartResponse, { status: "unlocked" }>).payload);

    gateNow = 10_000 + 120_001;
    const reopened = await post({
      user_id: TEST_USER,
      from_spot_id: SPOT_LOCKED,
      to_spot_id: SPOT_CAFE,
      mode: "slow",
    });
    const reopenedBody = (await reopened.json()) as TransitStartResponse;
    assert.equal(reopenedBody.status, "locked");
  } finally {
    server.close();
  }
});

test("POST /api/transit/start: fast deducts 10 credits atomically", async () => {
  const db = getDb();
  await db
    .from("users")
    .upsert(
      {
        id: TEST_USER,
        phone: "+964000000001",
        auth_id: null,
        credits_balance: 50,
        current_tier: "free",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  const server = createApp().listen(0);
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/transit/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: TEST_USER,
        from_spot_id: SPOT_CAFE,
        to_spot_id: SPOT_CAFE,
        mode: "fast",
      }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as TransitStartResponse;
    assert.equal(body.status, "unlocked");
    assert.equal(body.cost, 10);
    assert.equal(body.balance, 40);
  } finally {
    server.close();
  }
});

test("POST /api/transit/start: fast with a broke wallet → 402", async () => {
  const db = getDb();
  await db.from("users").upsert(
    { id: TEST_USER, phone: "+964000000001", auth_id: null, credits_balance: 0, current_tier: "free" },
    { onConflict: "id" }
  );

  const server = createApp().listen(0);
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/transit/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: TEST_USER,
        from_spot_id: SPOT_CAFE,
        to_spot_id: SPOT_CAFE,
        mode: "fast",
      }),
    });
    assert.equal(res.status, 402);
  } finally {
    server.close();
  }
});

test("POST /api/vouchers/redeem: BN-LAUNCH-2026 credits +50 once, then 409", async () => {
  const db = getDb();
  await db.from("users").upsert(
    { id: TEST_USER, phone: "+964000000001", auth_id: null, credits_balance: 10, current_tier: "free" },
    { onConflict: "id" }
  );
  await db
    .from("vouchers")
    .update({ is_redeemed: false, redeemed_by_user_id: null, redeemed_at: null })
    .eq("code", "BN-LAUNCH-2026");

  const server = createApp().listen(0);
  const port = (server.address() as AddressInfo).port;
  const base = `http://127.0.0.1:${port}`;
  try {
    const redeem = () =>
      fetch(`${base}/api/vouchers/redeem`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: TEST_USER, code: "BN-LAUNCH-2026" }),
      });

    const okRes = await redeem();
    assert.equal(okRes.status, 200);
    const okBody = (await okRes.json()) as { balance: number };
    assert.equal(okBody.balance, 60);

    const dupRes = await redeem();
    assert.equal(dupRes.status, 409);
  } finally {
    server.close();
  }
});

// ---------------------------------------------------------------- main

// With no Supabase credentials the suite runs against the bundled LOCAL
// dev database (server/.local-db.json), which boots the same API surface.
if (!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY))) {
  console.log("ℹ  No Supabase credentials found — running tests against the LOCAL dev database.");
}

runAll()
  .then(() => {
    const failed = results.filter((r) => !r.ok);
    console.log("\n══════════════════════════════════════════");
    console.log(`  passed: ${results.length - failed.length}/${results.length}`);
    if (failed.length) {
      console.log("  failed:");
      for (const f of failed) console.log(`    ✗ ${f.name} — ${f.error}`);
    }
    console.log("══════════════════════════════════════════");
    process.exit(failed.length ? 1 : 0);
  })
  .catch((err) => {
    console.error("Test run crashed:", err);
    process.exit(1);
  });