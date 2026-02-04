import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as billingCalculator from "./billingCalculator";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Project Management
  project: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProjectsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.id, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return project;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        environment: z.enum(["development", "staging", "production"]).default("development"),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          environment: input.environment,
          status: "active",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        environment: z.enum(["development", "staging", "production"]).optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const project = await db.updateProject(id, ctx.user.id, data);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return project;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteProject(input.id, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return { success: true };
      }),
  }),

  // API Key Management
  apiKey: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return db.getApiKeysByProjectId(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return db.createApiKey(input.projectId, input.name);
      }),

    revoke: protectedProcedure
      .input(z.object({
        keyId: z.number(),
        projectId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        const success = await db.revokeApiKey(input.keyId, input.projectId);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });
        }
        return { success: true };
      }),
  }),

  // Usage Statistics
  usage: router({
    stats: protectedProcedure
      .input(z.object({ projectId: z.number(), hours: z.number().default(24) }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return db.getUsageStats(input.projectId, input.hours);
      }),

    byHour: protectedProcedure
      .input(z.object({ projectId: z.number(), hours: z.number().default(24) }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return db.getUsageByHour(input.projectId, input.hours);
      }),
  }),

  // Billing
  billing: router({
    current: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return db.getOrCreateBilling(input.projectId);
      }),

    history: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().default(6) }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return db.getBillingHistory(input.projectId, input.limit);
      }),

    getUsageSummary: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        const summary = await billingCalculator.getProjectUsageSummary(input.projectId);
        if (!summary) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Billing summary unavailable" });
        }
        return {
          creditsUsed: summary.creditsUsed,
          periodStart: summary.periodStart.toISOString(),
          periodEnd: summary.periodEnd.toISOString(),
          quota: summary.quota,
          planName: summary.planName,
        };
      }),

    getQuotaStatus: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        const status = await billingCalculator.getQuotaStatus(input.projectId);
        if (!status) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Quota status unavailable" });
        }
        return {
          status: status.status,
          creditsUsed: status.creditsUsed,
          quota: status.quota,
          periodStart: status.periodStart.toISOString(),
          periodEnd: status.periodEnd.toISOString(),
          planName: status.planName,
        };
      }),

    getBillingPreview: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        const preview = await billingCalculator.getBillingPreview(input.projectId);
        if (!preview) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Billing preview unavailable" });
        }
        return {
          creditsUsed: preview.creditsUsed,
          creditsRemaining: preview.creditsRemaining,
          quota: preview.quota,
          status: preview.status,
          periodStart: preview.periodStart.toISOString(),
          periodEnd: preview.periodEnd.toISOString(),
          planName: preview.planName,
        };
      }),
  }),

  // TTI Playground (real API)
  playground: router({
    analyze: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        apiKeyId: z.number().optional(),
        text: z.string().min(1).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }

        const TTI_API_URL = process.env.TTI_API_URL?.trim();
        const TTI_API_KEY = process.env.TTI_API_KEY?.trim();

        if (!TTI_API_URL) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "TTI API is not configured. Set TTI_API_URL environment variable.",
          });
        }

        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const res = await fetch(TTI_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(TTI_API_KEY ? { Authorization: `Bearer ${TTI_API_KEY}` } : {}),
            },
            body: JSON.stringify({ text: input.text }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;

          if (res.status === 429) {
            const errMsg = "Rate limit exceeded. Please try again later.";
            await db.logUsage({
              projectId: input.projectId,
              apiKeyId: input.apiKeyId ?? null,
              endpoint: "/api/tti/analyze",
              method: "POST",
              statusCode: 429,
              responseTimeMs: responseTime,
              inputTokens: input.text.length,
              outputTokens: 0,
              cost: 0,
              errorMessage: errMsg,
            });
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: errMsg,
            });
          }

          if (res.status === 400) {
            let message = "Invalid request.";
            try {
              const body = await res.json();
              if (body?.message) message = body.message;
              else if (body?.error) message = String(body.error);
            } catch {
              const text = await res.text();
              if (text) message = text.slice(0, 500);
            }
            await db.logUsage({
              projectId: input.projectId,
              apiKeyId: input.apiKeyId ?? null,
              endpoint: "/api/tti/analyze",
              method: "POST",
              statusCode: 400,
              responseTimeMs: responseTime,
              inputTokens: input.text.length,
              outputTokens: 0,
              cost: 0,
              errorMessage: message,
            });
            throw new TRPCError({ code: "BAD_REQUEST", message });
          }

          if (!res.ok) {
            let message = `TTI API error: ${res.status}`;
            try {
              const body = await res.json();
              if (body?.message) message = body.message;
              else if (body?.error) message = String(body.error);
            } catch {
              const text = await res.text();
              if (text) message = text.slice(0, 500);
            }
            await db.logUsage({
              projectId: input.projectId,
              apiKeyId: input.apiKeyId ?? null,
              endpoint: "/api/tti/analyze",
              method: "POST",
              statusCode: res.status,
              responseTimeMs: responseTime,
              inputTokens: input.text.length,
              outputTokens: 0,
              cost: 0,
              errorMessage: message,
            });
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
          }

          const raw = (await res.json()) as unknown;
          const normalized = normalizeTtiResponse(input.text, raw, responseTime);

          await db.logUsage({
            projectId: input.projectId,
            apiKeyId: input.apiKeyId ?? null,
            endpoint: "/api/tti/analyze",
            method: "POST",
            statusCode: 200,
            responseTimeMs: responseTime,
            inputTokens: input.text.length,
            outputTokens: JSON.stringify(normalized).length,
            cost: Math.ceil(input.text.length * 0.001),
            errorMessage: null,
          });

          return normalized;
        } catch (err) {
          clearTimeout(timeoutId);
          if (err instanceof TRPCError) throw err;
          const responseTime = Date.now() - startTime;
          const isTimeout = err instanceof Error && (err.name === "AbortError" || err.message?.includes("abort"));
          const message = isTimeout
            ? "Request timed out. Please try again."
            : err instanceof Error ? err.message : "Network error.";
          await db.logUsage({
            projectId: input.projectId,
            apiKeyId: input.apiKeyId ?? null,
            endpoint: "/api/tti/analyze",
            method: "POST",
            statusCode: isTimeout ? 408 : 500,
            responseTimeMs: responseTime,
            inputTokens: input.text.length,
            outputTokens: 0,
            cost: 0,
            errorMessage: message,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message,
          });
        }
      }),
  }),
});

