import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getProjectsByUserId: vi.fn(),
  getProjectById: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getApiKeysByProjectId: vi.fn(),
  createApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
  getUsageStats: vi.fn(),
  getUsageByHour: vi.fn(),
  getOrCreateBilling: vi.fn(),
  getBillingHistory: vi.fn(),
  logUsage: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("project router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("project.list", () => {
    it("returns projects for authenticated user", async () => {
      const mockProjects = [
        { id: 1, name: "Project 1", userId: 1, environment: "development", status: "active" },
        { id: 2, name: "Project 2", userId: 1, environment: "production", status: "active" },
      ];
      vi.mocked(db.getProjectsByUserId).mockResolvedValue(mockProjects as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.project.list();

      expect(result).toEqual(mockProjects);
      expect(db.getProjectsByUserId).toHaveBeenCalledWith(1);
    });

    it("throws error for unauthenticated user", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.project.list()).rejects.toThrow();
    });
  });

  describe("project.get", () => {
    it("returns project by id for owner", async () => {
      const mockProject = {
        id: 1,
        name: "Test Project",
        userId: 1,
        environment: "development",
        status: "active",
      };
      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.project.get({ id: 1 });

      expect(result).toEqual(mockProject);
      expect(db.getProjectById).toHaveBeenCalledWith(1, 1);
    });

    it("throws NOT_FOUND for non-existent project", async () => {
      vi.mocked(db.getProjectById).mockResolvedValue(null);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.project.get({ id: 999 })).rejects.toThrow("Project not found");
    });
  });

  describe("project.create", () => {
    it("creates a new project", async () => {
      const mockProject = {
        id: 1,
        name: "New Project",
        description: "Test description",
        userId: 1,
        environment: "development",
        status: "active",
      };
      vi.mocked(db.createProject).mockResolvedValue(mockProject as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.project.create({
        name: "New Project",
        description: "Test description",
        environment: "development",
      });

      expect(result).toEqual(mockProject);
      expect(db.createProject).toHaveBeenCalledWith({
        userId: 1,
        name: "New Project",
        description: "Test description",
        environment: "development",
        status: "active",
      });
    });

    it("validates project name is not empty", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.project.create({ name: "", environment: "development" })
      ).rejects.toThrow();
    });
  });
});

describe("apiKey router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("apiKey.list", () => {
    it("returns API keys for a project", async () => {
      const mockProject = { id: 1, userId: 1 };
      const mockKeys = [
        { id: 1, name: "Key 1", keyPrefix: "tti_abc" },
        { id: 2, name: "Key 2", keyPrefix: "tti_def" },
      ];
      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.getApiKeysByProjectId).mockResolvedValue(mockKeys as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.apiKey.list({ projectId: 1 });

      expect(result).toEqual(mockKeys);
    });

    it("throws NOT_FOUND for unauthorized project access", async () => {
      vi.mocked(db.getProjectById).mockResolvedValue(null);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.apiKey.list({ projectId: 999 })).rejects.toThrow("Project not found");
    });
  });

  describe("apiKey.create", () => {
    it("creates a new API key", async () => {
      const mockProject = { id: 1, userId: 1 };
      const mockKey = {
        id: 1,
        name: "Production Key",
        keyPrefix: "tti_xyz",
        plainKey: "tti_xyz_full_key_here",
      };
      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.createApiKey).mockResolvedValue(mockKey as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.apiKey.create({ projectId: 1, name: "Production Key" });

      expect(result).toEqual(mockKey);
      expect(db.createApiKey).toHaveBeenCalledWith(1, "Production Key");
    });
  });

  describe("apiKey.revoke", () => {
    it("revokes an API key", async () => {
      const mockProject = { id: 1, userId: 1 };
      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.revokeApiKey).mockResolvedValue(true);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.apiKey.revoke({ keyId: 1, projectId: 1 });

      expect(result).toEqual({ success: true });
      expect(db.revokeApiKey).toHaveBeenCalledWith(1, 1);
    });

    it("throws NOT_FOUND for non-existent key", async () => {
      const mockProject = { id: 1, userId: 1 };
      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.revokeApiKey).mockResolvedValue(false);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.apiKey.revoke({ keyId: 999, projectId: 1 })).rejects.toThrow(
        "API key not found"
      );
    });
  });
});

describe("playground router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("playground.analyze", () => {
    it("analyzes Thai text and returns structured result", async () => {
      const mockProject = { id: 1, userId: 1 };
      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.logUsage).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.playground.analyze({
        projectId: 1,
        text: "สวัสดีครับ",
      });

      expect(result.steps).toBeDefined();
      expect(result.steps.input.text).toBe("สวัสดีครับ");
      expect(result.steps.aiTranslation.detected_language).toBe("th");
      expect(result.steps.result.typography_score).toBeGreaterThanOrEqual(0);
      expect(result.steps.result.typography_score).toBeLessThanOrEqual(100);
      expect(result.metadata.apiVersion).toBe("1.0.0");
    });

    it("logs usage after analysis", async () => {
      const mockProject = { id: 1, userId: 1 };
      vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);
      vi.mocked(db.logUsage).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await caller.playground.analyze({ projectId: 1, text: "ทดสอบ" });

      expect(db.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 1,
          endpoint: "/api/tti/analyze",
          method: "POST",
          statusCode: 200,
        })
      );
    });
  });
});
