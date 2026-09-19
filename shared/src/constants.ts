export const APP_NAME = "Be Native";
export const APP_SHORT_NAME = "BeNative";
export const APP_DESCRIPTION = "تطبيق ويب مكتوب على دفتر ورقي دافئ، يعمل دون اتصال كتطبيق أصلي.";

export const DEFAULT_CLIENT_PORT = 5173;
export const DEFAULT_SERVER_PORT = 4000;

export const API_ROUTES = {
  hello: "/api/hello",
  health: "/api/health",
  dbStatus: "/api/db/status",
  spots: "/api/spots",
  user: "/api/user",
  transit: "/api/transit/start",
  scenarios: "/api/scenarios",
  vouchers: "/api/vouchers/redeem",
  quotes: "/api/quotes",
  admin: "/api/admin",
} as const;