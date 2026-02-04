import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { AlertTriangle, Calendar, CreditCard, Receipt, Zap } from "lucide-react";
import { useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Billing() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;

  const { data: preview, isLoading: previewLoading } = trpc.billing.getBillingPreview.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: billing, isLoading: billingLoading } = trpc.billing.current.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: history, isLoading: historyLoading } = trpc.billing.history.useQuery(
    { projectId: projectId!, limit: 6 },
    { enabled: !!projectId }
  );

  const usagePercentage =
    preview && preview.quota > 0
      ? Math.min((preview.creditsUsed / preview.quota) * 100, 100)
      : 0;
  const isNearingLimit = preview?.status === "nearing_limit";
  const isOverQuota = preview?.status === "over_quota";
  const planKey =
    preview?.planName?.toLowerCase() === "free"
      ? "free"
      : preview?.planName?.toLowerCase() === "pro"
        ? "pro"
        : preview?.planName?.toLowerCase() === "enterprise"
          ? "enterprise"
          : null;
  const planLabel = planKey ? t(`billing.plan.${planKey}.name`) : preview?.planName ?? "";

  const quotaStatusLabel =
    preview?.status === "over_quota"
      ? t("billing.status.overQuota")
      : preview?.status === "nearing_limit"
        ? t("billing.status.nearingLimit")
        : t("billing.status.normal");

  return (
    <ProjectDashboardLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("billing.title")}</h1>
          <p className="text-muted-foreground">{t("billing.subtitle")}</p>
        </div>

        {/* Credits & Quota (source: usage_logs) */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t("billing.creditsThisMonth")}</CardTitle>
                {preview && (
                  <CardDescription>
                    {format(new Date(preview.periodStart), "MMMM d")} –{" "}
                    {format(new Date(preview.periodEnd), "MMMM d, yyyy")} · {planLabel} {t("billing.planSuffix")}
                  </CardDescription>
                )}
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {previewLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : preview ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("billing.creditsUsed")}</span>
                    <span className="text-sm font-medium">
                      {preview.creditsUsed.toLocaleString()} / {preview.quota.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={usagePercentage}
                    className={`h-3 ${isOverQuota ? "bg-destructive/20" : isNearingLimit ? "bg-chart-3/20" : ""}`}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {usagePercentage.toFixed(1)}% {t("billing.used")}
                    </span>
                    <span className="text-muted-foreground">
                      {preview.creditsRemaining.toLocaleString()} {t("billing.remaining")}
                    </span>
                  </div>
                </div>

                {(isNearingLimit || isOverQuota) && (
                  <div
                    className={`p-4 rounded-lg flex items-start gap-3 ${
                      isOverQuota
                        ? "bg-destructive/10 border border-destructive/20"
                        : "bg-chart-3/10 border border-chart-3/20"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 shrink-0 ${isOverQuota ? "text-destructive" : "text-chart-3"}`}
                    />
                    <div>
                      <p className={`font-medium ${isOverQuota ? "text-destructive" : "text-chart-3"}`}>
                        {isOverQuota ? t("billing.status.overQuota") : t("billing.status.nearingLimit")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isOverQuota
                          ? t("billing.overQuotaDescription")
                          : t("billing.nearingLimitDescription")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t("billing.creditsUsed")}</span>
                    </div>
                    <p className="text-2xl font-bold">{preview.creditsUsed.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t("billing.remaining")}</span>
                    </div>
                    <p className="text-2xl font-bold">{preview.creditsRemaining.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t("billing.quotaStatus")}</span>
                    </div>
                    <p className="text-2xl font-bold capitalize">{quotaStatusLabel}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">{t("billing.empty")}</p>
            )}
          </CardContent>
        </Card>

        {/* Pricing Tiers (credit-based, no payment gateway yet) */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t("billing.plansTitle")}</CardTitle>
            <CardDescription>{t("billing.plansDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-6 bg-secondary rounded-lg border border-border/50">
                <h3 className="font-semibold mb-2">{t("billing.plan.free.name")}</h3>
                <p className="text-3xl font-bold mb-4">{t("billing.plan.free.price")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t("billing.plan.free.feature1")}</li>
                  <li>• {t("billing.plan.free.feature2")}</li>
                  <li>• {t("billing.plan.free.feature3")}</li>
                </ul>
              </div>
              <div className="p-6 bg-primary/10 rounded-lg border border-primary/30 relative">
                <span className="absolute -top-3 left-4 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                  {t("billing.plan.popular")}
                </span>
                <h3 className="font-semibold mb-2">{t("billing.plan.pro.name")}</h3>
                <p className="text-3xl font-bold mb-4">
                  {t("billing.plan.pro.price")}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t("billing.plan.pro.feature1")}</li>
                  <li>• {t("billing.plan.pro.feature2")}</li>
                  <li>• {t("billing.plan.pro.feature3")}</li>
                  <li>• {t("billing.plan.pro.feature4")}</li>
                </ul>
              </div>
              <div className="p-6 bg-secondary rounded-lg border border-border/50">
                <h3 className="font-semibold mb-2">{t("billing.plan.enterprise.name")}</h3>
                <p className="text-3xl font-bold mb-4">{t("billing.plan.enterprise.price")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t("billing.plan.enterprise.feature1")}</li>
                  <li>• {t("billing.plan.enterprise.feature2")}</li>
                  <li>• {t("billing.plan.enterprise.feature3")}</li>
                  <li>• {t("billing.plan.enterprise.feature4")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t("billing.historyTitle")}</CardTitle>
            <CardDescription>{t("billing.historyDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {format(new Date(item.billingCycleStart), "MMMM yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.totalRequests.toLocaleString()} {t("billing.requests")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${((item.totalCost || 0) / 100).toFixed(2)}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          item.status === "paid"
                            ? "bg-chart-2/20 text-chart-2"
                            : item.status === "exceeded"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {t(`billing.status.${item.status}`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t("billing.historyEmpty")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProjectDashboardLayout>
  );
}
