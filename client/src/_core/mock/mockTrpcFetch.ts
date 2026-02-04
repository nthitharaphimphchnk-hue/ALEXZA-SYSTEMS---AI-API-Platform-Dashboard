import { translate } from "@/i18n/translate";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type MockUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
};

type MockProject = {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  environment: "development" | "staging" | "production";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
};

type MockApiKey = {
  id: number;
  projectId: number;
  name: string;
  keyHash: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

type MockBilling = {
  id: number;
  projectId: number;
  billingCycleStart: string;
  billingCycleEnd: string;
  totalRequests: number;
  quotaLimit: number;
  totalCost: number;
  status: "active" | "exceeded" | "paid";
  createdAt: string;
  updatedAt: string;
};

type MockUsageEvent = {
  projectId: number;
  timestamp: string;
  endpoint: string;
  status: number;
  responseTimeMs: number;
  credits: number;
};

type MockState = {
  user: MockUser;
  projects: MockProject[];
  apiKeys: MockApiKey[];
  billing: MockBilling[];
  usageEvents: MockUsageEvent[];
};

let state: MockState | undefined;

const USAGE_EVENTS_KEY = "alexza_mock_usage_events";

function nowIso() {
  return new Date().toISOString();
}

function loadUsageEvents(): MockUsageEvent[] {
  try {
    const raw = localStorage.getItem(USAGE_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as MockUsageEvent[];
  } catch {
    return [];
  }
}

function persistUsageEvents(events: MockUsageEvent[]) {
  try {
    localStorage.setItem(USAGE_EVENTS_KEY, JSON.stringify(events.slice(0, 200)));
  } catch {
    // ignore
  }
}

function seedUsageEvents(): MockUsageEvent[] {
  // Generate stable-looking history for mock mode so Usage never feels empty.
  const now = Date.now();
  const events: MockUsageEvent[] = [];
  for (let i = 0; i < 30; i++) {
    const ts = new Date(now - i * 42 * 60_000).toISOString(); // ~ every 42 minutes
    events.push({
      projectId: 1,
      timestamp: ts,
      endpoint: translate("usage.endpoint.decideFont"),
      status: i % 11 === 0 ? 429 : 200,
      responseTimeMs: 90 + (i * 19) % 180,
      credits: 1,
    });
  }
  return events;
}

function initState(): MockState {
  const ts = nowIso();
  const user: MockUser = {
    id: 1,
    openId: "mock-dev-user",
    name: translate("mock.user.name"),
    email: "dev@local",
    loginMethod: "mock",
    role: "user",
    createdAt: ts,
    updatedAt: ts,
    lastSignedIn: ts,
  };

  const projects: MockProject[] = [
    {
      id: 1,
      userId: 1,
      name: "TTI",
      description: translate("mock.project.description"),
      environment: "development",
      status: "active",
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const apiKeys: MockApiKey[] = [
    {
      id: 1,
      projectId: 1,
      name: translate("mock.apiKey.defaultName"),
      keyHash: "mock",
      keyPrefix: "tti_mock_000",
      isActive: true,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: ts,
      revokedAt: null,
    },
  ];

  const cycleStart = new Date();
  cycleStart.setDate(1);
  cycleStart.setHours(0, 0, 0, 0);
  const cycleEnd = new Date(cycleStart);
  cycleEnd.setMonth(cycleStart.getMonth() + 1);
  cycleEnd.setDate(0);
  cycleEnd.setHours(23, 59, 59, 999);

  const billing: MockBilling[] = [
    {
      id: 1,
      projectId: 1,
      billingCycleStart: cycleStart.toISOString(),
      billingCycleEnd: cycleEnd.toISOString(),
      totalRequests: 0,
      quotaLimit: 1000,
      totalCost: 0,
      status: "active",
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const persisted = loadUsageEvents();
  const usageEvents = persisted.length > 0 ? persisted : seedUsageEvents();
  persistUsageEvents(usageEvents);

  // Derive billing totals from usage events (1 request = 1 credit in mock mode).
  billing[0] = {
    ...billing[0]!,
    totalRequests: usageEvents.filter((e) => e.projectId === 1).length,
    totalCost: usageEvents.filter((e) => e.projectId === 1).reduce((sum, e) => sum + e.credits, 0),
  };

  return { user, projects, apiKeys, billing, usageEvents };
}

function getState(): MockState {
  state ??= initState();
  return state;
}

function toTrpcOk(id: number, data: JsonValue) {
  return {
    id,
    result: { data: { json: data } },
  };
}

function toTrpcErr(id: number, message: string, code: string = "INTERNAL_SERVER_ERROR") {
  return {
    id,
    error: {
      json: {
        message,
        code,
        data: { code },
      },
    },
  };
}

async function readBodyText(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.body == null) {
    if (input instanceof Request) {
      return await input.clone().text();
    }
    return "";
  }
  if (typeof init.body === "string") return init.body;
  // best-effort; most tRPC requests send string body
  return "";
}

function urlFromInput(input: RequestInfo | URL) {
  if (typeof input === "string") return new URL(input, window.location.origin);
  if (input instanceof URL) return input;
  // Request
  return new URL(input.url);
}

function decodePaths(pathSegment: string): string[] {
  return pathSegment
    .split(",")
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    })
    .filter(Boolean);
}

function ensureProject(projectId: number): MockProject | null {
  const st = getState();
  return st.projects.find((p) => p.id === projectId) ?? null;
}

function getEventsForWindow(projectId: number, hours: number) {
  const st = getState();
  const since = Date.now() - hours * 60 * 60 * 1000;
  return st.usageEvents
    .filter((e) => e.projectId === projectId && new Date(e.timestamp).getTime() >= since)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function mockUsageStats(projectId: number, hours: number) {
  const events = getEventsForWindow(projectId, hours);
  const totalRequests = events.length;
  const successCount = events.filter((e) => e.status >= 200 && e.status < 400).length;
  const avgResponseTime = totalRequests
    ? Math.round(events.reduce((sum, e) => sum + e.responseTimeMs, 0) / totalRequests)
    : 0;
  const totalCost = events.reduce((sum, e) => sum + e.credits, 0);
  const successRate = totalRequests ? (successCount / totalRequests) * 100 : 0;

  return { totalRequests, successRate, avgResponseTime, totalCost };
}

function mockUsageByHour(projectId: number, hours: number) {
  const events = getEventsForWindow(projectId, hours);
  const buckets = new Map<string, { hour: string; requests: number; cost: number }>();

  for (const e of events) {
    const d = new Date(e.timestamp);
    d.setMinutes(0, 0, 0);
    const hour = d.toISOString();
    const b = buckets.get(hour) ?? { hour, requests: 0, cost: 0 };
    b.requests += 1;
    b.cost += e.credits;
    buckets.set(hour, b);
  }

  // Ensure empty hours are still present so the chart feels continuous.
  const out: { hour: string; requests: number; cost: number }[] = [];
  const now = Date.now();
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now - i * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    const hour = d.toISOString();
    out.push(buckets.get(hour) ?? { hour, requests: 0, cost: 0 });
  }
  return out;
}

function mockBillingPreview(projectId: number) {
  const st = getState();
  const current = st.billing.find((b) => b.projectId === projectId) ?? st.billing[0]!;
  const quota = 1000;
  const creditsUsed = current.totalRequests;
  const creditsRemaining = Math.max(0, quota - creditsUsed);
  return {
    creditsUsed,
    creditsRemaining,
    quota,
    status: creditsUsed > quota ? "over_quota" : creditsUsed > quota * 0.8 ? "nearing_limit" : "normal",
    periodStart: current.billingCycleStart,
    periodEnd: current.billingCycleEnd,
    planName: translate("mock.plan.free"),
  };
}

function recordUsageEvent(event: MockUsageEvent) {
  const st = getState();
  st.usageEvents.unshift(event);
  persistUsageEvents(st.usageEvents);

  let billing = st.billing.find((b) => b.projectId === event.projectId);
  if (!billing) {
    const ts = nowIso();
    billing = {
      id: event.projectId,
      projectId: event.projectId,
      billingCycleStart: st.billing[0]?.billingCycleStart ?? ts,
      billingCycleEnd: st.billing[0]?.billingCycleEnd ?? ts,
      totalRequests: 0,
      quotaLimit: 1000,
      totalCost: 0,
      status: "active",
      createdAt: ts,
      updatedAt: ts,
    };
    st.billing.push(billing);
  }

  billing.totalRequests += 1;
  billing.totalCost += event.credits;
  billing.updatedAt = nowIso();
}

function mockPlaygroundAnalyze(text: string) {
  const ts = nowIso();
  return {
    steps: {
      input: { text, timestamp: ts },
      aiTranslation: {
        detected_language: "th",
        intent: "demo",
        confidence: 0.9,
        entities: [],
        timestamp: ts,
      },
      ruleEngine: {
        rules_applied: [{ rule: "mock-mode", status: "applied" }],
        warnings: [],
        suggestions: [],
        timestamp: ts,
      },
      result: {
        original_text: text,
        processed_text: text,
        typography_score: 95,
        character_count: text.length,
        word_count: text.trim() ? text.trim().split(/\s+/).length : 0,
        timestamp: ts,
      },
    },
    metadata: { responseTimeMs: 42, apiVersion: "mock" },
  };
}

async function handleProcedure(path: string, inputJson: any): Promise<JsonValue> {
  const st = getState();

  switch (path) {
    // auth
    case "auth.me":
      return st.user;
    case "auth.logout":
      return { success: true };

    // project
    case "project.list":
      return st.projects;
    case "project.get": {
      const id = Number(inputJson?.id);
      const project = ensureProject(id);
      if (!project) throw new Error(translate("errors.projectNotFound"));
      return project;
    }
    case "project.create": {
      const ts = nowIso();
      const id = Math.max(0, ...st.projects.map((p) => p.id)) + 1;
      const project: MockProject = {
        id,
        userId: st.user.id,
        name: String(inputJson?.name ?? translate("mock.project.untitled")),
        description: (inputJson?.description ?? null) as string | null,
        environment: (inputJson?.environment ?? "development") as MockProject["environment"],
        status: "active",
        createdAt: ts,
        updatedAt: ts,
      };
      st.projects.push(project);
      st.billing.push({
        id,
        projectId: id,
        billingCycleStart: st.billing[0]?.billingCycleStart ?? ts,
        billingCycleEnd: st.billing[0]?.billingCycleEnd ?? ts,
        totalRequests: 0,
        quotaLimit: 1000,
        totalCost: 0,
        status: "active",
        createdAt: ts,
        updatedAt: ts,
      });
      return project;
    }

    // api keys
    case "apiKey.list": {
      const projectId = Number(inputJson?.projectId);
      return st.apiKeys.filter((k) => k.projectId === projectId && k.isActive);
    }
    case "apiKey.create": {
      const ts = nowIso();
      const id = Math.max(0, ...st.apiKeys.map((k) => k.id)) + 1;
      const key = `tti_mock_${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      const apiKey: MockApiKey = {
        id,
        projectId: Number(inputJson?.projectId),
        name: String(inputJson?.name ?? translate("mock.apiKey.fallback")),
        keyHash: "mock",
        keyPrefix: key.substring(0, 12),
        isActive: true,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: ts,
        revokedAt: null,
      };
      st.apiKeys.unshift(apiKey);
      return { apiKey, plainKey: key };
    }
    case "apiKey.revoke": {
      const keyId = Number(inputJson?.keyId);
      const key = st.apiKeys.find((k) => k.id === keyId);
      if (key) {
        key.isActive = false;
        key.revokedAt = nowIso();
      }
      return { success: true };
    }

    // usage
    case "usage.stats": {
      const projectId = Number(inputJson?.projectId ?? 1) || 1;
      const hours = Number(inputJson?.hours ?? 24);
      return mockUsageStats(projectId, Number.isFinite(hours) ? hours : 24);
    }
    case "usage.byHour": {
      const projectId = Number(inputJson?.projectId ?? 1) || 1;
      const hours = Number(inputJson?.hours ?? 24);
      return mockUsageByHour(projectId, Number.isFinite(hours) ? hours : 24);
    }
    case "usage.recent": {
      const projectId = Number(inputJson?.projectId ?? 1) || 1;
      const limit = Number(inputJson?.limit ?? 20);
      const events = getState().usageEvents
        .filter((e) => e.projectId === projectId)
        .slice(0, Number.isFinite(limit) ? limit : 20);
      return events.map((e) => ({
        timestamp: e.timestamp,
        endpoint: e.endpoint,
        statusCode: e.status,
        responseTimeMs: e.responseTimeMs,
        credits: e.credits,
      }));
    }

    // billing
    case "billing.current": {
      const projectId = Number(inputJson?.projectId);
      return st.billing.find((b) => b.projectId === projectId) ?? st.billing[0]!;
    }
    case "billing.history": {
      const projectId = Number(inputJson?.projectId);
      const limit = Number(inputJson?.limit ?? 6);
      const rows = st.billing.filter((b) => b.projectId === projectId);
      return rows.slice(0, Number.isFinite(limit) ? limit : 6);
    }
    case "billing.getBillingPreview": {
      const projectId = Number(inputJson?.projectId);
      return mockBillingPreview(projectId);
    }

    // playground
    case "playground.analyze": {
      const ts = nowIso();
      const rawProjectId = Number(inputJson?.projectId ?? 1);
      const projectId = rawProjectId && rawProjectId > 0 ? rawProjectId : 1;
      const responseTimeMs = 80 + Math.floor(Math.random() * 220);

      recordUsageEvent({
        projectId,
        timestamp: ts,
          endpoint: translate("usage.endpoint.decideFont"),
        status: 200,
        responseTimeMs,
        credits: 1,
      });

      const text = String(inputJson?.text ?? "");
      return mockPlaygroundAnalyze(text);
    }

    default:
      // Unknown procedure: return empty-ish shape to avoid hard crashes.
      return null;
  }
}

export async function mockQuery(path: string, inputJson: unknown) {
  return handleProcedure(path, inputJson);
}

/**
 * Intercepts frontend tRPC calls and returns mocked responses.
 * Return `null` if the request is not a tRPC request.
 */
export async function tryHandleMockTrpcRequest(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response | null> {
  const url = urlFromInput(input);
  if (!url.pathname.startsWith("/api/trpc")) return null;

  const pathname = url.pathname.replace(/^\/api\/trpc\/?/, "");
  if (!pathname) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const isBatch = url.searchParams.get("batch") === "1";
  const paths = decodePaths(pathname);

  const bodyText = await readBodyText(input, init);
  let calls: any[] = [];
  try {
    const parsed = bodyText ? JSON.parse(bodyText) : [];
    calls = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    calls = [];
  }

  const results: any[] = [];
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]!;
    const call = calls[i] ?? calls[0] ?? {};
    const id = typeof call?.id === "number" ? call.id : i;
    const inputJson = call?.json ?? null;
    try {
      const data = await handleProcedure(path, inputJson);
      results.push(toTrpcOk(id, data as JsonValue));
    } catch (e) {
      results.push(toTrpcErr(id, (e as Error)?.message ?? translate("errors.mock")));
    }
  }

  const payload = isBatch || results.length !== 1 ? results : results[0];
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

