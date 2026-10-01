import { generateScenarioPayload } from "../src/services/scenarioEngine.js";
async function main() {
  const started = Date.now();
  const r = await generateScenarioPayload("00000000-0000-4000-8000-000000000002");
  console.log("source:", r.source, "| took:", Date.now()-started, "ms");
  console.log("speakers:", (r.payload.dialogue||[]).map(d=>d.speaker));
  console.log("line0:", (r.payload.dialogue||[])[0]?.line?.slice(0,100));
}
main();
