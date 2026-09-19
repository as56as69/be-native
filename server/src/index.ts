import "dotenv/config";

import { APP_NAME, DEFAULT_CLIENT_PORT, DEFAULT_SERVER_PORT } from "@be-native/shared";

import { createApp } from "./app.js";
import { loadSettings } from "./core/config.js";
import { getDb, isLocalDev } from "./db.js";

void loadSettings(getDb()); // warm the runtime config cache from the DB

const app = createApp();

app.listen(DEFAULT_SERVER_PORT, () => {
  console.log(
    `🔥 ${APP_NAME} server listening on http://localhost:${DEFAULT_SERVER_PORT}`
  );
  console.log(`   Client dev server is expected at http://localhost:${DEFAULT_CLIENT_PORT}`);
  if (isLocalDev()) {
    console.log("   DB mode: LOCAL dev database (server/.local-db.json)");
  } else {
    console.log("   DB mode: Supabase");
  }
});