/** Normalize TTI API response to Playground UI shape (steps + metadata). */
function normalizeTtiResponse(
  inputText: string,
  raw: unknown,
  responseTimeMs: number
): {
  steps: {
    input: { text: string; timestamp: string };
    aiTranslation: {
      detected_language: string;
      intent: string;
      confidence: number;
      entities: { type: string; value: string; position: number }[];
      timestamp: string;
    };
    ruleEngine: {
      rules_applied: { rule: string; status: string }[];
      warnings: string[];
      suggestions: string[];
      timestamp: string;
    };
    result: {
      original_text: string;
      processed_text: string;
      typography_score: number;
      character_count: number;
      word_count: number;
      timestamp: string;
    };
  };
  metadata: { responseTimeMs: number; apiVersion: string };
} {
  const ts = new Date().toISOString();
  const r = raw as Record<string, unknown> | null;
  const steps = r?.steps as Record<string, unknown> | undefined;
  const meta = (r?.metadata as Record<string, unknown>) ?? {};

  if (steps && typeof steps.input === "object" && typeof steps.aiTranslation === "object" && typeof steps.ruleEngine === "object" && typeof steps.result === "object") {
    return {
      steps: {
        input: { ...(steps.input as Record<string, unknown>), text: inputText, timestamp: ts } as { text: string; timestamp: string },
        aiTranslation: { ...(steps.aiTranslation as Record<string, unknown>), timestamp: ts } as { detected_language: string; intent: string; confidence: number; entities: { type: string; value: string; position: number }[]; timestamp: string },
        ruleEngine: { ...(steps.ruleEngine as Record<string, unknown>), timestamp: ts } as { rules_applied: { rule: string; status: string }[]; warnings: string[]; suggestions: string[]; timestamp: string },
        result: { ...(steps.result as Record<string, unknown>), timestamp: ts } as { original_text: string; processed_text: string; typography_score: number; character_count: number; word_count: number; timestamp: string },
      },
      metadata: {
        responseTimeMs: (meta.responseTimeMs as number) ?? responseTimeMs,
        apiVersion: (meta.apiVersion as string) ?? "1.0.0",
      },
    };
  }

  const data = (r?.data as Record<string, unknown>) ?? r;
  const processed = (data?.processed_text as string) ?? (data?.processedText as string) ?? inputText.trim().replace(/\s+/g, " ");
  const score = typeof data?.typography_score === "number" ? data.typography_score : typeof data?.typographyScore === "number" ? data.typographyScore : 100;
  const words = inputText.split(/\s+/).filter(Boolean).length;

  return {
    steps: {
      input: { text: inputText, timestamp: ts },
      aiTranslation: {
        detected_language: (data?.detected_language as string) ?? (data?.detectedLanguage as string) ?? "th",
        intent: (data?.intent as string) ?? "typography_analysis",
        confidence: typeof data?.confidence === "number" ? data.confidence : 0.95,
        entities: Array.isArray(data?.entities) ? (data.entities as { type: string; value: string; position: number }[]) : [],
        timestamp: ts,
      },
      ruleEngine: {
        rules_applied: Array.isArray(data?.rules_applied) ? (data.rules_applied as { rule: string; status: string }[]) : [],
        warnings: Array.isArray(data?.warnings) ? (data.warnings as string[]) : [],
        suggestions: Array.isArray(data?.suggestions) ? (data.suggestions as string[]) : [],
        timestamp: ts,
      },
      result: {
        original_text: inputText,
        processed_text: processed,
        typography_score: score,
        character_count: inputText.length,
        word_count: words,
        timestamp: ts,
      },
    },
    metadata: {
      responseTimeMs,
      apiVersion: (meta.apiVersion as string) ?? "1.0.0",
    },
  };
}

export type AppRouter = typeof appRouter;
