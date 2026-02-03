import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { AlertTriangle, Calendar, CreditCard, Receipt, Zap } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function Billing() {
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

  const { data: plans, isLoading: plansLoading } = trpc.billing.listPlans.useQuery(undefined, {
    enabled: true,
  });

  const utils = trpc.useUtils();
  const changePlanMutation = trpc.billing.changePlan.useMutation({
    onSuccess: () => {
      utils.billing.getBillingPreview.invalidate({ projectId: projectId! });
      utils.project.get.invalidate({ id: projectId! });
      toast.success("Plan updated");
    },
    onError: (e) => {
      toast.error(e.message || "Failed to change plan");
    },
  });

  const currentPlanId = preview?.planId ?? "free";

  const usagePercentage =
    preview?.percentUsed ?? (preview && preview.quota > 0
      ? Math.min((preview.creditsUsed / preview.quota) * 100, 100)
      : 0);
  const isNearingLimit = preview?.status === "nearing_limit";
  const isOverQuota = preview?.status === "over_quota";

  const quotaStatusLabel =
    preview?.status === "over_quota"
      ? "ใช้เกิน (soft limit)"
      : preview?.status === "nearing_limit"
        ? "ใกล้หมด"
        : "ปกติ";

  return (
    <ProjectDashboardLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Credits and quota based on API usage. 1 request = 1 credit.
          </p>
        </div>

        {/* Credits & Quota – from MongoDB usageLogs (billing preview only; no real charges) */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Credits This Month</CardTitle>
                {preview && (
                  <CardDescription>
                    {format(new Date(preview.periodStart), "MMMM d")} –{" "}
                    {format(new Date(preview.periodEnd), "MMMM d, yyyy")} · {preview.planName} plan
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
                    <span className="text-sm text-muted-foreground">Credits used</span>
                    <span className="text-sm font-medium">
                      {preview.creditsUsed.toLocaleString()} / {preview.quota.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={usagePercentage}
                    className={`h-3 ${isOverQuota ? "bg-destructive/20" : isNearingLimit ? "bg-chart-3/20" : ""}`}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{usagePercentage.toFixed(1)}% used</span>
                    <span className="text-muted-foreground">
                      {preview.creditsRemaining.toLocaleString()} remaining
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
                        {isOverQuota ? "ใช้เกิน (soft limit)" : "ใกล้หมด"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isOverQuota
                          ? "ใช้เครดิตเกินโควตารายเดือนแล้ว ยังเรียก API ได้ (soft limit ไม่บล็อก)"
                          : "กำลังใกล้ถึงโควตารายเดือน พิจารณาอัปเกรดแผน"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Credits used</span>
                    </div>
                    <p className="text-2xl font-bold">{preview.creditsUsed.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Remaining</span>
                    </div>
                    <p className="text-2xl font-bold">{preview.creditsRemaining.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Quota status</span>
                    </div>
                    <p className="text-2xl font-bold">{quotaStatusLabel}</p>
                  </div>
                </div>
              </>
            ) : !projectId ? (
              <p className="text-muted-foreground">Select a project to view usage.</p>
            ) : (
              <p className="text-muted-foreground">No billing information available.</p>
            )}
          </CardContent>
        </Card>

        {/* Plan selection (UX only; no real payment) */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Plan / Package</CardTitle>
            <CardDescription>
              Credit-based quotas (1 API request = 1 credit). No charge yet — for display only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-lg" />
                ))}
              </div>
            ) : plans && plans.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {plans.map((plan) => {
                  const isCurrent = currentPlanId === plan._id;
                  const isEnterprise = plan._id === "enterprise";
                  const creditsLabel =
                    plan.monthlyCredits === 0
                      ? "Custom"
                      : `${plan.monthlyCredits.toLocaleString()} credits/mo`;

                  return (
                    <div
                      key={plan._id}
                      className={`relative p-6 rounded-lg border ${
                        isCurrent
                          ? "bg-primary/10 border-primary/30"
                          : "bg-secondary border-border/50"
                      } ${plan._id === "pro" && !isCurrent ? "border-primary/20" : ""}`}
                    >
                      {plan._id === "pro" && (
                        <span className="absolute -top-3 left-4 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                          Popular
                        </span>
                      )}
                      <h3 className="font-semibold mb-2">{plan.name}</h3>
                      <p className="text-3xl font-bold mb-4">{creditsLabel}</p>
                      <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                        {plan._id === "free" && (
                          <>
                            <li>• 1,000 credits per month</li>
                            <li>• Basic analytics</li>
                            <li>• Soft limit when exceeded</li>
                          </>
                        )}
                        {plan._id === "pro" && (
                          <>
                            <li>• 50,000 credits/month</li>
                            <li>• Advanced analytics</li>
                            <li>• Priority support</li>
                          </>
                        )}
                        {plan._id === "enterprise" && (
                          <>
                            <li>• Custom volume</li>
                            <li>• Dedicated support</li>
                            <li>• SLA guarantee</li>
                          </>
                        )}
                      </ul>
                      {isEnterprise ? (
                        <Button variant="outline" className="w-full" disabled>
                          Contact sales
                        </Button>
                      ) : isCurrent ? (
                        <Button variant="secondary" className="w-full" disabled>
                          Current plan
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() =>
                            changePlanMutation.mutate({
                              projectId: projectId!,
                              planId: plan._id,
                            })
                          }
                          disabled={changePlanMutation.isPending}
                        >
                          {changePlanMutation.isPending ? "Updating…" : "Select"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No plans available.</p>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Billing History</CardTitle>
            <CardDescription>Previous billing cycles and invoices</CardDescription>
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
                        {item.totalRequests.toLocaleString()} requests
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
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No billing history available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProjectDashboardLayout>
  );
}
