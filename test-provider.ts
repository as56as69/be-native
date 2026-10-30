import { callLLMWithFallback } from "./server/src/services/providerService.js";

async function main() {
  const res = await callLLMWithFallback(
    "Say hello in 3 words.",
    "You are a terse assistant.",
    { timeoutMs: 20000, maxAttempts: 6 }
  );
  console.log("PROVIDER:", JSON.stringify(res.provider));
  console.log("CONTENT:", res.content);
  console.log("FAILURES:", JSON.stringify(res.failures));
}
main().catch((e) => { console.error("FINAL_ERR:", e.message); process.exit(1); });
