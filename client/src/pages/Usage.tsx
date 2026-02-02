import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Activity, Clock, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
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

  const chartData = hourlyData?.map((item) => ({
    hour: new Date(item.hour).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    requests: item.requests,
    cost: (item.cost || 0) / 100,
  })) || [];

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

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
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
                Total Cost
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  ${((stats?.totalCost || 0) / 100).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Requests Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Request Volume</CardTitle>
              <CardDescription>API requests over time</CardDescription>
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
                  <EmptyState
                    icon={BarChart3}
                    title={t("empty.noData")}
                    description={t("empty.noDataDesc")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Cost Over Time</CardTitle>
              <CardDescription>API usage costs</CardDescription>
            </CardHeader>
            <CardContent>
              {hourlyLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : stats && stats.totalRequests > 0 && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0} />
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
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.16 0 0)",
                        border: "1px solid oklch(0.28 0 0)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "oklch(0.95 0 0)" }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="oklch(0.7 0.15 160)"
                      strokeWidth={2}
                      fill="url(#costGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <EmptyState
                    icon={BarChart3}
                    title={t("empty.noData")}
                    description={t("empty.noDataDesc")}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Performance Insights</CardTitle>
            <CardDescription>Key metrics and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Peak Usage Time</p>
                <p className="text-lg font-semibold">
                  {chartData.length > 0
                    ? chartData.reduce((max, item) =>
                        item.requests > max.requests ? item : max
                      ).hour
                    : "N/A"}
                </p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avg Requests/Hour</p>
                <p className="text-lg font-semibold">
                  {chartData.length > 0
                    ? Math.round(
                        chartData.reduce((sum, item) => sum + item.requests, 0) / chartData.length
                      )
                    : 0}
                </p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Cost/Request</p>
                <p className="text-lg font-semibold">
                  ${stats?.totalRequests ? ((stats.totalCost || 0) / stats.totalRequests / 100).toFixed(4) : "0.0000"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProjectDashboardLayout>
  );
}
