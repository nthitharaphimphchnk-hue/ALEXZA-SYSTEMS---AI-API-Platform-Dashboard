import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { isMockMode } from "@/_core/mock/mockMode";
import { Activity, Clock, TrendingUp, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState } from "react";
import { useParams } from "wouter";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Usage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;
  const [timeRange, setTimeRange] = useState("24");
  const { t } = useLanguage();

  const { data: stats, isLoading: statsLoading } = trpc.usage.stats.useQuery(
    { projectId: projectId!, hours: parseInt(timeRange) },
    { enabled: !!projectId }
  );

  const { data: hourlyData, isLoading: hourlyLoading } = trpc.usage.byHour.useQuery(
    { projectId: projectId!, hours: parseInt(timeRange) },
    { enabled: !!projectId }
  );

  const { data: preview } = trpc.billing.getBillingPreview.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const chartData = hourlyData?.map((item) => ({
    hour: new Date(item.hour).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    requests: item.requests,
  })) || [];

  type ActivityRow = {
    timestamp: string;
    endpoint: string;
    status: number;
    responseTimeMs: number;
    credits: number;
  };

  const recentActivity: ActivityRow[] = useMemo(() => {
    if (!isMockMode()) return [];

    // Best-effort: read mock events if present; otherwise generate stable-looking rows.
    try {
      const raw = localStorage.getItem("alexza_mock_usage_events");
      if (raw) {
        const parsed = JSON.parse(raw) as any[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed
            .filter((e) => !projectId || e.projectId === projectId)
            .map((e) => ({
              timestamp: String(e.timestamp),
              endpoint: String(e.endpoint),
              status: Number(e.status),
              responseTimeMs: Number(e.responseTimeMs),
              credits: Number(e.credits ?? 1),
            })) as ActivityRow[];
          if (filtered.length > 0) return filtered.slice(0, 12);
        }
      }
    } catch {
      // ignore
    }

    const now = Date.now();
    return Array.from({ length: 10 }).map((_, i) => ({
      timestamp: new Date(now - i * 6 * 60_000).toISOString(),
      endpoint: "POST /tti/decide-font",
      status: i % 9 === 0 ? 429 : 200,
      responseTimeMs: 90 + (i * 17) % 120,
      credits: 1,
    }));
  }, [projectId, timeRange]);

  return (
    <ProjectDashboardLayout>
      <div className="space-y-6">
        {/* Header with Branding */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/alexza-logo-full.png" alt="ALEXZA SYSTEMS" className="h-10 w-auto" />
            <div>
              <h2 className="text-lg font-semibold">ALEXZA SYSTEMS</h2>
              <p className="text-sm text-muted-foreground">Developer Platform for AI APIs</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Usage Analytics</h1>
              <p className="text-muted-foreground">
                Monitor your API usage patterns and performance metrics.
              </p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
              <SelectItem value="720">Last 30 days</SelectItem>
            </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary (answers: How much? Is it working? Close to limits?) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Requests
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.totalRequests.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
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
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stats?.avgResponseTime || 0}ms</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credits used
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {preview ? `${preview.creditsUsed.toLocaleString()} / ${preview.quota.toLocaleString()}` : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">Credits are counted per request.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage over time + Recent activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Requests Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Request Volume</CardTitle>
              <CardDescription>Requests over time</CardDescription>
            </CardHeader>
            <CardContent>
              {hourlyLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : stats && stats.totalRequests > 0 && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="hour"
                      stroke="oklch(0.6 0 0)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="oklch(0.6 0 0)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.16 0 0)",
                        border: "1px solid oklch(0.28 0 0)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "oklch(0.95 0 0)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="oklch(0.65 0.18 250)"
                      strokeWidth={2}
                      fill="url(#requestGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <EmptyState icon={Activity} title={t("empty.noData")} description={t("empty.noDataDesc")} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Recent activity</CardTitle>
              <CardDescription>Latest requests and status</CardDescription>
            </CardHeader>
            <CardContent>
              {isMockMode() ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Latency</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((row) => (
                      <TableRow key={`${row.timestamp}-${row.endpoint}`}>
                        <TableCell className="text-muted-foreground">
                          {new Date(row.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.endpoint}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              row.status >= 200 && row.status < 400
                                ? "bg-muted/50 text-foreground"
                                : row.status === 429
                                  ? "bg-chart-3/10 text-chart-3"
                                  : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {row.responseTimeMs}ms
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {row.credits}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <EmptyState
                    icon={Activity}
                    title="Recent activity"
                    description="Recent request logs will appear here."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProjectDashboardLayout>
  );
}
