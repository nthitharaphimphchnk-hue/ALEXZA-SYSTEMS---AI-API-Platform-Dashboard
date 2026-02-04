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

type MockState = {
  user: MockUser;
  projects: MockProject[];
  apiKeys: MockApiKey[];
  billing: MockBilling[];
};

let state: MockState | undefined;

function nowIso() {
  return new Date().toISOString();
}

function initState(): MockState {
  const ts = nowIso();
  const user: MockUser = {
    id: 1,
    openId: "mock-dev-user",
    name: "Dev User",
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
      description: "Local mock project",
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
      name: "Default Key",
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
      totalRequests: 123,
      quotaLimit: 1000,
      totalCost: 12345,
      status: "active",
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  return { user, projects, apiKeys, billing };
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

function mockUsageStats() {
  return {
    totalRequests: 123,
    successRate: 99.2,
    avgResponseTime: 120,
    totalCost: 12345,
  };
}

function mockUsageByHour(hours: number) {
  const out: { hour: string; requests: number; cost: number }[] = [];
  const now = Date.now();
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now - i * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    out.push({
      hour: d.toISOString(),
      requests: Math.max(0, Math.round(5 + Math.sin(i / 3) * 4)),
      cost: Math.max(0, Math.round(50 + Math.cos(i / 4) * 20)),
    });
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
    planName: "Free",
  };
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
      if (!project) throw new Error("Project not found");
      return project;
    }
    case "project.create": {
      const ts = nowIso();
      const id = Math.max(0, ...st.projects.map((p) => p.id)) + 1;
      const project: MockProject = {
        id,
        userId: st.user.id,
        name: String(inputJson?.name ?? "Untitled"),
        description: (inputJson?.description ?? null) as string | null,
        environment: (inputJson?.environment ?? "development") as MockProject["environment"],
        status: "active",
        createdAt: ts,
        updatedAt: ts,
      };
      st.projects.push(project);
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
        name: String(inputJson?.name ?? "API Key"),
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
    case "usage.stats":
      return mockUsageStats();
    case "usage.byHour": {
      const hours = Number(inputJson?.hours ?? 24);
      return mockUsageByHour(Number.isFinite(hours) ? hours : 24);
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
      const text = String(inputJson?.text ?? "");
      return mockPlaygroundAnalyze(text);
    }

    default:
      // Unknown procedure: return empty-ish shape to avoid hard crashes.
      return null;
  }
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
      results.push(toTrpcErr(id, (e as Error)?.message ?? "Mock error"));
    }
  }

  const payload = isBatch || results.length !== 1 ? results : results[0];
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

