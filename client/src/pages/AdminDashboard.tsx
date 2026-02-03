/**
 * Admin / Internal Dashboard – for role = admin only. Debug use.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: topProjects, isLoading: topLoading } = trpc.admin.getTopProjectsByUsage.useQuery(
    { limit: 50 },
    { enabled: user?.role === "admin" }
  );

  const { data: recentErrors, isLoading: errorsLoading } = trpc.admin.getRecentErrors.useQuery(
    { limit: 50 },
    { enabled: user?.role === "admin" }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md w-full border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              <CardTitle>Forbidden</CardTitle>
            </div>
            <CardDescription>
              This page is for administrators only. You do not have the required permission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">|</span>
          <h1 className="text-lg font-semibold">Admin (Internal)</h1>
        </div>
        <span className="text-xs text-muted-foreground">Debug only</span>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Top projects by usage</CardTitle>
            <CardDescription>
              All projects sorted by total credits used (all time). Internal view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : topProjects && topProjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project name</TableHead>
                    <TableHead className="text-right">Credits used</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProjects.map((row) => (
                    <TableRow key={row.projectId}>
                      <TableCell className="font-medium">{row.projectName}</TableCell>
                      <TableCell className="text-right">
                        {row.creditsUsed.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.requestCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {row.errorCount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No usage data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recent errors
            </CardTitle>
            <CardDescription>
              Latest failed requests from usageLogs (success = false).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : recentErrors && recentErrors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-muted-foreground">Endpoint</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentErrors.map((row, i) => (
                    <TableRow key={`${row.projectId}-${row.createdAt}-${i}`}>
                      <TableCell className="font-medium">{row.projectName}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(row.createdAt), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={row.errorMessage ?? ""}>
                        {row.errorMessage ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.endpoint ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No recent errors.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
