import { API_ROUTES } from "@be-native/shared";
import type {
  AdminUsersResponse,
  ApiProvider,
  ContentHit,
  ContentUpdateInput,
  ContentUpdateResult,
  DbStatusResponse,
  OpeningQuote,
  SandboxResponse,
  Scenario,
  ScenarioEvaluateInput,
  ScenarioEvaluateResult,
  ScenarioGraph,
  ScenarioGraphDraft,
  ScenarioGraphIssue,
  Spot,
  SpotWithScenario,
  TransitStartInput,
  TransitStartResponse,
  Voucher,
  VoucherBatchItem,
} from "@be-native/shared";

export interface UserProfile {
  id: string;
  credits_balance: number;
  current_tier: "free" | "standard" | "professional";
}

export interface VoucherRedeemResult {
  code: string;
  balance: number;
}

export interface AdminSettings {
  slow_gate_ms: number;
  transit_gate_ms?: number;
  fast_transit_cost?: number;
  transit_cost?: number;
  bypass_first_request?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const body = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `HTTP ${res.status}`, body?.error);
  }
  if (body === null) throw new ApiError(res.status, "Empty response", "EMPTY_BODY");
  return body;
}

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? "dev-admin-token";

function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(`${API_ROUTES.admin}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-admin-token": ADMIN_TOKEN,
      ...(init?.headers ?? {}),
    },
  });
}

export const api = {
  dbStatus: () => request<DbStatusResponse>(API_ROUTES.dbStatus),

  spots: () => request<Spot[]>(API_ROUTES.spots),

  user: (id: string) => request<UserProfile>(`${API_ROUTES.user}/${id}`),

  quotes: () => request<OpeningQuote[]>(API_ROUTES.quotes),

  scenario: (spotId: string) =>
    request<ScenarioGraph>(`${API_ROUTES.scenarios}/spot/${spotId}`),

  scenarioById: (id: string) =>
    request<ScenarioGraph>(`${API_ROUTES.scenarios}/${id}`),

  evaluateScenario: (input: ScenarioEvaluateInput) =>
    request<ScenarioEvaluateResult>(`${API_ROUTES.scenarios}/evaluate`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  consumeEnergy: (user_id: string, amount: number) =>
    request<{ user_id: string; amount: number; balance: number }>(
      `${API_ROUTES.scenarios}/energy/consume`,
      { method: "POST", body: JSON.stringify({ user_id, amount }) }
    ),

  transitStart: (input: TransitStartInput) =>
    request<TransitStartResponse>(API_ROUTES.transit, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  redeemVoucher: (user_id: string, code: string) =>
    request<VoucherRedeemResult>(API_ROUTES.vouchers, {
      method: "POST",
      body: JSON.stringify({ user_id, code }),
    }),

  // ── admin ────────────────────────────────────────────────────────

  adminSettings: {
    get: () => adminRequest<AdminSettings>("/settings"),
    put: (patch: Partial<AdminSettings>) =>
      adminRequest<AdminSettings>("/settings", { method: "PUT", body: JSON.stringify(patch) }),
  },

  adminProviders: {
    list: () => adminRequest<ApiProvider[]>("/providers"),
    create: (input: Partial<ApiProvider>) =>
      adminRequest<ApiProvider>("/providers", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, patch: Partial<ApiProvider>) =>
      adminRequest<ApiProvider>(`/providers/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
    remove: (id: string) =>
      adminRequest<{ ok: boolean }>(`/providers/${id}`, { method: "DELETE" }),
  },

  adminSpots: {
    list: () => adminRequest<SpotWithScenario[]>("/spots"),
    create: (input: Partial<Spot>) =>
      adminRequest<SpotWithScenario>("/spots", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, patch: Partial<Spot>) =>
      adminRequest<SpotWithScenario>(`/spots/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  },

  adminGraphs: {
    get: (spotId: string) => adminRequest<ScenarioGraph | null>(`/graph/spot/${spotId}`),
    save: (
      spotId: string,
      input: ScenarioGraphDraft
    ): Promise<{ data: ScenarioGraph; issues: ScenarioGraphIssue[] }> =>
      adminRequest(`/graph/spot/${spotId}`, { method: "PUT", body: JSON.stringify(input) }),
  },

  adminScenarios: {
    save: (spotId: string, input: Partial<Scenario>) =>
      adminRequest<Scenario>(`/scenarios/spot/${spotId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    sandbox: (input: { spot: Spot; scenario?: Partial<Scenario> }) =>
      adminRequest<SandboxResponse>("/sandbox", { method: "POST", body: JSON.stringify(input) }),
  },

  adminVouchers: {
    list: () => adminRequest<Voucher[]>("/vouchers"),
    batch: (count: number, credit_amount: number, prefix?: string) =>
      adminRequest<VoucherBatchItem[]>("/vouchers/batch", {
        method: "POST",
        body: JSON.stringify({ count, credit_amount, prefix }),
      }),
  },

  adminUsers: {
    list: () => adminRequest<AdminUsersResponse>("/users"),
    adjustCredits: (id: string, amount: number) =>
      adminRequest<{ user_id: string; delta: number; balance: number }>(`/users/${id}/credits`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
  },

  adminQuotes: {
    list: () => adminRequest<OpeningQuote[]>("/quotes"),
    create: (input: { text_ar: string; text_en: string; is_active?: boolean; sort_order?: number }) =>
      adminRequest<OpeningQuote>("/quotes", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, patch: Partial<OpeningQuote>) =>
      adminRequest<OpeningQuote>(`/quotes/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
    remove: (id: string) =>
      adminRequest<{ ok: boolean }>(`/quotes/${id}`, { method: "DELETE" }),
  },

  adminContent: {
    search: (q: string) =>
      adminRequest<ContentHit[]>(`/content/search?q=${encodeURIComponent(q)}`),
    update: (input: ContentUpdateInput) =>
      adminRequest<ContentUpdateResult>("/content/update", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  },
};