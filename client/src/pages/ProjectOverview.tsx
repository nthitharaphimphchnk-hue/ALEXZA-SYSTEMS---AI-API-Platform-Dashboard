import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Activity, Clock, Key, TrendingUp, Zap } from "lucide-react";
import { useParams } from "wouter";
import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ApiStatusIndicator } from "@/components/ApiStatusIndicator";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProjectOverview() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();

  const { data: project, isLoading: projectLoading } = trpc.project.get.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const { data: stats, isLoading: statsLoading } = trpc.usage.stats.useQuery(
    { projectId: projectId!, hours: 24 },
    { enabled: !!projectId }
  );

  const { data: apiKeys } = trpc.apiKey.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: billing } = trpc.billing.current.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  return (
    <ProjectDashboardLayout>
      <div className="space-y-8">
        {/* Header with Branding */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/alexza-logo-full.png" alt={t("brand.name")} className="h-10 w-auto" />
            <div>
              <h2 className="text-lg font-semibold">{t("brand.name")}</h2>
              <p className="text-sm text-muted-foreground">{t("brand.tagline")}</p>
            </div>
          </div>
          {projectLoading ? (
            <>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-72" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">{project?.name}</h1>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                        project?.environment === "production"
                          ? "bg-muted/50 text-foreground"
                          : project?.environment === "staging"
                          ? "bg-muted/30 text-muted-foreground"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {project?.environment ? t(`projects.${project.environment}`) : ""}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {project?.description || t("overview.fallbackDescription")}
                  </p>
                </div>
                <ApiStatusIndicator status="healthy" />
              </div>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("overview.requests24h")}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalRequests.toLocaleString() || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("overview.successRate")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {stats?.successRate.toFixed(1) || 0}%
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("overview.avgResponseTime")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.avgResponseTime || 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    {t("common.ms")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("overview.activeApiKeys")}
              </CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiKeys?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Status */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* API Status */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t("overview.apiStatusTitle")}</CardTitle>
              <CardDescription>{t("overview.apiStatusDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-foreground/10 border border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-foreground animate-pulse" />
                  <span className="font-medium">{t("overview.systemsOperational")}</span>
                </div>
                <span className="text-sm text-muted-foreground">{t("overview.uptime")}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("overview.endpoint.textAnalysis")}</span>
                  <span className="text-foreground">{t("status.operational")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("overview.endpoint.ruleEngine")}</span>
                  <span className="text-foreground">{t("status.operational")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("overview.endpoint.aiTranslation")}</span>
                  <span className="text-foreground">{t("status.operational")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t("overview.quickActions")}</CardTitle>
              <CardDescription>{t("overview.quickActionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => setLocation(`/project/${projectId}/playground`)}
              >
                <Zap className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{t("overview.action.playground")}</div>
                  <div className="text-xs text-muted-foreground">{t("overview.action.playgroundDescription")}</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => setLocation(`/project/${projectId}/keys`)}
              >
                <Key className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{t("overview.action.manageKeys")}</div>
                  <div className="text-xs text-muted-foreground">{t("overview.action.manageKeysDescription")}</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => setLocation(`/project/${projectId}/docs`)}
              >
                <Activity className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{t("overview.action.viewDocs")}</div>
                  <div className="text-xs text-muted-foreground">{t("overview.action.viewDocsDescription")}</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Billing Summary */}
        {billing && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t("overview.billingCycleTitle")}</CardTitle>
              <CardDescription>
                {format(new Date(billing.billingCycleStart), "MMM d")} -{" "}
                {format(new Date(billing.billingCycleEnd), "MMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("overview.requestsUsed")}</p>
                  <p className="text-2xl font-bold">
                    {billing.totalRequests.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {billing.quotaLimit.toLocaleString()}
                    </span>
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">{t("overview.estimatedCost")}</p>
                  <p className="text-2xl font-bold">
                    ${((billing.totalCost || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((billing.totalRequests / billing.quotaLimit) * 100, 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProjectDashboardLayout>
  );
}
